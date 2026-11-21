#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🎮 UNIVERSAL GAMEPAD - IPHONE DEPLOYMENT & SYNC"
echo "=========================================================="

echo "📦 1. Building latest mobile controller web bundle..."
npm run build --workspace=@universal-gamepad/mobile-controller

echo "📱 2. Syncing native iOS Capacitor assets..."
cd "$DIR/apps/mobile-controller"
npx cap sync ios
cd "$DIR"

echo "🔍 3. Inspecting connected iPhone status..."
DEVICE_INFO=$(xcrun devicectl list devices -v 2>/dev/null || true)

if echo "$DEVICE_INFO" | grep -q "DeveloperModeStatus.disabled"; then
  echo ""
  echo "⚠️  ACTION REQUIRED ON YOUR IPHONE:"
  echo "   Apple requires 'Developer Mode' to be enabled before installing apps:"
  echo "   1. On your iPhone: Open 'Settings' -> 'Privacy & Security'"
  echo "   2. Scroll to the very bottom and tap 'Developer Mode'"
  echo "   3. Turn the switch ON and tap 'Restart'"
  echo "   4. After reboot, unlock your iPhone and tap 'Turn On'"
  echo ""
else
  echo "✅ iPhone Developer Mode is READY!"
fi

echo "🚀 4. Opening Xcode with Universal Gamepad project..."
open "$DIR/apps/mobile-controller/ios/App/App.xcodeproj"

echo ""
echo "=========================================================="
echo "🎯 FINAL 1-CLICK STEPS IN XCODE:"
echo "1. In Xcode's left sidebar, click 'App' -> 'Signing & Capabilities'"
echo "2. Check 'Automatically manage signing' & select your Team (Personal Team)"
echo "3. At the top of Xcode, select your connected 'iPhone 17'"
echo "4. Press Cmd + R (or click the Play button ▶)"
echo "=========================================================="
