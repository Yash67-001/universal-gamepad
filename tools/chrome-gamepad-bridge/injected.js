// Runs directly in page execution context to hook navigator.getGamepads
(function() {
  if (window.__ugInjectedActive) return;
  window.__ugInjectedActive = true;

  console.log("%c[Universal Gamepad] Injected Gamepad Hook Initialized", "color:#00F0FF;font-weight:bold;");

  var buttons = [];
  for (var i = 0; i < 17; i++) {
    buttons.push({ pressed: false, value: 0.0, touched: false });
  }

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

  var origGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
  navigator.getGamepads = function() {
    var list = [];
    if (origGetGamepads) {
      try {
        var raw = origGetGamepads();
        if (raw) list = Array.from(raw);
      } catch (e) {}
    }
    while (list.length < 1) list.push(null);
    list[0] = virtualGamepad;
    return list;
  };

  function emitGamepadConnected() {
    try {
      var event = new GamepadEvent("gamepadconnected", { gamepad: virtualGamepad });
      window.dispatchEvent(event);
    } catch (e) {
      window.dispatchEvent(new Event("gamepadconnected"));
    }
  }

  // Listen for relayed state updates from content.js
  window.addEventListener("message", function(e) {
    if (e.source !== window || !e.data || e.data.type !== "UG_RELAY_STATE") return;
    var state = e.data.state;
    if (!state) return;

    // Advance timestamp every frame so hardwaretester.com detects change
    virtualGamepad.timestamp = performance.now();

    axes[0] = Number((state.axes.leftX || 0).toFixed(4));
    axes[1] = Number((-(state.axes.leftY || 0)).toFixed(4));
    axes[2] = Number((state.axes.rightX || 0).toFixed(4));
    axes[3] = Number((-(state.axes.rightY || 0)).toFixed(4));

    var b = state.buttons || {};
    var t = state.triggers || {};

    buttons[0].pressed = !!b.a;
    buttons[0].value = b.a ? 1.0 : 0.0;
    buttons[1].pressed = !!b.b;
    buttons[1].value = b.b ? 1.0 : 0.0;
    buttons[2].pressed = !!b.x;
    buttons[2].value = b.x ? 1.0 : 0.0;
    buttons[3].pressed = !!b.y;
    buttons[3].value = b.y ? 1.0 : 0.0;

    buttons[4].pressed = !!b.l1;
    buttons[4].value = b.l1 ? 1.0 : 0.0;
    buttons[5].pressed = !!b.r1;
    buttons[5].value = b.r1 ? 1.0 : 0.0;

    var l2Val = Number((t.l2 || 0).toFixed(4));
    var r2Val = Number((t.r2 || 0).toFixed(4));
    buttons[6].value = l2Val;
    buttons[6].pressed = l2Val > 0.1;
    buttons[7].value = r2Val;
    buttons[7].pressed = r2Val > 0.1;

    buttons[8].pressed = !!b.select;
    buttons[8].value = b.select ? 1.0 : 0.0;
    buttons[9].pressed = !!b.start;
    buttons[9].value = b.start ? 1.0 : 0.0;
    buttons[10].pressed = !!b.l3;
    buttons[10].value = b.l3 ? 1.0 : 0.0;
    buttons[11].pressed = !!b.r3;
    buttons[11].value = b.r3 ? 1.0 : 0.0;

    buttons[12].pressed = !!b.dpadUp;
    buttons[12].value = b.dpadUp ? 1.0 : 0.0;
    buttons[13].pressed = !!b.dpadDown;
    buttons[13].value = b.dpadDown ? 1.0 : 0.0;
    buttons[14].pressed = !!b.dpadLeft;
    buttons[14].value = b.dpadLeft ? 1.0 : 0.0;
    buttons[15].pressed = !!b.dpadRight;
    buttons[15].value = b.dpadRight ? 1.0 : 0.0;

    buttons[16].pressed = !!b.home;
    buttons[16].value = b.home ? 1.0 : 0.0;

    if (!window.__ugGamepadDispatched) {
      window.__ugGamepadDispatched = true;
      emitGamepadConnected();
    }
  });

  // Emit initial connection event
  emitGamepadConnected();
})();
