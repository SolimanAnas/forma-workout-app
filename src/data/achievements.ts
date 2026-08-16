import { getDB } from './db';

/** Achievement unlock persistence (spec §27). */

export async function getUnlocked(): Promise<Set<string>> {
  const db = await getDB();
  const rows = await db.getAll('achievements');
  return new Set(rows.map((r) => r.id));
}

export async function unlockAchievement(id: string): Promise<void> {
  const db = await getDB();
  await db.put('achievements', { id, unlockedAt: Date.now() });
}
