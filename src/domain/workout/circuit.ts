import type { WorkoutEngine, WorkoutResult, WorkoutSnapshot } from './types';

export interface CircuitStation {
  exerciseId: string;
  /** Rep-based station. */
  reps?: number;
  /** Duration-based station (e.g. plank), in ms. */
  durationMs?: number;
}

export interface CircuitConfig {
  stations: CircuitStation[];
  rounds?: number;
}

/** Circuit: advance through mixed rep- and duration-based stations for N rounds (spec §21). */
export class CircuitEngine implements WorkoutEngine {
  private index = 0;
  private round = 1;
  private repsThisStation = 0;
  private totalReps = 0;
  private startedAt = 0;
  private stationStart = 0;
  private endedAt = 0;
  private done = false;
  private readonly rounds: number;

  constructor(private readonly config: CircuitConfig) {
    if (config.stations.length === 0) throw new Error('circuit needs at least one station');
    this.rounds = config.rounds ?? 1;
  }

  start(now: number): void {
    this.startedAt = now;
    this.stationStart = now;
  }

  registerRep(now: number): void {
    if (this.done) return;
    const station = this.config.stations[this.index];
    if (station.reps === undefined) return; // duration station ignores reps
    this.repsThisStation++;
    this.totalReps++;
    if (this.repsThisStation >= station.reps) this.advance(now);
  }

  tick(now: number): void {
    if (this.done) return;
    const station = this.config.stations[this.index];
    if (station.durationMs !== undefined && now - this.stationStart >= station.durationMs) {
      this.advance(now);
    }
  }

  private advance(now: number): void {
    this.repsThisStation = 0;
    this.stationStart = now;
    if (this.index >= this.config.stations.length - 1) {
      if (this.round >= this.rounds) {
        this.done = true;
        this.endedAt = now;
        return;
      }
      this.round++;
      this.index = 0;
    } else {
      this.index++;
    }
  }

  get finished(): boolean {
    return this.done;
  }

  snapshot(now: number): WorkoutSnapshot {
    const station = this.config.stations[this.index];
    const isDuration = station.durationMs !== undefined;
    const remainingMs = isDuration
      ? Math.max(0, (station.durationMs ?? 0) - (now - this.stationStart))
      : 0;
    return {
      mode: 'circuit',
      phase: this.done ? 'DONE' : 'RUNNING',
      primaryValue: isDuration ? Math.ceil(remainingMs / 1000) : this.repsThisStation,
      primaryLabel: isDuration ? 'sec' : 'reps',
      detail: `${station.exerciseId} · station ${this.index + 1}/${this.config.stations.length} · round ${this.round}/${this.rounds}`,
      finished: this.done,
    };
  }

  result(): WorkoutResult {
    return {
      mode: 'circuit',
      totalReps: this.totalReps,
      validReps: this.totalReps,
      durationMs: (this.endedAt || this.startedAt) - this.startedAt,
      detail: { totalReps: this.totalReps, rounds: this.rounds },
    };
  }
}
