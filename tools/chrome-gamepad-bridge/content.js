// Content script: bridges extension background service worker with page context
(function() {
  // Inject the script into page context
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("injected.js");
  s.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);

  // Floating Cyber Badge HUD
  const badge = document.createElement("div");
  badge.id = "ug-bridge-hud";
  badge.innerHTML = '<div style="position:fixed;top:12px;right:16px;z-index:999999;background:rgba(10,18,32,0.92);border:1px solid #00F0FF;border-radius:20px;padding:6px 14px;display:flex;align-items:center;gap:8px;font-family:ui-monospace,monospace;font-size:11px;color:#E2E8F0;box-shadow:0 0 15px rgba(0,240,255,0.4);backdrop-filter:blur(8px);pointer-events:none;"><span id="ug-indicator" style="width:8px;height:8px;border-radius:50%;background:#10B981;display:inline-block;box-shadow:0 0 8px #10B981;"></span><span style="font-weight:bold;color:#00F0FF;">UNIVERSAL GAMEPAD</span><span id="ug-status" style="color:#94A3B8;">ACTIVE (120Hz)</span></div>';
  if (document.body) {
    document.body.appendChild(badge);
  } else {
    window.addEventListener("DOMContentLoaded", () => document.body.appendChild(badge));
  }

  // Forward updates from background script into page context
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "UG_STATE_UPDATE") {
      window.postMessage({ type: "UG_RELAY_STATE", state: message.state }, "*");
    }
  });

  // Request immediate initial state
  chrome.runtime.sendMessage({ type: "UG_GET_STATE" }, (response) => {
    if (response && response.state) {
      window.postMessage({ type: "UG_RELAY_STATE", state: response.state }, "*");
    }
  });
})();
