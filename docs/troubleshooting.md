# Universal Gamepad — Troubleshooting Guide

### 1. Phone Cannot Connect / QR Code Doesn't Load
* **Router Client Isolation:** Some hotel, school, or guest Wi-Fi networks block devices on the same Wi-Fi from communicating directly.
  * *Solution:* Enable your computer's built-in **Mobile Hotspot** (Windows: Settings -> Network -> Mobile Hotspot; Mac: System Settings -> Sharing -> Internet Sharing). Connect your smartphone directly to this hotspot for guaranteed <2ms connection.
* **Firewall Restrictions:** Ensure port 8080 (or custom configured port) is allowed in your computer's firewall for local traffic.

### 2. Fullscreen on iPhone Safari
* On iPhone Safari, Apple removes the standard HTML5 `requestFullscreen` API.
* *Solution:* Tap the Safari Share button (square with upward arrow) and select **"Add to Home Screen"**. Launching the controller from your Home Screen runs in standalone mode with 100% full screen and no Safari address bars!

### 3. Haptics / Vibration on iOS
* Apple does not support the HTML5 `navigator.vibrate` API on iOS Safari.
* *Solution:* Universal Gamepad automatically enables its **Acoustic Tactile Feedback Synthesizer**, which plays a 0ms low-latency mechanical click impulse through the device speakers and internal haptic coil.

### 4. Stuck Buttons
* Universal Gamepad includes a **Hardware Dead-Man Watchdog**. If a connection drop, incoming phone call, or tab switch occurs, the server automatically flushes all pressed buttons to neutral within 250ms.
