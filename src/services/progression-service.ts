import type { WorkoutResult } from '../domain/workout/types';
import { xpForReps, levelForXp } from '../domain/progression/xp';
import { evaluatePRs, type PrCandidate, type PrMetric } from '../domain/progression/records';
import {
  DEFAULT_PROGRESSION,
  advanceLevel,
  meetsTarget,
  targetForLevel,
} from '../domain/progression/progression';
import { computeStreak } from '../domain/progression/streak';
import { evaluateAchievements } from '../domain/progression/achievements';
import { addXp } from '../data/profile';
import { getProgression, saveProgression } from '../data/progression';
import { countPRs, getPRsForExercise, savePR } from '../data/records';
import { getUnlocked, unlockAchievement } from '../data/achievements';
import { listWorkouts } from '../data/workouts';

export interface WorkoutOutcome {
  xpEarned: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newPRs: PrMetric[];
  newAchievements: string[];
  streak: number;
}

/**
 * Post-workout progression pipeline (spec §20, §26, §27). Assumes the workout record was already
 * persisted. Updates XP, PRs, per-exercise level, streak, and achievements, and reports what changed
 * so the results screen can celebrate it.
 */
export async function recordWorkout(
  result: WorkoutResult,
  exerciseId: string,
  now: number = Date.now(),
): Promise<WorkoutOutcome> {
  // XP + level.
  const xpEarned = xpForReps(result.validReps);
  const totalXp = await addXp(xpEarned);
  const level = levelForXp(totalXp);
  const leveledUp = levelForXp(totalXp - xpEarned) < level;

  // Personal records (session volume + reps proxies).
  const candidates: PrCandidate[] = [
    { metric: 'highestVolume', value: result.totalReps },
    { metric: 'maxReps', value: result.totalReps },
  ];
  const existing = await getPRsForExercise(exerciseId);
  const beaten = evaluatePRs(candidates, existing);
  for (const pr of beaten) await savePR(exerciseId, pr.metric, pr.value);

  // Per-exercise progression.
  const prog = await getProgression(exerciseId);
  const currentLevel = prog?.level ?? 1;
  const success = meetsTarget(currentLevel, result.totalReps, DEFAULT_PROGRESSION);
  const nextLevel = advanceLevel(currentLevel, success);
  await saveProgression({
    exerciseId,
    level: nextLevel,
    maxReps: Math.max(prog?.maxReps ?? 0, result.totalReps),
    target: {
      sets: targetForLevel(nextLevel, DEFAULT_PROGRESSION).sets,
      reps: targetForLevel(nextLevel, DEFAULT_PROGRESSION).reps,
    },
    updatedAt: now,
  });

  // Streak + achievements (from the full, already-persisted history).
  const workouts = await listWorkouts();
  const streak = computeStreak(
    workouts.map((w) => w.date),
    now,
  );
  const totalReps = workouts.reduce((sum, w) => sum + w.totalReps, 0);
  const prCount = await countPRs();
  const unlocked = await getUnlocked();
  const newAchievements = evaluateAchievements(
    { totalWorkouts: workouts.length, totalReps, prCount, streakDays: streak },
    unlocked,
  );
  for (const id of newAchievements) await unlockAchievement(id);

  return {
    xpEarned,
    totalXp,
    level,
    leveledUp,
    newPRs: beaten.map((b) => b.metric),
    newAchievements,
    streak,
  };
}
