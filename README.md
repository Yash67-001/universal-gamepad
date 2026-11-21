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
- **Dual Driver Architecture:**
  - **Mode A (Windows ViGEm):** True virtual Xbox 360 controller recognized by Steam, GamePass, and PC games.
  - **Mode B (macOS & Windows):** Native input synthesis (WASD, Arrows, Space, Shift, Mouse Look) with custom profiles.
- **Live Input Tester & Dashboard:** Real-time visual controller tester, live latency monitor (RTT ms, packet count), network interface selector, and one-time QR / 4-digit PIN pairing.

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

## Quickstart

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run the Desktop Host
```bash
npm start
```

### 3. Run All Unit & Integration Tests
```bash
npm test
```

### 4. Connect Phone
Scan the QR code displayed in your terminal or dashboard with your phone's camera, rotate to landscape, and start gaming!
