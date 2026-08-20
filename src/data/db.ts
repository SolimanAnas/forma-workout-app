import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type FormaDB } from './schema';

let dbPromise: Promise<IDBPDatabase<FormaDB>> | null = null;

/**
 * Opens (and memoizes) the Forma IndexedDB connection.
 * Schema changes MUST be additive migrations keyed on `oldVersion` — never assume the
 * database already has the latest schema (spec §43).
 */
export function getDB(): Promise<IDBPDatabase<FormaDB>> {
  dbPromise ??= openDB<FormaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      migrate(db, oldVersion);
    },
  });
  return dbPromise;
}

function migrate(db: IDBPDatabase<FormaDB>, oldVersion: number): void {
  // Each block upgrades from the previous version. Do not reorder; only append.
  if (oldVersion < 1) {
    createV1(db);
  }
  if (oldVersion < 2) {
    createV2(db);
  }
  if (oldVersion < 3) {
    createV3(db);
  }
}

function createV1(db: IDBPDatabase<FormaDB>): void {
  db.createObjectStore('settings', { keyPath: 'key' });
  db.createObjectStore('profile', { keyPath: 'id' });

  const workouts = db.createObjectStore('workouts', { keyPath: 'id' });
  workouts.createIndex('by-date', 'date');

  const prs = db.createObjectStore('personalRecords', { keyPath: 'id' });
  prs.createIndex('by-exercise', 'exerciseId');

  db.createObjectStore('progression', { keyPath: 'exerciseId' });
  db.createObjectStore('achievements', { keyPath: 'id' });

  const calibrations = db.createObjectStore('calibrations', { keyPath: 'id' });
  calibrations.createIndex('by-exercise', 'exerciseId');

  const challenges = db.createObjectStore('challenges', { keyPath: 'id' });
  challenges.createIndex('by-date', 'date');
}

function createV2(db: IDBPDatabase<FormaDB>): void {
  const recordings = db.createObjectStore('recordings', { keyPath: 'id' });
  recordings.createIndex('by-started', 'startedAt');
}

function createV3(db: IDBPDatabase<FormaDB>): void {
  const calendar = db.createObjectStore('calendarEvents', { keyPath: 'id' });
  calendar.createIndex('by-date', 'date');
}

/**
 * Test/reset helper — closes and drops the memoized connection so a fresh open re-runs
 * migrations. Must close the connection, otherwise `deleteDB` blocks on the open handle.
 */
export async function _resetDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}
