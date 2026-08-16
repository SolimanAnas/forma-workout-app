import { describe, expect, it } from 'vitest';
import { computeDetectionMode } from '../../src/sensors/detection-mode';
import type { SensorCapabilities, SensorKind } from '../../src/sensors/types';

function caps(available: SensorKind[]): SensorCapabilities[] {
  const all: SensorKind[] = [
    'accelerometer',
    'gyroscope',
    'orientation',
    'proximity',
    'barometer',
    'gps',
  ];
  return all.map((kind) => ({
    kind,
    available: available.includes(kind),
    status: available.includes(kind) ? 'detected' : 'unsupported',
    source: available.includes(kind) ? 'device-motion' : null,
  }));
}

describe('computeDetectionMode', () => {
  it('ADVANCED requires accel + gyro + proximity', () => {
    expect(computeDetectionMode(caps(['accelerometer', 'gyroscope', 'proximity']))).toBe('ADVANCED');
  });

  it('STANDARD when accel + gyro but no proximity', () => {
    expect(computeDetectionMode(caps(['accelerometer', 'gyroscope']))).toBe('STANDARD');
  });

  it('BASIC with a single motion source', () => {
    expect(computeDetectionMode(caps(['accelerometer']))).toBe('BASIC');
    expect(computeDetectionMode(caps(['orientation']))).toBe('BASIC');
  });

  it('UNAVAILABLE with no usable motion source', () => {
    expect(computeDetectionMode(caps(['gps', 'barometer']))).toBe('UNAVAILABLE');
    expect(computeDetectionMode(caps([]))).toBe('UNAVAILABLE');
  });
});
