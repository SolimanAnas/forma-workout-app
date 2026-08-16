/** Per-exercise progression (spec §19, §20). PURE domain. Rules are configurable, not hard-coded. */

export interface ProgressionConfig {
  /** Reps in a set at level 1. */
  baseReps: number;
  /** Sets performed each session. */
  baseSets: number;
  /** Extra reps per set added per level. */
  repStep: number;
}

export interface ProgressionTarget {
  level: number;
  sets: number;
  reps: number;
}

export const DEFAULT_PROGRESSION: ProgressionConfig = { baseReps: 8, baseSets: 3, repStep: 1 };

/** The training target (sets × reps) for a given level. */
export function targetForLevel(level: number, config: ProgressionConfig): ProgressionTarget {
  const lvl = Math.max(1, Math.round(level));
  return {
    level: lvl,
    sets: config.baseSets,
    reps: config.baseReps + (lvl - 1) * config.repStep,
  };
}

/** Advance (or hold) a level based on whether the session's target was met. */
export function advanceLevel(level: number, success: boolean): number {
  const lvl = Math.max(1, Math.round(level));
  return success ? lvl + 1 : lvl;
}

/** Did the athlete complete the target for their level? */
export function meetsTarget(
  level: number,
  totalReps: number,
  config: ProgressionConfig,
): boolean {
  const target = targetForLevel(level, config);
  return totalReps >= target.sets * target.reps;
}
