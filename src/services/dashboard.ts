import { getXp } from '../data/profile';
import { listWorkouts } from '../data/workouts';
import { listPRs } from '../data/records';
import { listProgression } from '../data/progression';
import { levelProgress, xpForReps, type LevelProgress } from '../domain/progression/xp';
import { computeStreak } from '../domain/progression/streak';
import { muscleVolume } from '../domain/progression/volume';
import { generateDailyChallenge, type DailyChallenge } from '../domain/progression/challenges';
import { getExerciseById, EXERCISE_DEFINITIONS } from '../domain/exercise/definitions';
import type { WorkoutRecord } from '../data/schema';

const DAY_MS = 86_400_000;
const dayIndex = (ts: number): number => Math.floor(ts / DAY_MS);

interface WorkoutExerciseEntry {
  exerciseId: string;
  reps: number;
}

function entriesOf(workout: WorkoutRecord): WorkoutExerciseEntry[] {
  return (workout.exercises as WorkoutExerciseEntry[]).filter(
    (e) => e && typeof e.exerciseId === 'string' && typeof e.reps === 'number',
  );
}

export interface DashboardData {
  xp: number;
  progress: LevelProgress;
  streak: number;
  totalWorkouts: number;
  totalReps: number;
  today: { workouts: number; reps: number; xp: number };
  recent: WorkoutRecord[];
  prs: { exerciseId: string; metric: string; value: number }[];
  muscle: Record<string, number>;
  perExercise: { exerciseId: string; level: number; target: { sets: number; reps: number } }[];
  challenge: DailyChallenge;
}

export async function loadDashboard(now: number = Date.now()): Promise<DashboardData> {
  const [xp, workouts, prs, progression] = await Promise.all([
    getXp(),
    listWorkouts(),
    listPRs(),
    listProgression(),
  ]);

  const today = dayIndex(now);
  const todayWorkouts = workouts.filter((w) => dayIndex(w.date) === today);
  const todayReps = todayWorkouts.reduce((s, w) => s + w.totalReps, 0);
  const totalReps = workouts.reduce((s, w) => s + w.totalReps, 0);

  const muscle = muscleVolume(
    workouts.flatMap(entriesOf),
    (id) => getExerciseById(id)?.muscleGroups,
  );

  const dateStr = new Date(now).toISOString().slice(0, 10);
  const challenge = generateDailyChallenge(
    dateStr,
    EXERCISE_DEFINITIONS.map((e) => ({ id: e.id, type: e.type })),
  );

  return {
    xp,
    progress: levelProgress(xp),
    streak: computeStreak(
      workouts.map((w) => w.date),
      now,
    ),
    totalWorkouts: workouts.length,
    totalReps,
    today: { workouts: todayWorkouts.length, reps: todayReps, xp: xpForReps(todayReps) },
    recent: workouts.slice(0, 5),
    prs,
    muscle,
    perExercise: progression.map((p) => ({
      exerciseId: p.exerciseId,
      level: p.level,
      target: p.target,
    })),
    challenge,
  };
}
