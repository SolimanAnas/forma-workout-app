/** Muscle-group volume aggregation (spec §29). Training guidance, not medical precision. PURE. */

export interface ExerciseVolumeEntry {
  exerciseId: string;
  reps: number;
}

export interface MuscleLookup {
  (exerciseId: string): { primary: string[]; secondary: string[] } | undefined;
}

/**
 * Sum reps into muscle groups. Primary muscles get full credit; secondary get half — a coarse,
 * honest heuristic for a training-load view (never presented as physiological measurement).
 */
export function muscleVolume(
  entries: ExerciseVolumeEntry[],
  lookup: MuscleLookup,
): Record<string, number> {
  const totals: Record<string, number> = {};
  const add = (muscle: string, reps: number): void => {
    totals[muscle] = (totals[muscle] ?? 0) + reps;
  };
  for (const entry of entries) {
    const groups = lookup(entry.exerciseId);
    if (!groups) continue;
    for (const m of groups.primary) add(m, entry.reps);
    for (const m of groups.secondary) add(m, entry.reps * 0.5);
  }
  return totals;
}
