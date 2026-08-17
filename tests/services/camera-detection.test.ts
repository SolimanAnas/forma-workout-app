import { describe, expect, it } from 'vitest';
import {
  CameraRepDetector,
  attachCameraDetector,
} from '../../src/services/camera-detection';
import type {
  BrightnessListener,
  BrightnessSample,
  BrightnessSource,
} from '../../src/sensors/camera/camera-source';

/** Build a brightness stream: `reps` dips (dark = body close) at ~20 fps. */
function brightnessStream(reps: number, opts: { ambient?: number; dip?: number; periodMs?: number } = {}) {
  const ambient = opts.ambient ?? 150;
  const dip = opts.dip ?? 30;
  const periodMs = opts.periodMs ?? 2000;
  const dt = 50;
  const samples: BrightnessSample[] = [];
  const total = reps * periodMs;
  for (let t = 0; t <= total; t += dt) {
    const phase = Math.sin((2 * Math.PI * t) / periodMs);
    const value = ambient - dip * Math.max(0, phase) + ((t / dt) % 3) * 0.2; // tiny noise
    samples.push({ t, value });
  }
  return samples;
}

class FakeBrightnessSource implements BrightnessSource {
  running = false;
  private readonly listeners = new Set<BrightnessListener>();
  start(): Promise<void> {
    this.running = true;
    return Promise.resolve();
  }
  stop(): void {
    this.running = false;
  }
  subscribe(fn: BrightnessListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(sample: BrightnessSample): void {
    for (const fn of this.listeners) fn(sample);
  }
}

describe('CameraRepDetector', () => {
  it('counts one rep per brightness dip', () => {
    const detector = new CameraRepDetector();
    for (const s of brightnessStream(10)) detector.process(s.t, s.value);
    // Allow ±1 for edge cycles under smoothing.
    expect(detector.count).toBeGreaterThanOrEqual(9);
    expect(detector.count).toBeLessThanOrEqual(10);
  });

  it('counts nothing when the frame is steady (no movement)', () => {
    const detector = new CameraRepDetector();
    for (let t = 0; t <= 10000; t += 50) detector.process(t, 150 + ((t / 50) % 2) * 0.3);
    expect(detector.count).toBe(0);
  });

  it('resets', () => {
    const detector = new CameraRepDetector();
    for (const s of brightnessStream(3)) detector.process(s.t, s.value);
    expect(detector.count).toBeGreaterThan(0);
    detector.reset();
    expect(detector.count).toBe(0);
  });
});

describe('attachCameraDetector', () => {
  it('reports rep counts from a live source', async () => {
    const source = new FakeBrightnessSource();
    const detector = new CameraRepDetector();
    let latest = 0;
    const unsub = attachCameraDetector(source, detector, (count) => (latest = count));

    await source.start();
    for (const s of brightnessStream(5)) source.emit(s);
    unsub();

    expect(latest).toBeGreaterThanOrEqual(4);
  });
});
