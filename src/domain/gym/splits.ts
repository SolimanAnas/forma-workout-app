import type { GymSlot, GymSplit, SlotOption } from './types';

const opt = (name: string, region: string): SlotOption => ({ name, region });
const slot = (
  id: string,
  category: string,
  target: string,
  sets: string,
  reps: string,
  options: SlotOption[],
): GymSlot => ({ id, category, target, sets, reps, options });

// ── Option pools (reused across days) ──
const CHEST_PRESS = [
  opt('Bench Press', 'Mid Chest'),
  opt('Incline Bench Press', 'Upper Chest'),
  opt('Dumbbell Bench Press', 'Mid Chest'),
  opt('Machine Chest Press', 'General Chest'),
];
const CHEST_INCLINE = [
  opt('Incline Dumbbell Press', 'Upper Chest'),
  opt('Incline Bench Press', 'Upper Chest'),
  opt('Incline Machine Press', 'Upper Chest'),
];
const CHEST_ISO = [
  opt('Pec Deck', 'General Chest'),
  opt('Cable Fly', 'General Chest'),
  opt('Dumbbell Fly', 'General Chest'),
  opt('Chest Dips', 'Lower Chest'),
];
const SHOULDER_PRESS = [
  opt('Overhead Press', 'Front Delts'),
  opt('Dumbbell Shoulder Press', 'Front Delts'),
  opt('Machine Shoulder Press', 'Front Delts'),
];
const SIDE_DELTS = [
  opt('Dumbbell Lateral Raise', 'Side Delts'),
  opt('Cable Lateral Raise', 'Side Delts'),
  opt('Machine Lateral Raise', 'Side Delts'),
];
const REAR_DELTS = [
  opt('Face Pull', 'Rear Delts'),
  opt('Reverse Pec Deck', 'Rear Delts'),
  opt('Rear Delt Fly', 'Rear Delts'),
];
const TRI_OVERHEAD = [
  opt('Cable Overhead Extension', 'Long Head'),
  opt('Dumbbell Overhead Extension', 'Long Head'),
  opt('Skull Crushers', 'Long Head'),
];
const TRI_PUSHDOWN = [
  opt('Rope Pushdown', 'Lateral Head'),
  opt('V-Bar Pushdown', 'Lateral Head'),
  opt('Straight-Bar Pushdown', 'Lateral Head'),
];
const VERTICAL_PULL = [
  opt('Pull-up', 'Lats'),
  opt('Lat Pulldown', 'Lats'),
  opt('Chin-up', 'Lats'),
  opt('Neutral-Grip Pulldown', 'Lats'),
];
const HORIZONTAL_ROW = [
  opt('Barbell Row', 'Mid Back'),
  opt('Seated Cable Row', 'Mid Back'),
  opt('Chest-Supported Row', 'Mid Back'),
  opt('T-Bar Row', 'Mid Back'),
];
const DEADLIFT_HINGE = [
  opt('Deadlift', 'Posterior Chain'),
  opt('Trap-Bar Deadlift', 'Posterior Chain'),
  opt('Rack Pull', 'Upper Back'),
];
const BICEPS_CURL = [
  opt('Barbell Curl', 'Biceps'),
  opt('EZ-Bar Curl', 'Biceps'),
  opt('Dumbbell Curl', 'Biceps'),
  opt('Cable Curl', 'Biceps'),
];
const BICEPS_HAMMER = [
  opt('Hammer Curl', 'Brachialis'),
  opt('Rope Hammer Curl', 'Brachialis'),
  opt('Incline Curl', 'Biceps Long Head'),
];
const SQUAT_MAIN = [
  opt('Back Squat', 'Quads'),
  opt('Front Squat', 'Quads'),
  opt('Hack Squat', 'Quads'),
  opt('Leg Press', 'Quads'),
];
const QUAD_ISO = [opt('Leg Extension', 'Quads'), opt('Sissy Squat', 'Quads')];
const HAM_HINGE = [
  opt('Romanian Deadlift', 'Hamstrings'),
  opt('Stiff-Leg Deadlift', 'Hamstrings'),
  opt('Good Morning', 'Hamstrings'),
];
const HAM_CURL = [opt('Lying Leg Curl', 'Hamstrings'), opt('Seated Leg Curl', 'Hamstrings')];
const GLUTES = [
  opt('Hip Thrust', 'Glutes'),
  opt('Bulgarian Split Squat', 'Glutes'),
  opt('Walking Lunge', 'Glutes'),
];
const CALVES = [
  opt('Standing Calf Raise', 'Calves'),
  opt('Seated Calf Raise', 'Calves'),
  opt('Leg-Press Calf Raise', 'Calves'),
];
const ABS = [opt('Hanging Leg Raise', 'Abs'), opt('Cable Crunch', 'Abs'), opt('Plank', 'Core')];

/** Generic accessory pool for user-added slots. */
export const ACCESSORY_POOL: SlotOption[] = [
  ...SIDE_DELTS,
  ...REAR_DELTS,
  ...BICEPS_CURL,
  ...TRI_PUSHDOWN,
  ...CALVES,
  ...ABS,
];

export const GYM_SPLITS: readonly GymSplit[] = [
  {
    id: 'ppl',
    short: 'PPL',
    name: 'Push / Pull / Legs',
    description: 'Train by movement pattern — pushing, pulling, then legs. Scales from 3 to 6 days a week.',
    level: 'Intermediate · 3–6 days/week',
    days: [
      {
        id: 'push',
        name: 'Push',
        focus: 'Chest · Shoulders · Triceps',
        slots: [
          slot('push-chest-main', 'Chest', 'Main Press', '3–4', '6–10', CHEST_PRESS),
          slot('push-chest-iso', 'Chest', 'Secondary / Isolation', '3', '8–12', CHEST_ISO),
          slot('push-sh-press', 'Shoulders', 'Shoulder Press', '3', '6–10', SHOULDER_PRESS),
          slot('push-sh-side', 'Shoulders', 'Side Delts', '3', '12–20', SIDE_DELTS),
          slot('push-tri-oh', 'Triceps', 'Overhead', '3', '10–15', TRI_OVERHEAD),
          slot('push-tri-pd', 'Triceps', 'Pushdown', '3', '10–15', TRI_PUSHDOWN),
        ],
      },
      {
        id: 'pull',
        name: 'Pull',
        focus: 'Back · Biceps · Rear Delts',
        slots: [
          slot('pull-vert', 'Back', 'Vertical Pull', '3–4', '6–12', VERTICAL_PULL),
          slot('pull-horiz', 'Back', 'Horizontal Row', '3', '8–12', HORIZONTAL_ROW),
          slot('pull-hinge', 'Back', 'Deadlift / Hinge', '2–3', '5–8', DEADLIFT_HINGE),
          slot('pull-rear', 'Rear Delts', 'Rear Delts', '3', '15–20', REAR_DELTS),
          slot('pull-bi-curl', 'Biceps', 'Curl', '3', '8–12', BICEPS_CURL),
          slot('pull-bi-hammer', 'Biceps', 'Hammer', '3', '10–15', BICEPS_HAMMER),
        ],
      },
      {
        id: 'legs',
        name: 'Legs',
        focus: 'Quads · Hamstrings · Glutes · Calves',
        slots: [
          slot('legs-squat', 'Quads', 'Squat / Main', '3–4', '5–10', SQUAT_MAIN),
          slot('legs-quad-iso', 'Quads', 'Quad Isolation', '3', '12–20', QUAD_ISO),
          slot('legs-hinge', 'Hamstrings', 'Hinge', '3', '8–12', HAM_HINGE),
          slot('legs-ham-curl', 'Hamstrings', 'Hamstring Curl', '3', '10–15', HAM_CURL),
          slot('legs-glutes', 'Glutes', 'Glutes', '3', '8–12', GLUTES),
          slot('legs-calves', 'Calves', 'Calves', '4', '12–20', CALVES),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    short: 'U/L',
    name: 'Upper / Lower',
    description: 'Alternate upper- and lower-body days. A great 4-day balance of frequency and recovery.',
    level: 'Beginner–Intermediate · 4 days/week',
    days: [
      {
        id: 'upper',
        name: 'Upper',
        focus: 'Chest · Back · Shoulders · Arms',
        slots: [
          slot('u-chest', 'Chest', 'Chest Press', '3–4', '6–10', CHEST_PRESS),
          slot('u-row', 'Back', 'Horizontal Row', '3', '8–12', HORIZONTAL_ROW),
          slot('u-vpull', 'Back', 'Vertical Pull', '3', '8–12', VERTICAL_PULL),
          slot('u-sh', 'Shoulders', 'Shoulder Press', '3', '6–10', SHOULDER_PRESS),
          slot('u-side', 'Shoulders', 'Side Delts', '3', '12–20', SIDE_DELTS),
          slot('u-bi', 'Biceps', 'Curl', '3', '8–12', BICEPS_CURL),
          slot('u-tri', 'Triceps', 'Pushdown', '3', '10–15', TRI_PUSHDOWN),
        ],
      },
      {
        id: 'lower',
        name: 'Lower',
        focus: 'Quads · Hamstrings · Glutes · Calves · Core',
        slots: [
          slot('l-squat', 'Quads', 'Squat / Main', '3–4', '5–10', SQUAT_MAIN),
          slot('l-hinge', 'Hamstrings', 'Hinge', '3', '8–12', HAM_HINGE),
          slot('l-quad', 'Quads', 'Quad Isolation', '3', '12–20', QUAD_ISO),
          slot('l-ham', 'Hamstrings', 'Hamstring Curl', '3', '10–15', HAM_CURL),
          slot('l-calf', 'Calves', 'Calves', '4', '12–20', CALVES),
          slot('l-abs', 'Core', 'Abs', '3', '10–15', ABS),
        ],
      },
    ],
  },
  {
    id: 'full-body',
    short: 'FB',
    name: 'Full Body',
    description: 'Hit every major muscle each session. Ideal for 2–3 days a week and beginners.',
    level: 'Beginner · 2–3 days/week',
    days: [
      {
        id: 'fb-a',
        name: 'Day A',
        focus: 'Full body',
        slots: [
          slot('fba-squat', 'Quads', 'Squat', '3', '5–10', SQUAT_MAIN),
          slot('fba-chest', 'Chest', 'Chest Press', '3', '6–10', CHEST_PRESS),
          slot('fba-row', 'Back', 'Row', '3', '8–12', HORIZONTAL_ROW),
          slot('fba-sh', 'Shoulders', 'Shoulder Press', '3', '8–12', SHOULDER_PRESS),
          slot('fba-calf', 'Calves', 'Calves', '3', '12–20', CALVES),
        ],
      },
      {
        id: 'fb-b',
        name: 'Day B',
        focus: 'Full body',
        slots: [
          slot('fbb-hinge', 'Hamstrings', 'Deadlift / Hinge', '3', '5–8', DEADLIFT_HINGE),
          slot('fbb-chest', 'Chest', 'Incline / Isolation', '3', '8–12', CHEST_INCLINE),
          slot('fbb-vpull', 'Back', 'Vertical Pull', '3', '8–12', VERTICAL_PULL),
          slot('fbb-quad', 'Quads', 'Leg Press / Quad', '3', '10–15', QUAD_ISO),
          slot('fbb-bi', 'Biceps', 'Curl', '3', '10–15', BICEPS_CURL),
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    short: 'BRO',
    name: 'Bro Split',
    description: 'One muscle group per day for maximum focus and volume. Best for 5 days a week.',
    level: 'Advanced · 5 days/week',
    days: [
      {
        id: 'chest',
        name: 'Chest',
        focus: 'Chest',
        slots: [
          slot('bro-chest-main', 'Chest', 'Main Press', '4', '6–10', CHEST_PRESS),
          slot('bro-chest-inc', 'Chest', 'Incline', '3', '8–12', CHEST_INCLINE),
          slot('bro-chest-iso', 'Chest', 'Isolation', '3', '12–15', CHEST_ISO),
        ],
      },
      {
        id: 'back',
        name: 'Back',
        focus: 'Back',
        slots: [
          slot('bro-back-vert', 'Back', 'Vertical Pull', '4', '6–12', VERTICAL_PULL),
          slot('bro-back-horiz', 'Back', 'Horizontal Row', '3', '8–12', HORIZONTAL_ROW),
          slot('bro-back-hinge', 'Back', 'Deadlift / Hinge', '3', '5–8', DEADLIFT_HINGE),
          slot('bro-back-rear', 'Rear Delts', 'Rear Delts', '3', '15–20', REAR_DELTS),
        ],
      },
      {
        id: 'legs',
        name: 'Legs',
        focus: 'Legs',
        slots: [
          slot('bro-legs-squat', 'Quads', 'Squat / Main', '4', '5–10', SQUAT_MAIN),
          slot('bro-legs-hinge', 'Hamstrings', 'Hinge', '3', '8–12', HAM_HINGE),
          slot('bro-legs-ham', 'Hamstrings', 'Hamstring Curl', '3', '10–15', HAM_CURL),
          slot('bro-legs-calf', 'Calves', 'Calves', '4', '12–20', CALVES),
        ],
      },
      {
        id: 'shoulders',
        name: 'Shoulders',
        focus: 'Shoulders',
        slots: [
          slot('bro-sh-press', 'Shoulders', 'Shoulder Press', '4', '6–10', SHOULDER_PRESS),
          slot('bro-sh-side', 'Shoulders', 'Side Delts', '4', '12–20', SIDE_DELTS),
          slot('bro-sh-rear', 'Shoulders', 'Rear Delts', '3', '15–20', REAR_DELTS),
        ],
      },
      {
        id: 'arms',
        name: 'Arms',
        focus: 'Biceps · Triceps',
        slots: [
          slot('bro-arms-bi', 'Biceps', 'Curl', '3', '8–12', BICEPS_CURL),
          slot('bro-arms-hammer', 'Biceps', 'Hammer', '3', '10–15', BICEPS_HAMMER),
          slot('bro-arms-tri-oh', 'Triceps', 'Overhead', '3', '10–15', TRI_OVERHEAD),
          slot('bro-arms-tri-pd', 'Triceps', 'Pushdown', '3', '10–15', TRI_PUSHDOWN),
        ],
      },
    ],
  },
];

export function getGymSplit(id: string): GymSplit | undefined {
  return GYM_SPLITS.find((s) => s.id === id);
}
