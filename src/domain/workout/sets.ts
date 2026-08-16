import { RestTimer } from './rest-timer';
import type { WorkoutEngine, WorkoutResult, WorkoutSnapshot } from './types';

export interface SetsConfig {
  exerciseId: string;
  sets: number;
  reps: number;
  restMs: number;
}

type SetsPhase = 'IDLE' | 'ACTIVE_SET' | 'RESTING' | 'DONE';

/** Sets mode: N × M with automatic set detection and rest timers between sets (spec §18, §22). */
export class SetsEngine implements WorkoutEngine {
  private phase: SetsPhase = 'IDLE';
  private currentSet = 1;
  private repsThisSet = 0;
  private totalReps = 0;
  private startedAt = 0;
  private endedAt = 0;
  private readonly rest = new RestTimer();

  constructor(private readonly config: SetsConfig) {}

  start(now: number): void {
    this.phase = 'ACTIVE_SET';
    this.startedAt = now;
  }

  registerRep(now: number): void {
    if (this.phase !== 'ACTIVE_SET') return;
    this.repsThisSet++;
    this.totalReps++;
    if (this.repsThisSet >= this.config.reps) this.completeSet(now);
  }

  private completeSet(now: number): void {
    if (this.currentSet >= this.config.sets) {
      this.phase = 'DONE';
      this.endedAt = now;
    } else {
      this.rest.start(now, this.config.restMs);
      this.phase = 'RESTING';
    }
  }

  tick(now: number): void {
    if (this.phase === 'RESTING' && this.rest.isDone(now)) {
      this.currentSet++;
      this.repsThisSet = 0;
      this.phase = 'ACTIVE_SET';
      this.rest.stop();
    }
  }

  // Rest controls (spec §22).
  skipRest(now: number): void {
    if (this.phase === 'RESTING') this.rest.skip(now);
  }
  addRest(ms: number): void {
    if (this.phase === 'RESTING') this.rest.addTime(ms);
  }
  pause(now: number): void {
    if (this.phase === 'RESTING') this.rest.pause(now);
  }
  resume(now: number): void {
    if (this.phase === 'RESTING') this.rest.resume(now);
  }

  get finished(): boolean {
    return this.phase === 'DONE';
  }

  snapshot(now: number): WorkoutSnapshot {
    if (this.phase === 'RESTING') {
      const restRemainingMs = this.rest.remaining(now);
      return {
        mode: 'sets',
        phase: 'RESTING',
        primaryValue: Math.ceil(restRemainingMs / 1000),
        primaryLabel: 'rest',
        detail: `Next: set ${this.currentSet + 1} of ${this.config.sets}`,
        restRemainingMs,
        finished: false,
      };
    }
    return {
      mode: 'sets',
      phase: this.phase,
      primaryValue: this.repsThisSet,
      primaryLabel: 'reps',
      detail: `Set ${this.currentSet} of ${this.config.sets} · target ${this.config.reps}`,
      finished: this.phase === 'DONE',
    };
  }

  result(): WorkoutResult {
    return {
      mode: 'sets',
      totalReps: this.totalReps,
      validReps: this.totalReps,
      durationMs: (this.endedAt || this.startedAt) - this.startedAt,
      detail: { sets: this.config.sets, reps: this.config.reps, totalReps: this.totalReps },
    };
  }
}
