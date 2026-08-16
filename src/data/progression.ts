import { getDB } from './db';
import type { ProgressionRecord } from './schema';

/** Per-exercise progression persistence (spec §20). */

export async function getProgression(exerciseId: string): Promise<ProgressionRecord | undefined> {
  const db = await getDB();
  return db.get('progression', exerciseId);
}

export async function saveProgression(record: ProgressionRecord): Promise<void> {
  const db = await getDB();
  await db.put('progression', record);
}

export async function listProgression(): Promise<ProgressionRecord[]> {
  const db = await getDB();
  return db.getAll('progression');
}
