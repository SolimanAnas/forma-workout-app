import type { DBSchema } from 'idb';
import type { SensorRecording } from '../sensors/replay/recording';

export const DB_NAME = 'forma';
export const DB_VERSION = 3;

/** Key/value app settings (theme, voice coach, units, dev mode, ...). */
export interface SettingRecord {
  key: string;
  value: unknown;
}

/** Local user profile (single record, id = 'me'). */
export interface ProfileRecord {
  id: 'me';
  createdAt: number;
  displayName?: string;
  /** Total lifetime XP; level is derived from this (spec §27). */
  xp: number;
}

/**
 * A completed workout. Reps and sets are embedded (not separate stores) to avoid
 * over-normalizing IndexedDB (spec §17). Detailed typing arrives with the workout engine.
 */
export interface WorkoutRecord {
  id: string;
  date: number;
  mode: string;
  exercises: unknown[];
  totalReps: number;
  durationSec: number;
  xpEarned: number;
}

export interface PersonalRecordRecord {
  id: string; // `${exerciseId}:${metric}`
  exerciseId: string;
  metric: string;
  value: number;
  achievedAt: number;
}

export interface ProgressionRecord {
  exerciseId: string;
  level: number;
  maxReps: number;
  target: { sets: number; reps: number };
  updatedAt: number;
}

export interface AchievementRecord {
  id: string;
  unlockedAt: number;
}

export interface CalibrationRecord {
  id: string; // `${exerciseId}:${deviceKey}`
  exerciseId: string;
  baseline: unknown;
  createdAt: number;
}

export interface ChallengeRecord {
  id: string; // e.g. `2026-08-16:pushup-100`
  date: string;
  exerciseId: string;
  target: number;
  bestResult?: number;
}

/** A scheduled workout on the calendar (spec: calendar feature). */
export interface CalendarEventRecord {
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  /** Optional HH:MM (24h); empty = all-day. */
  time?: string;
  title: string;
  /** 'gym' | 'bodyweight' | 'rest' | 'custom'. */
  kind: string;
  notes?: string;
  createdAt: number;
}

export interface FormaDB extends DBSchema {
  settings: { key: string; value: SettingRecord };
  profile: { key: string; value: ProfileRecord };
  workouts: { key: string; value: WorkoutRecord; indexes: { 'by-date': number } };
  personalRecords: {
    key: string;
    value: PersonalRecordRecord;
    indexes: { 'by-exercise': string };
  };
  progression: { key: string; value: ProgressionRecord };
  achievements: { key: string; value: AchievementRecord };
  calibrations: { key: string; value: CalibrationRecord; indexes: { 'by-exercise': string } };
  challenges: { key: string; value: ChallengeRecord; indexes: { 'by-date': string } };
  // Added in DB v2 — developer sensor recordings for replay (spec §39).
  recordings: { key: string; value: SensorRecording; indexes: { 'by-started': number } };
  // Added in DB v3 — scheduled workouts on the calendar.
  calendarEvents: { key: string; value: CalendarEventRecord; indexes: { 'by-date': string } };
}

export type StoreName = keyof FormaDB;
