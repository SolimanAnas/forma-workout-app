import { RepEngine } from '../domain/rep/engine';
import type { RepProfile, RepResult } from '../domain/rep/types';
import { LowPassFilter } from '../domain/signal/filters';
import type { BrightnessSample, BrightnessSource } from '../sensors/camera/camera-source';

/**
 * Counts reps from a camera brightness stream (prototype). A slow baseline tracks ambient light;
 * the signal is how much darker the current (smoothed) frame is than that baseline — i.e. how close
 * your body is to the lens. That oscillating scalar drives the same RepEngine the motion sensors use.
 */

export interface CameraDetectorOptions {
  /** Ambient-tracking EMA (very slow). */
  baselineAlpha?: number;
  /** Frame smoothing EMA. */
  smoothAlpha?: number;
  rep?: Partial<RepProfile>;
  expectedAmplitude?: number;
}

const DEFAULT_REP: RepProfile = {
  enterThreshold: 10,
  exitThreshold: 3,
  minAmplitude: 6,
  minDurationMs: 400,
  maxDurationMs: 6000,
  cooldownMs: 500,
};

export class CameraRepDetector {
  private readonly engine: RepEngine;
  private readonly baseline: LowPassFilter;
  private readonly smooth: LowPassFilter;
  private lastSignal = 0;

  constructor(opts: CameraDetectorOptions = {}) {
    this.baseline = new LowPassFilter(opts.baselineAlpha ?? 0.01);
    this.smooth = new LowPassFilter(opts.smoothAlpha ?? 0.3);
    this.engine = new RepEngine(
      { ...DEFAULT_REP, ...opts.rep },
      { expectedAmplitude: opts.expectedAmplitude ?? 20 },
    );
  }

  /** Feed one brightness reading; returns a RepResult when a rep completes. Testable without a camera. */
  process(t: number, brightness: number): RepResult | null {
    const base = this.baseline.next(brightness);
    const smoothed = this.smooth.next(brightness);
    // Darker than ambient → body is close → positive signal (peaks at the bottom of the rep).
    this.lastSignal = base - smoothed;
    return this.engine.push(t, this.lastSignal);
  }

  get count(): number {
    return this.engine.count;
  }

  /** Current oriented signal (for live visualization). */
  get signal(): number {
    return this.lastSignal;
  }

  reset(): void {
    this.engine.reset();
    this.baseline.reset();
    this.smooth.reset();
    this.lastSignal = 0;
  }
}

/** Binds a live brightness source to a CameraRepDetector, calling back on each valid rep. */
export function attachCameraDetector(
  source: BrightnessSource,
  detector: CameraRepDetector,
  onRep: (count: number) => void,
  onSignal?: (sample: BrightnessSample, signal: number) => void,
): () => void {
  return source.subscribe((sample) => {
    const result = detector.process(sample.t, sample.value);
    onSignal?.(sample, detector.signal);
    if (result?.valid) onRep(detector.count);
  });
}
