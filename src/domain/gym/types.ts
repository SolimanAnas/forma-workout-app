/** Gym training-split reference data (weighted gym work). PURE domain — no sensors involved. */

export interface GymExercise {
  name: string;
  /** Primary muscles worked, e.g. ['Chest', 'Triceps']. */
  primaryMuscles: string[];
  /** Recommended set count, e.g. '3–4'. */
  sets: string;
  /** Recommended rep range, e.g. '8–12'. */
  reps: string;
  /** Common variations, e.g. ['Barbell', 'Dumbbell', 'Incline', 'Machine']. */
  variations: string[];
}

export interface GymDay {
  id: string;
  name: string;
  /** Short focus line, e.g. 'Chest · Shoulders · Triceps'. */
  focus: string;
  exercises: GymExercise[];
}

export interface GymSplit {
  id: string;
  /** Abbreviation, e.g. 'PPL'. */
  short: string;
  name: string;
  description: string;
  /** Cadence / difficulty hint, e.g. 'Intermediate · 3–6 days/week'. */
  level: string;
  days: GymDay[];
}
