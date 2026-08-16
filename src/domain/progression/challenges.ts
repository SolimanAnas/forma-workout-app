/** Daily challenge generation (spec §25). PURE domain — deterministic from the date. */

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  kind: 'reps' | 'duration';
  target: number;
  label: string;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Deterministically pick a challenge for a date from the available exercises. Duration-type
 * exercises (e.g. plank) get a time target; the rest get a rep target.
 */
export function generateDailyChallenge(
  date: string,
  exercises: { id: string; type: string }[],
): DailyChallenge {
  if (exercises.length === 0) throw new Error('no exercises available');
  const h = hashString(date);
  const exercise = exercises[h % exercises.length];

  if (exercise.type === 'duration') {
    const seconds = [60, 90, 120, 180][h % 4];
    return {
      id: `${date}:${exercise.id}:duration`,
      date,
      exerciseId: exercise.id,
      kind: 'duration',
      target: seconds,
      label: `Hold a ${exercise.id} for ${seconds}s`,
    };
  }

  const reps = [50, 75, 100, 150][h % 4];
  return {
    id: `${date}:${exercise.id}:reps`,
    date,
    exerciseId: exercise.id,
    kind: 'reps',
    target: reps,
    label: `${reps} ${exercise.id} reps today`,
  };
}
