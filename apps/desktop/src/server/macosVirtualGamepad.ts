import { spawn, ChildProcess, execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import { ControllerState } from '@universal-gamepad/shared-protocol';

export class MacOSVirtualGamepad {
  private static instance: MacOSVirtualGamepad | null = null;
  private feedProc: ChildProcess | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private ojdPath: string | null = null;
  private isAvailable = false;
  private isRunning = false;

  public static getInstance(): MacOSVirtualGamepad {
    if (!MacOSVirtualGamepad.instance) {
      MacOSVirtualGamepad.instance = new MacOSVirtualGamepad();
    }
    return MacOSVirtualGamepad.instance;
  }

  private constructor() {
    this.findOjdPath();
  }

  private findOjdPath(): void {
    if (os.platform() !== 'darwin') return;

    const paths = [
      '/opt/homebrew/bin/ojd',
      '/usr/local/bin/ojd',
      '/Applications/OpenJoystickDriver.app/Contents/MacOS/OpenJoystickDriver',
    ];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        this.ojdPath = p;
        this.isAvailable = true;
        break;
      }
    }

    if (!this.ojdPath) {
      try {
        const out = execSync('which ojd', { stdio: 'pipe' }).toString().trim();
        if (out && fs.existsSync(out)) {
          this.ojdPath = out;
          this.isAvailable = true;
        }
      } catch {
        // Not found
      }
    }
  }

  public getAvailable(): boolean {
    return this.isAvailable;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public start(): boolean {
    if (this.isRunning && this.feedProc) return true;
    if (!this.isAvailable || !this.ojdPath) return false;

    // Ensure OJD service is running
    try {
      execSync(`"${this.ojdPath}" service start`, { stdio: 'ignore' });
    } catch {
      // Continue, might already be running
    }

    try {
      this.feedProc = spawn(this.ojdPath, ['virtual', 'feed', '--as', 'game-controller-compatible'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.feedProc.on('error', (err) => {
        console.warn('[MacOSVirtualGamepad] Feed process error:', err.message);
        this.stop();
      });

      this.feedProc.on('exit', (code) => {
        console.log(`[MacOSVirtualGamepad] Feed process exited with code ${code}`);
        this.isRunning = false;
        this.feedProc = null;
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
      });

      // Send initial neutral frame
      this.feedProc.stdin?.write(JSON.stringify({}) + '\n');
      this.isRunning = true;

      // Start 400ms heartbeat to keep the virtual device alive during idle periods
      this.heartbeatTimer = setInterval(() => {
        if (this.feedProc?.stdin?.writable) {
          this.feedProc.stdin.write(JSON.stringify({}) + '\n');
        }
      }, 400);

      console.log('🎮 [MacOSVirtualGamepad] Native Xbox Wireless Controller successfully published to macOS!');
      return true;
    } catch (err) {
      console.warn('[MacOSVirtualGamepad] Failed to launch virtual feed:', err);
      this.isRunning = false;
      return false;
    }
  }

  public sendState(state: ControllerState): void {
    if (!this.isRunning || !this.feedProc?.stdin?.writable) {
      if (this.isAvailable && !this.isRunning) {
        this.start();
      }
      if (!this.isRunning || !this.feedProc?.stdin?.writable) return;
    }

    const buttons: string[] = [];
    if (state.buttons.a) buttons.push('South');
    if (state.buttons.b) buttons.push('East');
    if (state.buttons.x) buttons.push('West');
    if (state.buttons.y) buttons.push('North');
    if (state.buttons.l1) buttons.push('LeftShoulder');
    if (state.buttons.r1) buttons.push('RightShoulder');
    if (state.buttons.start) buttons.push('Start');
    if (state.buttons.select) buttons.push('Back');
    if (state.buttons.l3) buttons.push('LeftStickClick');
    if (state.buttons.r3) buttons.push('RightStickClick');
    if (state.triggers.l2 > 0.5) buttons.push('LeftTrigger');
    if (state.triggers.r2 > 0.5) buttons.push('RightTrigger');

    const dpad: string[] = [];
    if (state.buttons.dpadUp) dpad.push('DpadUp');
    if (state.buttons.dpadDown) dpad.push('DpadDown');
    if (state.buttons.dpadLeft) dpad.push('DpadLeft');
    if (state.buttons.dpadRight) dpad.push('DpadRight');

    // Axes: OJD stick Y is positive downwards
    const axes: Record<string, number> = {
      LeftStickX: Math.max(-1, Math.min(1, Number(state.axes.leftX.toFixed(3)))),
      LeftStickY: Math.max(-1, Math.min(1, Number((-state.axes.leftY).toFixed(3)))),
      RightStickX: Math.max(-1, Math.min(1, Number(state.axes.rightX.toFixed(3)))),
      RightStickY: Math.max(-1, Math.min(1, Number((-state.axes.rightY).toFixed(3)))),
      LeftTrigger: Math.max(0, Math.min(1, Number(state.triggers.l2.toFixed(3)))),
      RightTrigger: Math.max(0, Math.min(1, Number(state.triggers.r2.toFixed(3)))),
    };

    const frame = {
      buttons,
      dpad,
      axes,
    };

    try {
      this.feedProc.stdin.write(JSON.stringify(frame) + '\n');
    } catch {
      // Stream error handled on process events
    }
  }

  public flushToNeutral(): void {
    if (this.feedProc?.stdin?.writable) {
      try {
        this.feedProc.stdin.write(JSON.stringify({}) + '\n');
      } catch {
        // Ignore
      }
    }
  }

  public stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.feedProc) {
      try {
        this.feedProc.stdin?.write(JSON.stringify({}) + '\n');
        this.feedProc.stdin?.end();
        this.feedProc.kill('SIGTERM');
      } catch {
        // Ignore
      }
      this.feedProc = null;
    }
    this.isRunning = false;
  }
}
