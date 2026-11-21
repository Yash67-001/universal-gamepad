import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { ControllerState, ControllerProfile } from '@universal-gamepad/shared-protocol';
import { DEFAULT_PROFILES } from '@universal-gamepad/controller-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MACOS_KEY_CODES: Record<string, number> = {
  // Arrow keys
  ArrowUp: 126,
  ArrowDown: 125,
  ArrowLeft: 123,
  ArrowRight: 124,

  // WASD
  KeyW: 13,
  KeyA: 0,
  KeyS: 1,
  KeyD: 2,

  // Action / Modifier keys
  Space: 49,
  ShiftLeft: 56,
  ShiftRight: 60,
  ControlLeft: 59,
  AltLeft: 58,
  Enter: 36,
  Return: 36,
  Escape: 53,
  Tab: 48,
  Backspace: 51,

  // Alpha keys
  KeyC: 8,
  KeyE: 14,
  KeyQ: 12,
  KeyF: 3,
  KeyR: 15,
  KeyZ: 6,
  KeyX: 7,
  KeyV: 9,
  KeyB: 11,
};

export class InputEngine {
  private activeProfile: ControllerProfile;
  private activeKeys = new Set<string>();
  private lastState: ControllerState | null = null;
  private neutralWatchdogTimer: NodeJS.Timeout | null = null;

  // Native macOS Synthesizer child process
  private synthesizerProc: ChildProcess | null = null;
  private downKeyCodes = new Set<number>();
  private isMouseDown = false;

  constructor(profile: ControllerProfile = DEFAULT_PROFILES.xbox) {
    this.activeProfile = profile;
    this.initNativeSynthesizer();
  }

  private initNativeSynthesizer(): void {
    if (os.platform() !== 'darwin') return;

    const potentialPaths = [
      path.resolve(process.cwd(), 'native/macos/mac_input_synthesizer'),
      path.resolve(__dirname, '../../../../native/macos/mac_input_synthesizer'),
      path.resolve(__dirname, '../../../native/macos/mac_input_synthesizer'),
    ];

    const binPath = potentialPaths.find((p) => fs.existsSync(p));
    if (!binPath) {
      console.warn('mac_input_synthesizer binary not found in standard paths');
      return;
    }

    try {
      this.synthesizerProc = spawn(binPath, [], {
        stdio: ['pipe', 'ignore', 'ignore'],
      });

      this.synthesizerProc.on('exit', () => {
        this.synthesizerProc = null;
        this.downKeyCodes.clear();
      });
    } catch (err) {
      console.warn('Failed to launch native input synthesizer:', err);
    }
  }

  public setProfile(profile: ControllerProfile): void {
    this.activeProfile = profile;
  }

  public getProfile(): ControllerProfile {
    return this.activeProfile;
  }

  /**
   * Processes an incoming controller state frame and emits live macOS key & mouse events
   */
  public processState(state: ControllerState): void {
    this.lastState = state;
    this.resetWatchdog();

    // 1. STEERING (Left / Right) -> ArrowLeft/Right + A/D
    const steerLeft = state.axes.leftX < -0.22 || state.buttons.dpadLeft;
    const steerRight = state.axes.leftX > 0.22 || state.buttons.dpadRight;

    this.syncKey('ArrowLeft', steerLeft);
    this.syncKey('KeyA', steerLeft);
    this.syncKey('ArrowRight', steerRight);
    this.syncKey('KeyD', steerRight);

    // 2. THROTTLE / GAS / ACCELERATE -> ArrowUp + KeyW
    // Trigger R2 (analog pull) OR Button A OR Left Stick Up OR DPad Up
    const throttle =
      state.triggers.r2 > 0.12 ||
      state.buttons.a ||
      state.axes.leftY > 0.22 ||
      state.buttons.dpadUp;

    this.syncKey('ArrowUp', throttle);
    this.syncKey('KeyW', throttle);

    // 3. BRAKE / REVERSE -> ArrowDown + KeyS
    // Trigger L2 (analog pull) OR Button B OR Left Stick Down OR DPad Down
    const brake =
      state.triggers.l2 > 0.12 ||
      state.buttons.b ||
      state.axes.leftY < -0.22 ||
      state.buttons.dpadDown;

    this.syncKey('ArrowDown', brake);
    this.syncKey('KeyS', brake);

    // 4. NITRO / BOOST / DRIFT -> Shift (Left)
    // Button X OR Bumpers (L1/R1)
    const nitro = state.buttons.x || state.buttons.r1 || state.buttons.l1;
    this.syncKey('ShiftLeft', nitro);

    // 5. CAMERA TOGGLE -> Key C
    // Button Y
    this.syncKey('KeyC', state.buttons.y);

    // 6. HANDBRAKE / JUMP / ACTION -> Space
    // When Button A is tapped without R2 throttle, or explicit Space
    const handbrake = state.buttons.a && state.triggers.r2 <= 0.12;
    this.syncKey('Space', handbrake);

    // 7. PAUSE / RESUME / MENU -> Escape & Return
    this.syncKey('Escape', state.buttons.start);
    this.syncKey('Return', state.buttons.start);

    // 8. SELECT / BACK -> Tab
    this.syncKey('Tab', state.buttons.select);

    // 9. MOUSE NAVIGATION (Right stick controls cursor so user can click "Resume" in menus!)
    if (Math.hypot(state.axes.rightX, state.axes.rightY) > 0.15) {
      const dx = state.axes.rightX * 14;
      const dy = -state.axes.rightY * 14; // Invert Y for screen coordinates
      this.moveMouseNative(dx, dy);
    }

    // Right stick click (R3) or Left stick click (L3) triggers left mouse click
    this.setMouseNative(state.buttons.r3 || state.buttons.l3);
  }

  private syncKey(keyName: string, isPressed: boolean): void {
    const code = MACOS_KEY_CODES[keyName];

    if (isPressed) {
      this.activeKeys.add(keyName);
      if (code !== undefined) {
        this.setKeyNative(code, true);
      }
    } else {
      this.activeKeys.delete(keyName);
      if (code !== undefined) {
        this.setKeyNative(code, false);
      }
    }
  }

  private setKeyNative(code: number, down: boolean): void {
    if (!this.synthesizerProc?.stdin?.writable) return;
    if (down) {
      if (!this.downKeyCodes.has(code)) {
        this.downKeyCodes.add(code);
        this.synthesizerProc.stdin.write(`KEYDOWN ${code}\n`);
      }
    } else {
      if (this.downKeyCodes.has(code)) {
        this.downKeyCodes.delete(code);
        this.synthesizerProc.stdin.write(`KEYUP ${code}\n`);
      }
    }
  }

  public setMouseNative(down: boolean): void {
    this.clickMouseNative('left', down);
  }

  public clickMouseNative(button: 'left' | 'right', down: boolean): void {
    if (!this.synthesizerProc?.stdin?.writable) return;
    const btnCode = button === 'right' ? 1 : 0;
    if (down) {
      this.isMouseDown = true;
      this.synthesizerProc.stdin.write(`MOUSEDOWN ${btnCode}\n`);
    } else {
      this.isMouseDown = false;
      this.synthesizerProc.stdin.write(`MOUSEUP ${btnCode}\n`);
    }
  }

  public moveMouseNative(dx: number, dy: number): void {
    if (!this.synthesizerProc?.stdin?.writable) return;
    this.synthesizerProc.stdin.write(`MOUSEMOVE ${dx.toFixed(1)} ${dy.toFixed(1)}\n`);
  }

  public scrollMouseNative(deltaY: number): void {
    if (!this.synthesizerProc?.stdin?.writable) return;
    this.synthesizerProc.stdin.write(`MOUSESCROLL ${deltaY.toFixed(1)}\n`);
  }

  /**
   * Resets watchdog timer. If no inputs arrive for 250ms, flush all pressed keys to avoid stuck buttons!
   */
  private resetWatchdog(): void {
    if (this.neutralWatchdogTimer) {
      clearTimeout(this.neutralWatchdogTimer);
    }
    this.neutralWatchdogTimer = setTimeout(() => {
      this.flushToNeutral();
    }, 250);
  }

  public flushToNeutral(): void {
    if (this.synthesizerProc?.stdin?.writable) {
      for (const code of this.downKeyCodes) {
        this.synthesizerProc.stdin.write(`KEYUP ${code}\n`);
      }
      if (this.isMouseDown) {
        this.synthesizerProc.stdin.write('MOUSEUP 0\n');
        this.isMouseDown = false;
      }
    }
    this.downKeyCodes.clear();
    this.activeKeys.clear();
    this.lastState = null;
  }

  public getActiveKeys(): string[] {
    return Array.from(this.activeKeys);
  }

  public getLastState(): ControllerState | null {
    return this.lastState;
  }
}
