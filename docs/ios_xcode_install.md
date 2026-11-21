# Native iOS App Installation Guide (Xcode)
### Install Universal Gamepad Directly onto your iPhone

This guide walks you through compiling and installing the native iOS app onto your iPhone using your Mac and Xcode with a free Apple ID.

---

## 1. Prerequisites
1. **Mac Computer** running macOS Monterey, Ventura, Sonoma, or Sequoia.
2. **Xcode** installed from the **Mac App Store** (Free).
3. **iPhone** (any model from iPhone 8 up to iPhone 16/17, running iOS 15+).
4. **USB to Lightning / USB-C Cable** to connect your iPhone to your Mac.

---

## 2. Step-by-Step Installation

### Step 1: Open the Project in Xcode
Run the following command in your terminal, or double-click the Xcode project file:
```bash
npm run open:ios
```
*Or manually open:*
`apps/mobile-controller/ios/App/App.xcodeproj` in Xcode.

---

### Step 2: Connect Your iPhone
1. Plug your iPhone into your Mac using your cable.
2. If prompted on your iPhone: tap **"Trust This Computer"** and enter your passcode.
3. In Xcode's top toolbar, click on the device selector (next to the Play button) and select **your physical iPhone** instead of a simulator.

---

### Step 3: Configure Free Apple ID Signing
1. In Xcode's left sidebar (Project Navigator), click on the top blue **App** icon.
2. Select the **Signing & Capabilities** tab at the top.
3. Ensure **"Automatically manage signing"** is checked.
4. Next to **Team**, click the dropdown:
   - If your Apple ID is not listed, click **Add an Account...**
   - Sign in with your standard Apple ID (the same one you use for iCloud / App Store).
   - Select your personal team (it will say: *Your Name (Personal Team)*).
5. If Xcode displays a message saying *"Bundle Identifier cannot be registered"*, simply change the **Bundle Identifier** slightly (e.g., change `com.universalgamepad.controller` to `com.yourname.gamepad`).

---

### Step 4: Enable Developer Mode on iPhone (One-time iOS Requirement)
On iOS 16, 17, and 18, Apple requires enabling Developer Mode before running Xcode apps:
1. On your iPhone, open **Settings**.
2. Go to **Privacy & Security**.
3. Scroll all the way to the bottom and tap **Developer Mode**.
4. Toggle it **ON** and follow the prompt to restart your iPhone.
5. After rebooting, unlock your iPhone and tap **Turn On** on the alert.

---

### Step 5: Build and Run!
1. Back in Xcode on your Mac, click the **Play (▶ Run)** button in the top-left corner (or press `Cmd + R`).
2. Xcode will compile the native Swift & WebKit wrapper, sign it with your free Apple developer profile, and push it directly onto your iPhone.
3. The **Universal Gamepad** icon will appear on your iPhone home screen and automatically launch in landscape mode!

---

### Step 6 (First-time launch): Trust Untrusted Developer
If an alert pops up saying *"Untrusted Developer"*:
1. On your iPhone, open **Settings → General → VPN & Device Management**.
2. Tap your Apple ID under *Developer App*.
3. Tap **Trust "[Your Apple ID]"** $\rightarrow$ **Trust**.
4. Tap the **Universal Gamepad** app icon on your home screen — it will open and connect immediately!

---

## What the Native iOS App Gives You
- **Forced Landscape Lock:** Launches directly into landscape ergonomics without rotating.
- **Hidden Status Bar:** Completely hides the battery, cellular, and time bar for 100% immersive view.
- **Local Network Entitlement:** Automatically prompts for local Wi-Fi communication (`NSLocalNetworkUsageDescription`) so it instantly talks to your computer's WebSocket host.
- **Hardware-Accelerated WebKit:** Runs at full 60fps/120fps ProMotion display speed.
