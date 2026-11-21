# Universal Gamepad — System Architecture

## Overview
Universal Gamepad turns any modern smartphone (iOS, Android, iPadOS) into a high-performance wireless game controller for computers running macOS and Windows without requiring any app store installation.

## Network Protocol & Input Pipeline

```
+-------------------------------------------------------------+
|                     SMARTPHONE CLIENT                       |
|  - Pointer Events Engine (Multi-touch with pointerId)       |
|  - Circular Analog Joysticks with radial deadzone & curves  |
|  - Web Audio Synthetic Tactile Haptics (iOS) / Vibrate (And)|
|  - Binary Packet Encoder (20-byte ArrayBuffer)              |
+------------------------------+------------------------------+
                               |
                   Binary WebSocket (60-120Hz)
                               |
+------------------------------v------------------------------+
|                     DESKTOP COMPANION                       |
|  - Local LAN Interface Discovery & IP Selector              |
|  - QR Code & 4-Digit One-Time PIN Generator                 |
|  - Binary Packet Decoder & Sequence Monitor                 |
|  - Stuck-Button Dead-Man Watchdog (250ms threshold)         |
|  - Live Input Tester & Latency Monitor                      |
+------------------------------+------------------------------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   [Windows Mode A (ViGEm)]          [macOS & Windows Mode B]
   True Virtual Xbox 360 Gamepad     Native Keystroke & Mouse
   Directly recognized by Steam      Synthesis (WASD / Space / E / Q)
```

## Binary Packet Specification (20 Bytes)
```
[0..1]  Magic Bytes:  0x55 0x47 ('U', 'G')
[2]     Packet Type:  0x01 (Input State), 0x02 (Ping), 0x03 (Pong)
[3]     Sequence No:  uint8 circular counter (0-255)
[4..7]  Timestamp:    uint32 millisecond timestamp (for RTT calculation)
[8..9]  Button Mask:  uint16 bitmask (16 digital buttons: ABXY, D-Pad, L1/R1, L3/R3, Start/Select/Home/Turbo)
[10]    Trigger L2:   uint8 (0 to 255 -> normalized to 0.0 to 1.0)
[11]    Trigger R2:   uint8 (0 to 255 -> normalized to 0.0 to 1.0)
[12..13] Left Stick X: int16 (-32768 to 32767 -> normalized to -1.0 to 1.0)
[14..15] Left Stick Y: int16 (-32768 to 32767 -> normalized to -1.0 to 1.0)
[16..17] Right Stick X: int16 (-32768 to 32767 -> normalized to -1.0 to 1.0)
[18..19] Right Stick Y: int16 (-32768 to 32767 -> normalized to -1.0 to 1.0)
```
