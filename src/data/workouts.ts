import { getDB } from './db';
import type { WorkoutRecord } from './schema';

/** Workout history persistence (spec §30). Local-first, offline. */

export async function saveWorkout(record: WorkoutRecord): Promise<void> {
  const db = await getDB();
  await db.put('workouts', record);
}

export async function getWorkout(id: string): Promise<WorkoutRecord | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function listWorkouts(): Promise<WorkoutRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('workouts', 'by-date');
  return all.reverse(); // newest first
}
