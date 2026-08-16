import type { WorkoutLaunch } from '../services/workout-factory';

/** Hand-off of the chosen workout config from the setup screen to the active-workout screen. */
let pending: WorkoutLaunch | null = null;

export function setPendingLaunch(launch: WorkoutLaunch): void {
  pending = launch;
}

/** Reads and clears the pending launch (single-use). */
export function takePendingLaunch(): WorkoutLaunch | null {
  const launch = pending;
  pending = null;
  return launch;
}
