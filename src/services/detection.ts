import type { SensorSample } from '../sensors/types';
import type { DetectionProfile } from '../domain/exercise/detection-profiles';
import { RepEngine } from '../domain/rep/engine';
import type { RepResult } from '../domain/rep/types';
import { LowPassFilter, magnitude3 } from '../domain/signal/filters';
import { clamp, stddev } from '../domain/signal/stats';
import { Calibrator, type CalibrationResult } from '../domain/calibration/calibrator';

/**
 * Bridges the sensor abstraction to the pure rep engine (spec §45). Extracts an oriented,
 * low-passed scalar from each sample and drives the RepEngine — keeping the domain free of any
 * sensor-type coupling.
 */
export class RepDetector {
  private readonly engine: RepEngine;
  private readonly lp: LowPassFilter;

  constructor(
    private readonly profile: DetectionProfile,
    private baseline = profile.baseline,
    alpha = 0.5,
  ) {
    this.engine = new RepEngine(profile.rep, {
      expectedAmplitude: profile.expectedAmplitude,
      targetDurationMs: profile.targetDurationMs || undefined,
    });
    this.lp = new LowPassFilter(alpha);
  }

  setBaseline(baseline: number): void {
    this.baseline = baseline;
  }

  push(sample: SensorSample): RepResult | null {
    if (sample.kind !== this.profile.sensor) return null;
    const axisValue = sample[this.profile.axis] ?? 0;
    const signal = this.lp.next(this.profile.direction * (axisValue - this.baseline));
    return this.engine.push(sample.t, signal);
  }

  get count(): number {
    return this.engine.count;
  }

  get attempts(): number {
    return this.engine.attempts;
  }

  reset(): void {
    this.engine.reset();
    this.lp.reset();
  }
}

export interface RepAnalysis {
  validCount: number;
  attempts: number;
  reps: RepResult[];
}

/** Batch analysis of a recorded/replayed sample stream (used by tests and replay debugging). */
export function analyzeReps(
  profile: DetectionProfile,
  samples: SensorSample[],
  baseline?: number,
): RepAnalysis {
  const detector = new RepDetector(profile, baseline ?? profile.baseline);
  const reps: RepResult[] = [];
  for (const sample of samples) {
    const result = detector.push(sample);
    if (result) reps.push(result);
  }
  return { validCount: detector.count, attempts: detector.attempts, reps };
}

export interface PlankAnalysis {
  durationMs: number;
  /** 0–100 estimated stability (higher = steadier). Estimated, not a form judgment (spec §8). */
  stability: number;
  excessiveMovement: boolean;
}

/** Plank is duration-based: measure hold time + steadiness, never claim body-form analysis. */
export function analyzePlank(samples: SensorSample[], sensor = 'accelerometer'): PlankAnalysis {
  const relevant = samples.filter((s) => s.kind === sensor);
  if (relevant.length < 2) {
    return { durationMs: 0, stability: 0, excessiveMovement: false };
  }
  const durationMs = relevant[relevant.length - 1].t - relevant[0].t;
  const magnitudes = relevant.map((s) => magnitude3(s.x ?? 0, s.y ?? 0, s.z ?? 0));
  const wobble = stddev(magnitudes); // m/s² of jitter around the hold
  // 0 m/s² jitter → 100; ~2 m/s² jitter → 0.
  const stability = Math.round(clamp(100 - (wobble / 2) * 100, 0, 100));
  return { durationMs, stability, excessiveMovement: wobble > 1.0 };
}

/** Derive a baseline for an exercise's tracked axis from a calibration window. */
export function calibrateAxis(
  profile: DetectionProfile,
  samples: SensorSample[],
): CalibrationResult {
  const calibrator = new Calibrator();
  for (const sample of samples) {
    if (sample.kind === profile.sensor) calibrator.add(sample[profile.axis] ?? 0);
  }
  return calibrator.result();
}
