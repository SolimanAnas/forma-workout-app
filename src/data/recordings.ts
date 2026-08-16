import { getDB } from './db';
import type { SensorRecording } from '../sensors/replay/recording';

/** Persistence for developer sensor recordings (spec §39). Local-only, never uploaded. */

export async function saveRecording(recording: SensorRecording): Promise<void> {
  const db = await getDB();
  await db.put('recordings', recording);
}

export async function getRecording(id: string): Promise<SensorRecording | undefined> {
  const db = await getDB();
  return db.get('recordings', id);
}

export async function listRecordings(): Promise<SensorRecording[]> {
  const db = await getDB();
  // Newest first.
  const all = await db.getAllFromIndex('recordings', 'by-started');
  return all.reverse();
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recordings', id);
}
