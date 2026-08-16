/**
 * A pausable countdown for rest periods (spec §22). Pure and tick-driven — the caller supplies
 * `now`, so it is deterministic and testable without real clocks.
 */
export class RestTimer {
  private endAt = 0;
  private running = false;
  private pausedRemaining: number | null = null;

  start(now: number, durationMs: number): void {
    this.endAt = now + durationMs;
    this.running = true;
    this.pausedRemaining = null;
  }

  remaining(now: number): number {
    if (!this.running) return 0;
    if (this.pausedRemaining !== null) return this.pausedRemaining;
    return Math.max(0, this.endAt - now);
  }

  isDone(now: number): boolean {
    return this.running && this.pausedRemaining === null && now >= this.endAt;
  }

  isPaused(): boolean {
    return this.pausedRemaining !== null;
  }

  addTime(ms: number): void {
    if (this.pausedRemaining !== null) this.pausedRemaining += ms;
    else this.endAt += ms;
  }

  skip(now: number): void {
    this.endAt = now;
    this.pausedRemaining = null;
  }

  pause(now: number): void {
    if (this.running && this.pausedRemaining === null) {
      this.pausedRemaining = Math.max(0, this.endAt - now);
    }
  }

  resume(now: number): void {
    if (this.pausedRemaining !== null) {
      this.endAt = now + this.pausedRemaining;
      this.pausedRemaining = null;
    }
  }

  stop(): void {
    this.running = false;
    this.pausedRemaining = null;
  }
}
