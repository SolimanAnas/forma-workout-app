import { getDB } from './db';

/**
 * Persists the user's gym slot choices in the existing `settings` KV store (no migration).
 * Keys are split-scoped — `${splitId}:${dayId}:${slotId}` → exercise name — so choices in one
 * split never affect another. Survives page refresh and app restart.
 */
export type GymSelectionMap = Record<string, string>;

const KEY = 'gymSelections';

export async function loadGymSelections(): Promise<GymSelectionMap> {
  const db = await getDB();
  const rec = await db.get('settings', KEY);
  return (rec?.value as GymSelectionMap | undefined) ?? {};
}

export async function saveGymSelection(key: string, optionName: string): Promise<void> {
  const db = await getDB();
  const map = await loadGymSelections();
  map[key] = optionName;
  await db.put('settings', { key: KEY, value: map });
}

/** Removes all saved choices whose key starts with `prefix` (e.g. reset one split/day). */
export async function clearGymSelections(prefix: string): Promise<void> {
  const db = await getDB();
  const map = await loadGymSelections();
  let changed = false;
  for (const k of Object.keys(map)) {
    if (k.startsWith(prefix)) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) await db.put('settings', { key: KEY, value: map });
}
