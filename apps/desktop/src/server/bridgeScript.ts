export const GAMEPAD_TESTER_BRIDGE_SCRIPT = `(function() {
  if (window.__universalGamepadBridgeActive) {
    console.log("[Universal Gamepad] Bridge already active in this tab.");
    return;
  }
  window.__universalGamepadBridgeActive = true;

  console.log("%c[Universal Gamepad] Gamepad-Tester Bridge Initializing...", "color: #00F0FF; font-weight: bold; font-size: 14px;");

  // Create standard 17-button Gamepad buttons
  var buttons = [];
  for (var i = 0; i < 17; i++) {
    buttons.push({ pressed: false, value: 0.0, touched: false });
  }

  // 4 Standard W3C Axes: [LeftStickX, LeftStickY, RightStickX, RightStickY]
  var axes = [0.0, 0.0, 0.0, 0.0];

  var virtualGamepad = {
    id: "Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)",
    index: 0,
    connected: true,
    timestamp: performance.now(),
    mapping: "standard",
    axes: axes,
    buttons: buttons,
    vibrationActuator: null
  };

  // Polyfill / Hook navigator.getGamepads
  var originalGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
  navigator.getGamepads = function() {
    var list = [];
    if (originalGetGamepads) {
      try {
        var raw = originalGetGamepads();
        if (raw) list = Array.from(raw);
      } catch (e) {}
    }
    while (list.length < 1) list.push(null);
    list[0] = virtualGamepad;
    return list;
  };

  // Add floating cyber badge HUD in top-right of page
  var badge = document.createElement("div");
  badge.id = "ug-bridge-hud";
  badge.innerHTML = '<div style="position:fixed;top:12px;right:16px;z-index:999999;background:rgba(10,18,32,0.92);border:1px solid #00F0FF;border-radius:20px;padding:6px 14px;display:flex;align-items:center;gap:8px;font-family:ui-monospace,monospace;font-size:11px;color:#E2E8F0;box-shadow:0 0 15px rgba(0,240,255,0.4);backdrop-filter:blur(8px);pointer-events:none;"><span id="ug-indicator" style="width:8px;height:8px;border-radius:50%;background:#F59E0B;display:inline-block;box-shadow:0 0 8px #F59E0B;"></span><span style="font-weight:bold;color:#00F0FF;">UNIVERSAL GAMEPAD</span><span id="ug-status" style="color:#94A3B8;">Connecting...</span></div>';
  if (document.body) {
    document.body.appendChild(badge);
  } else {
    window.addEventListener("DOMContentLoaded", function() {
      document.body.appendChild(badge);
    });
  }

  function updateHud(connected, text) {
    var ind = document.getElementById("ug-indicator");
    var st = document.getElementById("ug-status");
    if (ind) {
      ind.style.background = connected ? "#10B981" : "#F59E0B";
      ind.style.boxShadow = connected ? "0 0 8px #10B981" : "0 0 8px #F59E0B";
    }
    if (st) st.textContent = text;
  }

  function emitGamepadConnected() {
    try {
      var event = new GamepadEvent("gamepadconnected", { gamepad: virtualGamepad });
      window.dispatchEvent(event);
    } catch (e) {
      window.dispatchEvent(new Event("gamepadconnected"));
    }
  }

  var ws = null;
  function connect() {
    var host = window.__ug_host || "127.0.0.1";
    var port = window.__ug_port || 8080;
    ws = new WebSocket("ws://" + host + ":" + port + "/desktop-ws");

    ws.onopen = function() {
      console.log("%c[Universal Gamepad] Connected to Desktop Daemon (120Hz)!", "color: #10B981; font-weight: bold;");
      updateHud(true, "ACTIVE (120Hz)");
      emitGamepadConnected();
    };

    ws.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);
        var state = msg.state || (msg.data && msg.data.latestGamepadState);
        if (!state) return;

        virtualGamepad.timestamp = performance.now();

        // Standard W3C mapping:
        // Axes: [LS-X, LS-Y, RS-X, RS-Y].
        // In Gamepad API, UP is negative, DOWN is positive!
        axes[0] = Number((state.axes.leftX || 0).toFixed(4));
        axes[1] = Number((-(state.axes.leftY || 0)).toFixed(4));
        axes[2] = Number((state.axes.rightX || 0).toFixed(4));
        axes[3] = Number((-(state.axes.rightY || 0)).toFixed(4));

        var b = state.buttons || {};
        var t = state.triggers || {};

        // B0: A, B1: B, B2: X, B3: Y
        buttons[0].pressed = !!b.a;
        buttons[0].value = b.a ? 1.0 : 0.0;
        buttons[1].pressed = !!b.b;
        buttons[1].value = b.b ? 1.0 : 0.0;
        buttons[2].pressed = !!b.x;
        buttons[2].value = b.x ? 1.0 : 0.0;
        buttons[3].pressed = !!b.y;
        buttons[3].value = b.y ? 1.0 : 0.0;

        // B4: L1 Bumper, B5: R1 Bumper
        buttons[4].pressed = !!b.l1;
        buttons[4].value = b.l1 ? 1.0 : 0.0;
        buttons[5].pressed = !!b.r1;
        buttons[5].value = b.r1 ? 1.0 : 0.0;

        // B6: L2 Trigger (Analog 0..1), B7: R2 Trigger (Analog 0..1)
        var l2Val = Number((t.l2 || 0).toFixed(4));
        var r2Val = Number((t.r2 || 0).toFixed(4));
        buttons[6].value = l2Val;
        buttons[6].pressed = l2Val > 0.1;
        buttons[7].value = r2Val;
        buttons[7].pressed = r2Val > 0.1;

        // B8: Select, B9: Start, B10: L3, B11: R3
        buttons[8].pressed = !!b.select;
        buttons[8].value = b.select ? 1.0 : 0.0;
        buttons[9].pressed = !!b.start;
        buttons[9].value = b.start ? 1.0 : 0.0;
        buttons[10].pressed = !!b.l3;
        buttons[10].value = b.l3 ? 1.0 : 0.0;
        buttons[11].pressed = !!b.r3;
        buttons[11].value = b.r3 ? 1.0 : 0.0;

        // B12: D-Pad Up, B13: D-Pad Down, B14: D-Pad Left, B15: D-Pad Right
        buttons[12].pressed = !!b.dpadUp;
        buttons[12].value = b.dpadUp ? 1.0 : 0.0;
        buttons[13].pressed = !!b.dpadDown;
        buttons[13].value = b.dpadDown ? 1.0 : 0.0;
        buttons[14].pressed = !!b.dpadLeft;
        buttons[14].value = b.dpadLeft ? 1.0 : 0.0;
        buttons[15].pressed = !!b.dpadRight;
        buttons[15].value = b.dpadRight ? 1.0 : 0.0;

        // B16: Home / Guide
        buttons[16].pressed = !!b.home;
        buttons[16].value = b.home ? 1.0 : 0.0;

        // Ensure connected event fired
        if (!window.__gamepadEventDispatched) {
          window.__gamepadEventDispatched = true;
          emitGamepadConnected();
        }
      } catch (err) {}
    };

    ws.onclose = function() {
      updateHud(false, "Reconnecting...");
      setTimeout(connect, 1500);
    };

    ws.onerror = function() {
      updateHud(false, "Server Offline");
    };
  }

  connect();
})();
`;
