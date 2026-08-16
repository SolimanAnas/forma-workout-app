import { getDB } from './db';
import type { CalibrationResult } from '../domain/calibration/calibrator';

/** Persist per-exercise/device calibration baselines (spec §14). Local-only. */

function keyOf(exerciseId: string, deviceKey = 'default'): string {
  return `${exerciseId}:${deviceKey}`;
}

export async function saveCalibration(
  exerciseId: string,
  result: CalibrationResult,
  deviceKey = 'default',
): Promise<void> {
  const db = await getDB();
  await db.put('calibrations', {
    id: keyOf(exerciseId, deviceKey),
    exerciseId,
    baseline: result,
    createdAt: Date.now(),
  });
}

export async function getCalibration(
  exerciseId: string,
  deviceKey = 'default',
): Promise<CalibrationResult | undefined> {
  const db = await getDB();
  const rec = await db.get('calibrations', keyOf(exerciseId, deviceKey));
  return rec?.baseline as CalibrationResult | undefined;
}
