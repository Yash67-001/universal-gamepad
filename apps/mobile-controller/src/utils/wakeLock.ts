export class WakeLockManager {
  private sentinel: unknown = null;
  private isRequested = false;

  public async acquire(): Promise<boolean> {
    this.isRequested = true;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } };
        this.sentinel = await nav.wakeLock.request('screen');
        return true;
      } catch (err) {
        console.warn('WakeLock acquisition failed:', err);
        return false;
      }
    }
    return false;
  }

  public release(): void {
    this.isRequested = false;
    if (this.sentinel && typeof (this.sentinel as { release: () => Promise<void> }).release === 'function') {
      try {
        (this.sentinel as { release: () => Promise<void> }).release();
      } catch {}
      this.sentinel = null;
    }
  }

  public onVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.isRequested) {
      this.acquire();
    }
  }
}
