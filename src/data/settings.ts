import { getDB } from './db';

export type ThemePref = 'system' | 'light' | 'dark';
export type Units = 'metric' | 'imperial';

export interface AppSettings {
  theme: ThemePref;
  voiceCoach: boolean;
  units: Units;
  devMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  voiceCoach: true,
  units: 'metric',
  devMode: false,
};

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const db = await getDB();
  const rec = await db.get('settings', key);
  return (rec?.value as AppSettings[K] | undefined) ?? DEFAULT_SETTINGS[key];
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings(): Promise<AppSettings> {
  const db = await getDB();
  const rows = await db.getAll('settings');
  const result: AppSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in result) {
      (result as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return result;
}
