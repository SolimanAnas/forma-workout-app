import type { SensorSample } from '../types';

export const RECORDING_FORMAT_VERSION = 1;

/**
 * A captured sensor session (spec §39). Fixtures of this shape drive the detection engine in
 * tests so algorithms can be improved without physically re-performing exercises.
 */
export interface SensorRecording {
  id: string;
  formatVersion: number;
  exerciseId: string | null;
  /** Epoch milliseconds when recording began. */
  startedAt: number;
  durationMs: number;
  sampleCount: number;
  samples: SensorSample[];
}

export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID?.() ?? `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
