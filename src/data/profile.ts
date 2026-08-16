import { getDB } from './db';
import type { ProfileRecord } from './schema';

/** Local user profile + XP store (spec §27, §30). */

export async function getProfile(): Promise<ProfileRecord> {
  const db = await getDB();
  const existing = await db.get('profile', 'me');
  if (existing) return existing;
  const fresh: ProfileRecord = { id: 'me', createdAt: Date.now(), xp: 0 };
  await db.put('profile', fresh);
  return fresh;
}

export async function getXp(): Promise<number> {
  return (await getProfile()).xp;
}

/** Adds XP and returns the new total. */
export async function addXp(amount: number): Promise<number> {
  const db = await getDB();
  const profile = await getProfile();
  profile.xp = Math.max(0, profile.xp + Math.max(0, amount));
  await db.put('profile', profile);
  return profile.xp;
}
