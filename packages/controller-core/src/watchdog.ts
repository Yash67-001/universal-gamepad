import { ControllerState, INITIAL_CONTROLLER_STATE } from '@universal-gamepad/shared-protocol';

export class InputWatchdog {
  private lastInputTime: number = Date.now();
  private timeoutMs: number;
  private onStaleCallback?: () => void;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(timeoutMs = 250, onStale?: () => void) {
    this.timeoutMs = timeoutMs;
    this.onStaleCallback = onStale;
  }

  public recordActivity(): void {
    this.lastInputTime = Date.now();
  }

  public start(): void {
    this.stop();
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.lastInputTime;
      if (elapsed > this.timeoutMs) {
        if (this.onStaleCallback) {
          this.onStaleCallback();
        }
      }
    }, Math.max(50, Math.floor(this.timeoutMs / 3)));
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public static getNeutralState(): ControllerState {
    return JSON.parse(JSON.stringify(INITIAL_CONTROLLER_STATE));
  }
}
