import { targetForLevel, type ProgressionConfig, type ProgressionTarget } from './progression';

/**
 * Estimate a starting level from a single max-effort set (spec §19). Training reps sit at ~65% of
 * a one-set max, so we pick the highest level whose target reps stay within that working range.
 */
const WORKING_FRACTION = 0.65;

export function recommendLevel(maxReps: number, config: ProgressionConfig): number {
  const workingReps = Math.max(config.baseReps, Math.floor(Math.max(0, maxReps) * WORKING_FRACTION));
  const level = 1 + Math.floor((workingReps - config.baseReps) / Math.max(1, config.repStep));
  return Math.max(1, level);
}

export function recommendStartingWorkout(
  maxReps: number,
  config: ProgressionConfig,
): ProgressionTarget {
  return targetForLevel(recommendLevel(maxReps, config), config);
}
