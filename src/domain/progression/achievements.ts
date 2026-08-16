/** Achievements (spec §27). PURE domain — definitions + evaluation, kept optional/non-intrusive. */

export interface AchievementStats {
  totalWorkouts: number;
  totalReps: number;
  prCount: number;
  streakDays: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  test: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first-workout', name: 'First Workout', description: 'Complete your first workout.', test: (s) => s.totalWorkouts >= 1 },
  { id: 'ten-workouts', name: '10 Workouts', description: 'Complete 10 workouts.', test: (s) => s.totalWorkouts >= 10 },
  { id: 'reps-100', name: '100 Reps', description: 'Accumulate 100 total reps.', test: (s) => s.totalReps >= 100 },
  { id: 'reps-1000', name: '1,000 Reps', description: 'Accumulate 1,000 total reps.', test: (s) => s.totalReps >= 1000 },
  { id: 'first-pr', name: 'First PR', description: 'Set your first personal record.', test: (s) => s.prCount >= 1 },
  { id: 'streak-7', name: '7-Day Streak', description: 'Work out 7 days in a row.', test: (s) => s.streakDays >= 7 },
  { id: 'streak-30', name: '30-Day Streak', description: 'Work out 30 days in a row.', test: (s) => s.streakDays >= 30 },
];

/** Returns the ids of achievements newly unlocked by `stats` (not already in `unlocked`). */
export function evaluateAchievements(
  stats: AchievementStats,
  unlocked: ReadonlySet<string>,
): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.test(stats)).map((a) => a.id);
}
