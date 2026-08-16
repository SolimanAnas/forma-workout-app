import type { WorkoutEngine, WorkoutResult, WorkoutSnapshot } from './types';

export interface FreeRepsConfig {
  exerciseId: string;
  targetReps?: number;
  timeLimitMs?: number;
}

/** Free Reps: count until an optional target/time limit, or until the user finishes (spec §17). */
export class FreeRepsEngine implements WorkoutEngine {
  private reps = 0;
  private startedAt = 0;
  private endedAt = 0;
  private done = false;

  constructor(private readonly config: FreeRepsConfig) {}

  start(now: number): void {
    this.startedAt = now;
  }

  registerRep(now: number): void {
    if (this.done) return;
    this.reps++;
    if (this.config.targetReps && this.reps >= this.config.targetReps) this.finish(now);
  }

  tick(now: number): void {
    if (this.done) return;
    if (this.config.timeLimitMs && now - this.startedAt >= this.config.timeLimitMs) this.finish(now);
  }

  finish(now: number): void {
    if (this.done) return;
    this.done = true;
    this.endedAt = now;
  }

  get finished(): boolean {
    return this.done;
  }

  snapshot(now: number): WorkoutSnapshot {
    const detail = this.config.targetReps
      ? `Target ${this.config.targetReps}`
      : this.config.timeLimitMs
        ? `${Math.max(0, Math.ceil((this.config.timeLimitMs - (now - this.startedAt)) / 1000))}s left`
        : 'Free reps';
    return {
      mode: 'free',
      phase: this.done ? 'DONE' : 'RUNNING',
      primaryValue: this.reps,
      primaryLabel: 'reps',
      detail,
      finished: this.done,
    };
  }

  result(): WorkoutResult {
    return {
      mode: 'free',
      totalReps: this.reps,
      validReps: this.reps,
      durationMs: (this.endedAt || this.startedAt) - this.startedAt,
      detail: { reps: this.reps },
    };
  }
}
