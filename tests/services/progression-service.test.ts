import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/data/schema';
import { _resetDbForTests } from '../../src/data/db';
import { recordWorkout } from '../../src/services/progression-service';
import { loadDashboard } from '../../src/services/dashboard';
import { saveWorkout } from '../../src/data/workouts';
import type { WorkoutResult } from '../../src/domain/workout/types';

function result(totalReps: number): WorkoutResult {
  return {
    mode: 'free',
    totalReps,
    validReps: totalReps,
    durationMs: 60000,
    detail: { reps: totalReps },
  };
}

async function persistAndRecord(reps: number, day: number) {
  await saveWorkout({
    id: `w-${day}-${reps}`,
    date: day * 86_400_000 + 1000,
    mode: 'free',
    exercises: [{ exerciseId: 'pushup', reps }],
    totalReps: reps,
    durationSec: 60,
    xpEarned: 0,
  });
  return recordWorkout(result(reps), 'pushup', day * 86_400_000 + 2000);
}

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
});

describe('recordWorkout progression pipeline', () => {
  it('awards XP, sets a first PR and first-workout achievement', async () => {
    const outcome = await persistAndRecord(30, 10);
    expect(outcome.xpEarned).toBe(150); // 30 reps * 5
    expect(outcome.totalXp).toBe(150);
    expect(outcome.level).toBe(2); // 150 XP → level 2
    expect(outcome.newPRs).toContain('highestVolume');
    expect(outcome.newAchievements).toContain('first-workout');
    expect(outcome.streak).toBe(1);
  });

  it('accumulates XP, extends streak, and only beats a PR when higher', async () => {
    await persistAndRecord(20, 10); // day 10
    const second = await persistAndRecord(10, 11); // day 11, fewer reps
    expect(second.streak).toBe(2);
    expect(second.newPRs).not.toContain('highestVolume'); // 10 < 20, no new PR
    expect(second.totalXp).toBe(150); // 100 + 50
  });

  it('feeds the dashboard', async () => {
    await persistAndRecord(40, 10);
    const dash = await loadDashboard(10 * 86_400_000 + 5000);
    expect(dash.totalWorkouts).toBe(1);
    expect(dash.totalReps).toBe(40);
    expect(dash.today.reps).toBe(40);
    expect(dash.progress.level).toBeGreaterThanOrEqual(2);
    expect(dash.muscle.chest).toBe(40); // pushup primary
    expect(dash.prs.length).toBeGreaterThan(0);
  });
});
