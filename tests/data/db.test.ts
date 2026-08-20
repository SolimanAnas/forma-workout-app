import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB, openDB } from 'idb';
import { getDB, _resetDbForTests } from '../../src/data/db';
import { DB_NAME } from '../../src/data/schema';
import { getAllSettings, getSetting, setSetting, DEFAULT_SETTINGS } from '../../src/data/settings';
import {
  deleteRecording,
  getRecording,
  listRecordings,
  saveRecording,
} from '../../src/data/recordings';
import { getCalibration, saveCalibration } from '../../src/data/calibrations';
import type { SensorRecording } from '../../src/sensors/replay/recording';

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
});

describe('IndexedDB migration (empty → latest)', () => {
  it('creates all object stores and indexes', async () => {
    const db = await getDB();
    expect([...db.objectStoreNames].sort()).toEqual(
      [
        'achievements',
        'calendarEvents',
        'calibrations',
        'challenges',
        'personalRecords',
        'profile',
        'progression',
        'recordings',
        'settings',
        'workouts',
      ].sort(),
    );

    const tx = db.transaction('workouts');
    expect([...tx.store.indexNames]).toContain('by-date');
  });

  it('migrates a v1 database to v2 without losing data', async () => {
    // Simulate an existing v1 database with a persisted setting.
    const v1 = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
    await v1.put('settings', { key: 'theme', value: 'dark' });
    v1.close();

    // Opening at the current version runs the v1 → v2 migration.
    const db = await getDB();
    expect([...db.objectStoreNames]).toContain('recordings');
    const migrated = await db.get('settings', 'theme');
    expect(migrated?.value).toBe('dark');
  });
});

describe('settings repository', () => {
  it('returns defaults when unset', async () => {
    expect(await getSetting('theme')).toBe(DEFAULT_SETTINGS.theme);
    expect(await getAllSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips a value', async () => {
    await setSetting('theme', 'dark');
    await setSetting('voiceCoach', false);
    expect(await getSetting('theme')).toBe('dark');
    expect(await getSetting('voiceCoach')).toBe(false);

    const all = await getAllSettings();
    expect(all.theme).toBe('dark');
    expect(all.voiceCoach).toBe(false);
    // Unset keys keep defaults.
    expect(all.units).toBe(DEFAULT_SETTINGS.units);
  });
});

describe('workouts store', () => {
  it('persists and queries by date index', async () => {
    const db = await getDB();
    await db.put('workouts', {
      id: 'w1',
      date: 1000,
      mode: 'free',
      exercises: [],
      totalReps: 12,
      durationSec: 60,
      xpEarned: 10,
    });
    const fromIndex = await db.getFromIndex('workouts', 'by-date', 1000);
    expect(fromIndex?.id).toBe('w1');
    expect(fromIndex?.totalReps).toBe(12);
  });
});

describe('recordings repository', () => {
  const rec: SensorRecording = {
    id: 'rec-1',
    formatVersion: 1,
    exerciseId: 'pushup',
    startedAt: 5000,
    durationMs: 1000,
    sampleCount: 1,
    samples: [{ kind: 'accelerometer', t: 0, x: 1, y: 2, z: 3, source: 'device-motion' }],
  };

  it('saves, reads, lists and deletes recordings', async () => {
    await saveRecording(rec);
    expect((await getRecording('rec-1'))?.exerciseId).toBe('pushup');

    await saveRecording({ ...rec, id: 'rec-2', startedAt: 9000 });
    const list = await listRecordings();
    expect(list.map((r) => r.id)).toEqual(['rec-2', 'rec-1']); // newest first

    await deleteRecording('rec-1');
    expect(await getRecording('rec-1')).toBeUndefined();
  });
});

describe('calibration persistence', () => {
  it('saves and reloads a per-exercise baseline', async () => {
    await saveCalibration('pushup', { baseline: 9.81, restStd: 0.05, sampleCount: 60 });
    const loaded = await getCalibration('pushup');
    expect(loaded?.baseline).toBeCloseTo(9.81, 2);
    expect(await getCalibration('squat')).toBeUndefined();
  });
});
