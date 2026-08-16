import { describe, expect, it } from 'vitest';
import { levelForXp, levelProgress, totalXpForLevel, xpForReps } from '../../src/domain/progression/xp';
import {
  DEFAULT_PROGRESSION,
  advanceLevel,
  meetsTarget,
  targetForLevel,
} from '../../src/domain/progression/progression';
import { recommendLevel, recommendStartingWorkout } from '../../src/domain/progression/assessment';
import { evaluatePRs, isBetter } from '../../src/domain/progression/records';
import { computeStreak } from '../../src/domain/progression/streak';
import { ACHIEVEMENTS, evaluateAchievements } from '../../src/domain/progression/achievements';
import { generateDailyChallenge } from '../../src/domain/progression/challenges';
import { muscleVolume } from '../../src/domain/progression/volume';

describe('xp', () => {
  it('xpForReps: 5 per rep, clamps negatives', () => {
    expect(xpForReps(10)).toBe(50);
    expect(xpForReps(-3)).toBe(0);
  });
  it('totalXpForLevel curve', () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(300);
    expect(totalXpForLevel(0)).toBe(0);
  });
  it('levelForXp thresholds', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(-50)).toBe(1);
  });
  it('levelProgress breakdown', () => {
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(50);
    expect(p.xpForNextLevel).toBe(200);
    expect(p.xpRemaining).toBe(150);
  });
});

describe('progression', () => {
  it('target grows with level', () => {
    expect(targetForLevel(1, DEFAULT_PROGRESSION)).toMatchObject({ sets: 3, reps: 8 });
    expect(targetForLevel(5, DEFAULT_PROGRESSION).reps).toBe(12);
  });
  it('advances only on success', () => {
    expect(advanceLevel(4, true)).toBe(5);
    expect(advanceLevel(4, false)).toBe(4);
  });
  it('meetsTarget compares total reps to sets×reps', () => {
    expect(meetsTarget(1, 24, DEFAULT_PROGRESSION)).toBe(true); // 3×8
    expect(meetsTarget(1, 23, DEFAULT_PROGRESSION)).toBe(false);
  });
});

describe('assessment', () => {
  it('recommends a higher level for a stronger max', () => {
    const weak = recommendLevel(10, DEFAULT_PROGRESSION);
    const strong = recommendLevel(40, DEFAULT_PROGRESSION);
    expect(strong).toBeGreaterThan(weak);
    expect(recommendLevel(0, DEFAULT_PROGRESSION)).toBeGreaterThanOrEqual(1);
  });
  it('produces a startable workout', () => {
    const w = recommendStartingWorkout(30, DEFAULT_PROGRESSION);
    expect(w.sets).toBeGreaterThan(0);
    expect(w.reps).toBeGreaterThan(0);
  });
});

describe('records', () => {
  it('higher-is-better and lower-is-better metrics', () => {
    expect(isBetter('maxReps', 20, 15)).toBe(true);
    expect(isBetter('maxReps', 10, 15)).toBe(false);
    expect(isBetter('fastestCompletion', 90, 120)).toBe(true); // lower time is better
    expect(isBetter('maxReps', 5, undefined)).toBe(true); // first record
  });
  it('evaluatePRs returns only beaten metrics', () => {
    const beaten = evaluatePRs(
      [
        { metric: 'maxReps', value: 20 },
        { metric: 'highestVolume', value: 100 },
      ],
      { maxReps: 15, highestVolume: 200 },
    );
    expect(beaten.map((b) => b.metric)).toEqual(['maxReps']);
  });
});

describe('streak', () => {
  const DAY = 86_400_000;
  it('counts consecutive days ending today', () => {
    const now = 10 * DAY + 5000;
    const days = [10 * DAY, 9 * DAY, 8 * DAY, 6 * DAY].map((d) => d + 100);
    expect(computeStreak(days, now)).toBe(3);
  });
  it('allows the streak to hold from yesterday', () => {
    const now = 10 * DAY;
    expect(computeStreak([9 * DAY, 8 * DAY], now)).toBe(2);
  });
  it('is 0 with no recent workout', () => {
    const now = 10 * DAY;
    expect(computeStreak([5 * DAY], now)).toBe(0);
    expect(computeStreak([], now)).toBe(0);
  });
});

describe('achievements', () => {
  it('unlocks based on stats and skips already-unlocked', () => {
    const stats = { totalWorkouts: 1, totalReps: 120, prCount: 1, streakDays: 0 };
    const newly = evaluateAchievements(stats, new Set());
    expect(newly).toContain('first-workout');
    expect(newly).toContain('reps-100');
    expect(newly).toContain('first-pr');
    expect(newly).not.toContain('streak-7');

    const again = evaluateAchievements(stats, new Set(newly));
    expect(again).toHaveLength(0);
  });
  it('has stable ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('daily challenge', () => {
  it('is deterministic for a date', () => {
    const exercises = [
      { id: 'pushup', type: 'repetition' },
      { id: 'plank', type: 'duration' },
    ];
    const a = generateDailyChallenge('2026-08-17', exercises);
    const b = generateDailyChallenge('2026-08-17', exercises);
    expect(a).toEqual(b);
    expect(a.target).toBeGreaterThan(0);
  });
});

describe('muscle volume', () => {
  it('credits primary fully and secondary at half', () => {
    const lookup = (id: string) =>
      id === 'pushup' ? { primary: ['chest'], secondary: ['triceps'] } : undefined;
    const totals = muscleVolume([{ exerciseId: 'pushup', reps: 10 }], lookup);
    expect(totals.chest).toBe(10);
    expect(totals.triceps).toBe(5);
  });
});
