#include <ApplicationServices/ApplicationServices.h>
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <sys/time.h>
#include <unistd.h>

static CGPoint s_mousePos = { 600.0f, 400.0f };
static bool s_isLeftMouseDown = false;
static bool s_isRightMouseDown = false;
static uint64_t s_lastMoveTime = 0;

static uint64_t getNowMs() {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)(tv.tv_sec) * 1000 + (uint64_t)(tv.tv_usec) / 1000;
}

static void syncWithSystemMouse() {
    CGEventRef current = CGEventCreate(NULL);
    if (current) {
        s_mousePos = CGEventGetLocation(current);
        CFRelease(current);
    }
}

int main() {
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    
    // Initialize starting mouse position from current system position
    syncWithSystemMouse();
    
    char line[256];
    while (fgets(line, sizeof(line), stdin)) {
        char cmd[32];
        if (sscanf(line, "%31s", cmd) != 1) continue;

        if (strcmp(cmd, "MOUSEMOVE") == 0) {
            float dx = 0.0f, dy = 0.0f;
            if (sscanf(line, "%*s %f %f", &dx, &dy) == 2) {
                uint64_t now = getNowMs();
                // If inactive for more than 400ms, sync with physical mouse position
                if (now - s_lastMoveTime > 400) {
                    syncWithSystemMouse();
                }
                s_lastMoveTime = now;
                
                s_mousePos.x += dx;
                s_mousePos.y += dy;
                
                // Clamp to screen boundaries to keep cursor safely on screen
                CGDirectDisplayID mainDisplay = CGMainDisplayID();
                size_t maxW = CGDisplayPixelsWide(mainDisplay);
                size_t maxH = CGDisplayPixelsHigh(mainDisplay);
                if (s_mousePos.x < 0.0f) s_mousePos.x = 0.0f;
                if (s_mousePos.y < 0.0f) s_mousePos.y = 0.0f;
                if (s_mousePos.x > (float)maxW) s_mousePos.x = (float)maxW;
                if (s_mousePos.y > (float)maxH) s_mousePos.y = (float)maxH;
                
                // Warp the physical macOS hardware cursor immediately
                CGWarpMouseCursorPosition(s_mousePos);
                
                CGEventType moveType;
                CGMouseButton btn;
                if (s_isLeftMouseDown) {
                    moveType = kCGEventLeftMouseDragged;
                    btn = kCGMouseButtonLeft;
                } else if (s_isRightMouseDown) {
                    moveType = kCGEventRightMouseDragged;
                    btn = kCGMouseButtonRight;
                } else {
                    moveType = kCGEventMouseMoved;
                    btn = kCGMouseButtonLeft;
                }
                
                CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
                CGEventRef ev = CGEventCreateMouseEvent(source, moveType, s_mousePos, btn);
                if (ev) {
                    CGEventPost(kCGHIDEventTap, ev);
                    CFRelease(ev);
                }
                if (source) {
                    CFRelease(source);
                }
            }
        } else if (strcmp(cmd, "MOUSEDOWN") == 0 || strcmp(cmd, "MOUSEUP") == 0) {
            int code = 0;
            if (sscanf(line, "%*s %d", &code) == 1) {
                bool down = (strcmp(cmd, "MOUSEDOWN") == 0);
                bool isRight = (code == 1);
                
                if (isRight) {
                    s_isRightMouseDown = down;
                } else {
                    s_isLeftMouseDown = down;
                }
                
                syncWithSystemMouse();
                
                CGEventType type;
                CGMouseButton btn;
                if (isRight) {
                    type = down ? kCGEventRightMouseDown : kCGEventRightMouseUp;
                    btn = kCGMouseButtonRight;
                } else {
                    type = down ? kCGEventLeftMouseDown : kCGEventLeftMouseUp;
                    btn = kCGMouseButtonLeft;
                }
                
                CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
                CGEventRef ev = CGEventCreateMouseEvent(source, type, s_mousePos, btn);
                if (ev) {
                    CGEventSetIntegerValueField(ev, kCGMouseEventClickState, 1);
                    CGEventPost(kCGHIDEventTap, ev);
                    CFRelease(ev);
                }
                if (source) {
                    CFRelease(source);
                }
            }
        } else if (strcmp(cmd, "MOUSECLICK") == 0) {
            int code = 0;
            if (sscanf(line, "%*s %d", &code) == 1) {
                bool isRight = (code == 1);
                syncWithSystemMouse();
                
                CGMouseButton btn = isRight ? kCGMouseButtonRight : kCGMouseButtonLeft;
                CGEventType downType = isRight ? kCGEventRightMouseDown : kCGEventLeftMouseDown;
                CGEventType upType = isRight ? kCGEventRightMouseUp : kCGEventLeftMouseUp;
                
                CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
                
                CGEventRef downEv = CGEventCreateMouseEvent(source, downType, s_mousePos, btn);
                if (downEv) {
                    CGEventSetIntegerValueField(downEv, kCGMouseEventClickState, 1);
                    CGEventPost(kCGHIDEventTap, downEv);
                    CFRelease(downEv);
                }
                
                usleep(25000); // 25ms clean click hold
                
                CGEventRef upEv = CGEventCreateMouseEvent(source, upType, s_mousePos, btn);
                if (upEv) {
                    CGEventSetIntegerValueField(upEv, kCGMouseEventClickState, 1);
                    CGEventPost(kCGHIDEventTap, upEv);
                    CFRelease(upEv);
                }
                
                if (source) {
                    CFRelease(source);
                }
            }
        } else if (strcmp(cmd, "MOUSESCROLL") == 0) {
            float dy = 0.0f;
            if (sscanf(line, "%*s %f", &dy) == 1) {
                CGEventRef ev = CGEventCreateScrollWheelEvent(NULL, kCGScrollEventUnitPixel, 1, (int32_t)dy);
                if (ev) {
                    CGEventPost(kCGHIDEventTap, ev);
                    CFRelease(ev);
                }
            }
        } else if (strcmp(cmd, "KEYDOWN") == 0 || strcmp(cmd, "KEYUP") == 0) {
            int code = 0;
            if (sscanf(line, "%*s %d", &code) == 1) {
                bool down = (strcmp(cmd, "KEYDOWN") == 0);
                CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
                CGEventRef ev = CGEventCreateKeyboardEvent(source, (CGKeyCode)code, down);
                if (ev) {
                    CGEventPost(kCGHIDEventTap, ev);
                    CFRelease(ev);
                }
                if (source) {
                    CFRelease(source);
                }
            }
        } else if (strncmp(cmd, "PING", 4) == 0) {
            printf("PONG\n");
        }
    }
    return 0;
}
