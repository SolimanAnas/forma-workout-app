import type { GymExercise, GymSplit } from './types';

/** Concise exercise builder. */
const ex = (
  name: string,
  primaryMuscles: string[],
  sets: string,
  reps: string,
  variations: string[],
): GymExercise => ({ name, primaryMuscles, sets, reps, variations });

// ── Reusable exercises ──
const BENCH = ex('Bench Press', ['Chest', 'Triceps', 'Front Delts'], '3–4', '6–10', ['Barbell', 'Dumbbell', 'Incline', 'Machine']);
const OHP = ex('Overhead Press', ['Front Delts', 'Triceps'], '3', '6–10', ['Barbell', 'Dumbbell', 'Seated', 'Machine']);
const INCLINE_DB = ex('Incline Dumbbell Press', ['Upper Chest', 'Front Delts'], '3', '8–12', ['Dumbbell', 'Barbell', 'Smith']);
const LATERAL = ex('Lateral Raise', ['Side Delts'], '3', '12–20', ['Dumbbell', 'Cable', 'Machine']);
const PUSHDOWN = ex('Triceps Pushdown', ['Triceps'], '3', '10–15', ['Rope', 'Bar', 'Single-arm']);
const OH_TRI = ex('Overhead Triceps Extension', ['Triceps'], '3', '10–15', ['Dumbbell', 'Cable', 'EZ-bar']);

const DEADLIFT = ex('Deadlift', ['Back', 'Glutes', 'Hamstrings'], '3', '5–8', ['Conventional', 'Sumo', 'Trap-bar']);
const ROW = ex('Barbell Row', ['Upper Back', 'Lats'], '3–4', '6–10', ['Barbell', 'Dumbbell', 'Chest-supported', 'Machine']);
const PULLUP = ex('Pull-up', ['Lats', 'Biceps'], '3', '6–12', ['Pull-up', 'Chin-up', 'Lat Pulldown', 'Assisted']);
const CABLE_ROW = ex('Seated Cable Row', ['Upper Back', 'Lats'], '3', '8–12', ['Cable', 'Chest-supported', 'Machine']);
const FACE_PULL = ex('Face Pull', ['Rear Delts', 'Traps'], '3', '15–20', ['Cable', 'Band']);
const CURL = ex('Barbell Curl', ['Biceps'], '3', '8–12', ['Barbell', 'EZ-bar', 'Dumbbell', 'Cable']);
const HAMMER = ex('Hammer Curl', ['Biceps', 'Forearms'], '3', '10–15', ['Dumbbell', 'Cable', 'Rope']);

const SQUAT = ex('Squat', ['Quads', 'Glutes'], '3–4', '5–10', ['Back', 'Front', 'Hack', 'Goblet']);
const RDL = ex('Romanian Deadlift', ['Hamstrings', 'Glutes'], '3', '8–12', ['Barbell', 'Dumbbell', 'Single-leg']);
const LEG_PRESS = ex('Leg Press', ['Quads', 'Glutes'], '3', '10–15', ['Machine', 'Single-leg']);
const LEG_CURL = ex('Leg Curl', ['Hamstrings'], '3', '10–15', ['Lying', 'Seated', 'Standing']);
const LEG_EXT = ex('Leg Extension', ['Quads'], '3', '12–20', ['Machine']);
const CALF = ex('Calf Raise', ['Calves'], '4', '12–20', ['Standing', 'Seated', 'Leg-press']);
const LAT_PULL = ex('Lat Pulldown', ['Lats', 'Biceps'], '3', '8–12', ['Wide', 'Neutral', 'Close']);
const LEG_RAISE = ex('Hanging Leg Raise', ['Abs', 'Hip Flexors'], '3', '10–15', ['Hanging', 'Captain’s Chair', 'Lying']);

export const GYM_SPLITS: readonly GymSplit[] = [
  {
    id: 'ppl',
    short: 'PPL',
    name: 'Push / Pull / Legs',
    description: 'Train by movement pattern — pushing, pulling, then legs. Scales from 3 to 6 days a week.',
    level: 'Intermediate · 3–6 days/week',
    days: [
      { id: 'push', name: 'Push', focus: 'Chest · Shoulders · Triceps', exercises: [BENCH, OHP, INCLINE_DB, LATERAL, PUSHDOWN, OH_TRI] },
      { id: 'pull', name: 'Pull', focus: 'Back · Biceps · Rear Delts', exercises: [DEADLIFT, PULLUP, CABLE_ROW, FACE_PULL, CURL, HAMMER] },
      { id: 'legs', name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves', exercises: [SQUAT, RDL, LEG_PRESS, LEG_CURL, LEG_EXT, CALF] },
    ],
  },
  {
    id: 'upper-lower',
    short: 'U/L',
    name: 'Upper / Lower',
    description: 'Alternate upper- and lower-body days. Great 4-day balance of frequency and recovery.',
    level: 'Beginner–Intermediate · 4 days/week',
    days: [
      { id: 'upper', name: 'Upper', focus: 'Chest · Back · Shoulders · Arms', exercises: [BENCH, ROW, OHP, LAT_PULL, LATERAL, CURL, PUSHDOWN] },
      { id: 'lower', name: 'Lower', focus: 'Quads · Hamstrings · Glutes · Calves · Core', exercises: [SQUAT, RDL, LEG_PRESS, LEG_CURL, CALF, LEG_RAISE] },
    ],
  },
  {
    id: 'full-body',
    short: 'FB',
    name: 'Full Body',
    description: 'Hit every major muscle each session. Ideal for 2–3 days a week and beginners.',
    level: 'Beginner · 2–3 days/week',
    days: [
      { id: 'fb-a', name: 'Day A', focus: 'Full body', exercises: [SQUAT, BENCH, ROW, OHP, CALF] },
      { id: 'fb-b', name: 'Day B', focus: 'Full body', exercises: [DEADLIFT, INCLINE_DB, LAT_PULL, LEG_PRESS, CURL] },
    ],
  },
  {
    id: 'bro-split',
    short: 'BRO',
    name: 'Bro Split',
    description: 'One muscle group per day for maximum focus and volume. Best for 5 days a week.',
    level: 'Advanced · 5 days/week',
    days: [
      { id: 'chest', name: 'Chest', focus: 'Chest', exercises: [BENCH, INCLINE_DB, ex('Chest Fly', ['Chest'], '3', '12–15', ['Cable', 'Dumbbell', 'Pec-deck']), ex('Dips', ['Chest', 'Triceps'], '3', '8–12', ['Parallel', 'Assisted', 'Weighted'])] },
      { id: 'back', name: 'Back', focus: 'Back', exercises: [DEADLIFT, PULLUP, ROW, CABLE_ROW, FACE_PULL] },
      { id: 'legs', name: 'Legs', focus: 'Legs', exercises: [SQUAT, RDL, LEG_PRESS, LEG_CURL, CALF] },
      { id: 'shoulders', name: 'Shoulders', focus: 'Shoulders', exercises: [OHP, LATERAL, FACE_PULL, ex('Rear Delt Fly', ['Rear Delts'], '3', '15–20', ['Cable', 'Dumbbell', 'Machine'])] },
      { id: 'arms', name: 'Arms', focus: 'Biceps · Triceps', exercises: [CURL, HAMMER, PUSHDOWN, OH_TRI] },
    ],
  },
];

export function getGymSplit(id: string): GymSplit | undefined {
  return GYM_SPLITS.find((s) => s.id === id);
}
