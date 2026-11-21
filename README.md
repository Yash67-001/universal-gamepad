# Universal Gamepad
### Turn Every Smartphone Into a Wireless Gaming Controller

Universal Gamepad is a high-performance, cross-platform wireless game controller system. It allows anyone to scan a QR code with their iPhone, Android phone, or tablet and immediately start playing games on their Mac or Windows PC with sub-millisecond local latency.

---

## Key Features

- **Instant Zero-Install Mobile Controller:** Runs in mobile Safari, Chrome, Edge, and Samsung Internet as a Progressive Web App (PWA) with zero App Store installations required.
- **Genuine Multi-Touch Input Engine:** Independent tracking per `pointerId` using Pointer Events API. Simultaneous button presses (e.g., A + X + Left Stick + Trigger) with zero ghosting.
- **Dual Analog Joysticks:** True 360-degree analog control with configurable radial deadzones, circular boundary clamping, sensitivity curves (Linear, Exponential, S-Curve), and L3/R3 click support.
- **Ultra-Compact Binary Protocol:** 20-byte binary packet streaming at 60Hz–120Hz via WebSockets (`<1.5ms` RTT over 5GHz Wi-Fi).
- **Dead-Man Failsafe Watchdog:** 250ms activity watchdog prevents stuck buttons on screen lock, incoming phone calls, or network drops.
- **Acoustic Tactile Feedback:** Web Audio impulse synthesizer simulates physical tactile button clicks on iOS devices where `navigator.vibrate` is blocked.
- **Hardware-Level Driver Architecture:**
  - **macOS (DriverKit Mode A):** True virtual Xbox Wireless Controller recognized directly by macOS System Settings > Game Controllers, Apple Arcade, Steam, and `hardwaretester.com`.
  - **Windows (ViGEm Mode A):** True virtual Xbox 360 controller recognized by Steam, GamePass, and PC games.
  - **Mode B (macOS & Windows):** Zero-install input synthesis (WASD, Arrows, Space, Shift) for legacy web & retro games.
- **Dedicated Mouse Touchpad & True Analog RS:** Pop-out `🖱️ MOUSE PAD` provides full mouse navigation, while the Right Stick (`RS`) acts strictly as a genuine 360° controller thumbstick for camera look and aiming.
- **Live Input Tester & Dashboard:** Real-time visual controller tester with Gamepad-Tester grid toggle, live latency monitor (RTT ms, packet count), network interface selector, and one-time QR / 4-digit PIN pairing.

---

## Project Structure

```
universal-gamepad/
├── apps/
│   ├── desktop/             # Desktop Companion Host & Live Dashboard
│   └── mobile-controller/   # Mobile PWA Controller (React 18 + Vite + Tailwind)
├── packages/
│   ├── shared-protocol/     # Binary packet encoder/decoder & shared types
│   └── controller-core/     # Analog math, radial deadzones, profiles, watchdog
├── tests/
│   ├── unit/                # Binary encoding, decoding & deadzone unit tests
│   └── integration/         # WebSocket handshake, 60Hz packet streaming tests
└── docs/                    # Architecture, setup, and troubleshooting guides
```

---

## Live Demos & Links

* 📱 **Live Mobile Controller:** [https://yash67-001.github.io/universal-gamepad/](https://yash67-001.github.io/universal-gamepad/)
* 🖥️ **Live Computer Dashboard Preview:** [https://yash67-001.github.io/universal-gamepad/dashboard/](https://yash67-001.github.io/universal-gamepad/dashboard/)

---

## Quickstart

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run the Desktop Host on PC or Mac
```bash
npm start
```
The terminal prints your live connection links and opens your local host:
* **🖥️ Computer Dashboard (QR & Stats):** `http://localhost:8080/dashboard`
* **📱 Phone Pairing URL:** `http://<your-ip>:8080/`
* **🔑 4-Digit PIN:** Displayed on your screen

### 3. Connect & Play
Open the **Computer Dashboard** in your computer's browser (`http://localhost:8080/dashboard`). Scan the displayed QR code with your smartphone's camera, rotate to landscape, and start gaming!
