// Background Service Worker: Maintains WebSocket to local daemon and relays state to content script
let ws = null;
let lastState = null;

function connectDaemon() {
  try {
    ws = new WebSocket("ws://127.0.0.1:8080/desktop-ws");

    ws.onopen = () => {
      console.log("[UG Background] Connected to local Universal Gamepad daemon (120Hz).");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const state = data.state || (data.data && data.data.latestGamepadState);
        if (!state) return;
        lastState = state;

        // Broadcast to all active tabs
        chrome.tabs.query({}, (tabs) => {
          for (const tab of tabs) {
            if (tab.id && tab.url && (tab.url.includes("hardwaretester.com") || tab.url.includes("gamepad-tester.com") || tab.url.includes("gamepad-tester.net"))) {
              chrome.tabs.sendMessage(tab.id, { type: "UG_STATE_UPDATE", state }).catch(() => {});
            }
          }
        });
      } catch (err) {}
    };

    ws.onclose = () => {
      setTimeout(connectDaemon, 1500);
    };

    ws.onerror = () => {
      try { ws.close(); } catch (e) {}
    };
  } catch (err) {
    setTimeout(connectDaemon, 2000);
  }
}

connectDaemon();

// Listen for tab request for current state
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "UG_GET_STATE" && lastState) {
    sendResponse({ state: lastState });
  }
});
