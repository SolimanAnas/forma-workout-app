/** Workout engine types (spec §17–22). PURE domain — independent of the exercise/rep engine. */

export type WorkoutMode = 'free' | 'sets' | 'amrap' | 'emom' | 'circuit';

/** A single, uniform view of engine state for the UI to render. */
export interface WorkoutSnapshot {
  mode: WorkoutMode;
  phase: string;
  /** The dominant on-screen number (reps, round, or remaining count). */
  primaryValue: number;
  primaryLabel: string;
  detail?: string;
  restRemainingMs?: number;
  finished: boolean;
}

/** Every mode engine implements this so the UI can drive them uniformly. */
export interface WorkoutEngine {
  /** Begin the workout at `now` (ms). */
  start(now: number): void;
  /** A valid rep was detected. */
  registerRep(now: number): void;
  /** Time advanced — drives rest countdowns and time-boxed modes. */
  tick(now: number): void;
  snapshot(now: number): WorkoutSnapshot;
  readonly finished: boolean;
  result(): WorkoutResult;
}

export interface WorkoutResult {
  mode: WorkoutMode;
  totalReps: number;
  validReps: number;
  durationMs: number;
  detail: Record<string, number>;
}
