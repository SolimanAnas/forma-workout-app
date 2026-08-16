import type { WorkoutEngine, WorkoutResult, WorkoutSnapshot } from './types';

export interface EmomConfig {
  exerciseId?: string;
  minutes: number;
  repsPerMinute: number;
  /** Window length in ms (default 60000). Configurable for testing. */
  windowMs?: number;
}

/** EMOM: every minute on the minute — hit the target each window (spec §21). */
export class EmomEngine implements WorkoutEngine {
  private readonly windowMs: number;
  private currentMinute = 1;
  private repsThisMinute = 0;
  private totalReps = 0;
  private successes = 0;
  private startedAt = 0;
  private windowStart = 0;
  private endedAt = 0;
  private done = false;

  constructor(private readonly config: EmomConfig) {
    this.windowMs = config.windowMs ?? 60000;
  }

  start(now: number): void {
    this.startedAt = now;
    this.windowStart = now;
  }

  registerRep(now: number): void {
    if (this.done) return;
    this.roll(now);
    if (this.done) return;
    this.repsThisMinute++;
    this.totalReps++;
  }

  tick(now: number): void {
    if (!this.done) this.roll(now);
  }

  /** Advance through any elapsed minute windows, scoring each as it closes. */
  private roll(now: number): void {
    while (!this.done && now - this.windowStart >= this.windowMs) {
      if (this.repsThisMinute >= this.config.repsPerMinute) this.successes++;
      if (this.currentMinute >= this.config.minutes) {
        this.done = true;
        this.endedAt = this.windowStart + this.windowMs;
        return;
      }
      this.currentMinute++;
      this.repsThisMinute = 0;
      this.windowStart += this.windowMs;
    }
  }

  get finished(): boolean {
    return this.done;
  }

  snapshot(now: number): WorkoutSnapshot {
    const remainingMs = Math.max(0, this.windowMs - (now - this.windowStart));
    return {
      mode: 'emom',
      phase: this.done ? 'DONE' : 'RUNNING',
      primaryValue: this.repsThisMinute,
      primaryLabel: 'reps',
      detail: `Min ${this.currentMinute}/${this.config.minutes} · target ${this.config.repsPerMinute} · ${Math.ceil(remainingMs / 1000)}s`,
      finished: this.done,
    };
  }

  result(): WorkoutResult {
    return {
      mode: 'emom',
      totalReps: this.totalReps,
      validReps: this.totalReps,
      durationMs: (this.endedAt || this.startedAt) - this.startedAt,
      detail: { totalReps: this.totalReps, successes: this.successes, minutes: this.config.minutes },
    };
  }
}
