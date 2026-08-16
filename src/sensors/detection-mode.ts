import type { SensorCapabilities, SensorKind } from './types';

export type DetectionMode = 'ADVANCED' | 'STANDARD' | 'BASIC' | 'UNAVAILABLE';

/**
 * Selects the best available detection mode from real capabilities (spec §36). Honest by
 * construction — it only ever reports a mode the present sensors can actually support.
 *
 *  - ADVANCED : accelerometer + gyroscope + proximity all available
 *  - STANDARD : accelerometer + gyroscope available
 *  - BASIC    : a single motion source (accelerometer OR orientation) available
 *  - UNAVAILABLE: no usable motion source
 */
export function computeDetectionMode(capabilities: SensorCapabilities[]): DetectionMode {
  const available = new Set<SensorKind>(
    capabilities.filter((c) => c.available).map((c) => c.kind),
  );

  const accel = available.has('accelerometer');
  const gyro = available.has('gyroscope');
  const proximity = available.has('proximity');
  const orientation = available.has('orientation');

  if (accel && gyro && proximity) return 'ADVANCED';
  if (accel && gyro) return 'STANDARD';
  if (accel || orientation) return 'BASIC';
  return 'UNAVAILABLE';
}
