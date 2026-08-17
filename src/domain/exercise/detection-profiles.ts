import type { RepProfile } from '../rep/types';
import type { ExerciseType, SensorId } from './types';

/**
 * How an exercise's raw sensor signal is turned into a rep-countable scalar (spec §36). PURE
 * domain data — the services layer maps live/recorded samples through this. Thresholds are seeded
 * from `expectedAmplitude`; calibration refines `baseline` at runtime.
 */
export interface DetectionProfile {
  id: string;
  type: ExerciseType;
  /** Sensor kind that drives detection. */
  sensor: SensorId;
  axis: 'x' | 'y' | 'z';
  /** Rest value on that axis in m/s² (e.g. ~9.81 for a vertical axis). Calibration overrides this. */
  baseline: number;
  /** Orient the signal so a movement peak is positive. */
  direction: 1 | -1;
  /** Expected peak deviation for a full rep (m/s²). */
  expectedAmplitude: number;
  targetDurationMs: number;
  rep: RepProfile;
}

function repThresholds(amp: number): RepProfile {
  return {
    enterThreshold: amp * 0.5,
    exitThreshold: amp * 0.15,
    minAmplitude: amp * 0.4,
    minDurationMs: 120,
    maxDurationMs: 5000,
    cooldownMs: 200,
  };
}

/**
 * MVP detection profiles. These are honest starting points tuned against synthetic fixtures;
 * real-device recordings (Phase 7) will refine thresholds. Plank is duration-based (no rep profile
 * counting) and handled separately by the plank analyzer.
 */
export const DETECTION_PROFILES: Record<string, DetectionProfile> = {
  pushup: {
    id: 'pushup',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 6,
    targetDurationMs: 2000,
    rep: repThresholds(6),
  },
  squat: {
    id: 'squat',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 5,
    targetDurationMs: 2500,
    rep: repThresholds(5),
  },
  situp: {
    id: 'situp',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'x',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 4,
    targetDurationMs: 1800,
    rep: repThresholds(4),
  },
  'jumping-jack': {
    id: 'jumping-jack',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'y',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 9,
    targetDurationMs: 800,
    rep: repThresholds(9),
  },
  plank: {
    id: 'plank',
    type: 'duration',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 1,
    targetDurationMs: 0,
    rep: repThresholds(1),
  },

  // ── Added exercises. Thresholds below are UNTUNED starting points — real-device recordings
  // (Phase 2) will refine them. Tap-to-count works meanwhile, so these are never a dead end. ──
  crunch: {
    id: 'crunch',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'x',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 3.5,
    targetDurationMs: 1500,
    rep: repThresholds(3.5),
  },
  'leg-raises': {
    id: 'leg-raises',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 3,
    targetDurationMs: 2200,
    rep: repThresholds(3),
  },
  'russian-twist': {
    id: 'russian-twist',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'y',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 3.5,
    targetDurationMs: 1200,
    rep: repThresholds(3.5),
  },
  'leg-flutters': {
    id: 'leg-flutters',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 2.5,
    targetDurationMs: 500,
    rep: repThresholds(2.5),
  },
  'high-knees': {
    id: 'high-knees',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'y',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 6,
    targetDurationMs: 500,
    rep: repThresholds(6),
  },
  'mountain-climbers': {
    id: 'mountain-climbers',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'y',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 5,
    targetDurationMs: 600,
    rep: repThresholds(5),
  },
  burpee: {
    id: 'burpee',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 8,
    targetDurationMs: 2800,
    rep: repThresholds(8),
  },
  'pull-up': {
    id: 'pull-up',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 4,
    targetDurationMs: 2500,
    rep: repThresholds(4),
  },
  'jump-squat': {
    id: 'jump-squat',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 9,
    targetDurationMs: 1400,
    rep: repThresholds(9),
  },
  'calf-raises': {
    id: 'calf-raises',
    type: 'repetition',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 2,
    targetDurationMs: 1200,
    rep: repThresholds(2),
  },
  'side-plank': {
    id: 'side-plank',
    type: 'duration',
    sensor: 'accelerometer',
    axis: 'y',
    baseline: 0,
    direction: 1,
    expectedAmplitude: 1,
    targetDurationMs: 0,
    rep: repThresholds(1),
  },
  'standing-knee-raises': {
    id: 'standing-knee-raises',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 4,
    targetDurationMs: 700,
    rep: repThresholds(4),
  },
  'jump-rope': {
    id: 'jump-rope',
    type: 'cyclic',
    sensor: 'accelerometer',
    axis: 'z',
    baseline: 9.81,
    direction: 1,
    expectedAmplitude: 5,
    targetDurationMs: 450,
    rep: repThresholds(5),
  },
};

export function getDetectionProfile(exerciseId: string): DetectionProfile | undefined {
  return DETECTION_PROFILES[exerciseId];
}
