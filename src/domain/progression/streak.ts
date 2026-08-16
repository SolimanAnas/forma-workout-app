/** Workout streak computation (spec §27). PURE domain. */

const DAY_MS = 86_400_000;

function dayIndex(ts: number): number {
  return Math.floor(ts / DAY_MS);
}

/**
 * Consecutive-day streak ending today (or yesterday, so a day isn't "lost" until it fully passes).
 * `timestamps` are workout epoch-ms values in any order.
 */
export function computeStreak(timestamps: number[], now: number): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map(dayIndex));
  const today = dayIndex(now);

  let cursor: number;
  if (days.has(today)) cursor = today;
  else if (days.has(today - 1)) cursor = today - 1;
  else return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
