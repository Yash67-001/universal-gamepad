#!/bin/bash
set -e

PROJECT_DIR="/Users/yashmalik0814gmail.com/Downloads/Universal Gamepad "
DESKTOP_DIR="$HOME/Desktop"
APP_NAME="Universal Gamepad.app"
APP_BUNDLE="$DESKTOP_DIR/$APP_NAME"

echo "Creating macOS Application Bundle at: $APP_BUNDLE"

rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# 1. Copy Icon
cp "$PROJECT_DIR/build/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"

# 2. Write PkgInfo
echo -n "APPLUGPD" > "$APP_BUNDLE/Contents/PkgInfo"

# 3. Write Info.plist
cat << 'EOF' > "$APP_BUNDLE/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>universal-gamepad</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.universalgamepad.desktop</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Universal Gamepad</string>
    <key>CFBundleDisplayName</key>
    <string>Universal Gamepad</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# 4. Write Executable Launcher Script
cat << 'EOF' > "$APP_BUNDLE/Contents/MacOS/universal-gamepad"
#!/bin/bash
PROJECT_DIR="/Users/yashmalik0814gmail.com/Downloads/Universal Gamepad "
PORT=8080

export PATH="/opt/homebrew/bin:/usr/local/bin:/Library/Frameworks/Python.framework/Versions/3.14/bin:$PATH"

# If already running, just open the dashboard
if curl -s "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1; then
    open "http://localhost:${PORT}/dashboard"
    osascript -e 'display notification "Connected to Universal Gamepad Host. Ready for mobile scanning." with title "Universal Gamepad" subtitle "Dashboard Active"'
    exit 0
fi

# Change to project directory and start the server
cd "$PROJECT_DIR" || exit 1
(nohup npx tsx apps/desktop/src/server/index.ts > /tmp/universal-gamepad.log 2>&1 &) &
disown 2>/dev/null || true

# Wait for server to start
for i in {1..30}; do
    if curl -s "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1; then
        break
    fi
    sleep 0.2
done

# Open dashboard in browser
open "http://localhost:${PORT}/dashboard"

# Trigger macOS notification
osascript -e 'display notification "Scan QR code on dashboard to connect your mobile controller!" with title "Universal Gamepad" subtitle "Host Online on Port 8080"'
EOF

chmod +x "$APP_BUNDLE/Contents/MacOS/universal-gamepad"

# 5. Create companion .command shortcut for users who like terminal logs
cat << 'EOF' > "$DESKTOP_DIR/Launch Universal Gamepad.command"
#!/bin/bash
PROJECT_DIR="/Users/yashmalik0814gmail.com/Downloads/Universal Gamepad "
PORT=8080

export PATH="/opt/homebrew/bin:/usr/local/bin:/Library/Frameworks/Python.framework/Versions/3.14/bin:$PATH"
cd "$PROJECT_DIR" || exit 1

echo "=========================================================="
echo "🎮 UNIVERSAL GAMEPAD - WIRELESS CONTROLLER SYSTEM"
echo "=========================================================="
echo "Starting local host on port $PORT..."

# Open dashboard in background after 1s
(sleep 1.2 && open "http://localhost:${PORT}/dashboard") &

npm start
EOF

chmod +x "$DESKTOP_DIR/Launch Universal Gamepad.command"

# Notify Finder to refresh the desktop icon cache
touch "$APP_BUNDLE"
xattr -cr "$APP_BUNDLE" 2>/dev/null || true

echo "SUCCESS: Desktop shortcut created at:"
echo "   $APP_BUNDLE"
echo "   $DESKTOP_DIR/Launch Universal Gamepad.command"
