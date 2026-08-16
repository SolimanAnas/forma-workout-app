import { getDB } from './db';
import type { PrMetric } from '../domain/progression/records';

/** Personal-record persistence (spec §26). */

export async function getPRsForExercise(
  exerciseId: string,
): Promise<Partial<Record<PrMetric, number>>> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('personalRecords', 'by-exercise', exerciseId);
  const out: Partial<Record<PrMetric, number>> = {};
  for (const row of rows) out[row.metric as PrMetric] = row.value;
  return out;
}

export async function savePR(
  exerciseId: string,
  metric: PrMetric,
  value: number,
): Promise<void> {
  const db = await getDB();
  await db.put('personalRecords', {
    id: `${exerciseId}:${metric}`,
    exerciseId,
    metric,
    value,
    achievedAt: Date.now(),
  });
}

export async function countPRs(): Promise<number> {
  const db = await getDB();
  return db.count('personalRecords');
}

export async function listPRs(): Promise<
  { exerciseId: string; metric: string; value: number }[]
> {
  const db = await getDB();
  return db.getAll('personalRecords');
}
