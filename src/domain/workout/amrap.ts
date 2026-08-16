import type { WorkoutEngine, WorkoutResult, WorkoutSnapshot } from './types';

export interface AmrapConfig {
  exerciseId?: string;
  durationMs: number;
  /** Optional reps-per-round, to report rounds completed. */
  repsPerRound?: number;
}

/** AMRAP: as many reps/rounds as possible within a time box (spec §21). */
export class AmrapEngine implements WorkoutEngine {
  private reps = 0;
  private startedAt = 0;
  private endedAt = 0;
  private done = false;

  constructor(private readonly config: AmrapConfig) {}

  start(now: number): void {
    this.startedAt = now;
  }

  registerRep(now: number): void {
    if (this.done) return;
    if (now - this.startedAt >= this.config.durationMs) {
      this.finish(now);
      return;
    }
    this.reps++;
  }

  tick(now: number): void {
    if (!this.done && now - this.startedAt >= this.config.durationMs) this.finish(now);
  }

  private finish(now: number): void {
    this.done = true;
    this.endedAt = now;
  }

  get finished(): boolean {
    return this.done;
  }

  private rounds(): number {
    return this.config.repsPerRound ? Math.floor(this.reps / this.config.repsPerRound) : 0;
  }

  snapshot(now: number): WorkoutSnapshot {
    const remainingMs = Math.max(0, this.config.durationMs - (now - this.startedAt));
    return {
      mode: 'amrap',
      phase: this.done ? 'DONE' : 'RUNNING',
      primaryValue: this.reps,
      primaryLabel: 'reps',
      detail: this.config.repsPerRound
        ? `${this.rounds()} rounds · ${Math.ceil(remainingMs / 1000)}s left`
        : `${Math.ceil(remainingMs / 1000)}s left`,
      finished: this.done,
    };
  }

  result(): WorkoutResult {
    return {
      mode: 'amrap',
      totalReps: this.reps,
      validReps: this.reps,
      durationMs: (this.endedAt || this.startedAt) - this.startedAt,
      detail: { reps: this.reps, rounds: this.rounds() },
    };
  }
}
