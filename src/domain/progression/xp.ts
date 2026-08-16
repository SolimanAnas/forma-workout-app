/** XP / leveling math (spec §27 gamification). PURE domain — plain math, no imports. */

function safeXp(xp: number): number {
  return Math.max(0, Number.isFinite(xp) ? xp : 0);
}

/** 5 XP per valid rep. */
export function xpForReps(validReps: number): number {
  return Math.max(0, Math.round(validReps) * 5);
}

/** Cumulative XP required to reach a level (level 1 = 0). */
export function totalXpForLevel(level: number): number {
  if (level < 1) return 0;
  return 50 * (level - 1) * level;
}

/** Highest level (>= 1) whose threshold is at/under `xp`. */
export function levelForXp(xp: number): number {
  const x = safeXp(xp);
  let level = 1;
  while (totalXpForLevel(level + 1) <= x) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
}

/** Breakdown of where `xp` sits within the current level (spec §27). */
export function levelProgress(xp: number): LevelProgress {
  const x = safeXp(xp);
  const level = levelForXp(x);
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const xpIntoLevel = x - base;
  const xpForNextLevel = next - base;
  return { level, xpIntoLevel, xpForNextLevel, xpRemaining: xpForNextLevel - xpIntoLevel };
}
