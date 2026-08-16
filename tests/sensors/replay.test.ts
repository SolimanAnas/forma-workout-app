import { describe, expect, it } from 'vitest';
import { SensorManager } from '../../src/sensors/SensorManager';
import { SensorRecorder } from '../../src/sensors/replay/recorder';
import { ReplayPlayer } from '../../src/sensors/replay/player';
import type { SensorRecording } from '../../src/sensors/replay/recording';
import type {
  PermissionState,
  SensorAdapter,
  SensorCapabilities,
  SensorKind,
  SensorListener,
  SensorSample,
} from '../../src/sensors/types';

/** A controllable fake adapter that emits samples on demand. */
class FakeAdapter implements SensorAdapter {
  readonly kind: SensorKind = 'accelerometer';
  private readonly listeners = new Set<SensorListener>();

  isAvailable(): boolean {
    return true;
  }
  getPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }
  requestPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }
  getCapabilities(): SensorCapabilities {
    return { kind: this.kind, available: true, status: 'detected', source: 'device-motion' };
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  stop(): void {}
  subscribe(fn: SensorListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  push(sample: SensorSample): void {
    for (const fn of this.listeners) fn(sample);
  }
}

function sample(t: number, x: number): SensorSample {
  return { kind: 'accelerometer', t, x, y: 0, z: 0, source: 'device-motion' };
}

describe('SensorRecorder', () => {
  it('captures subscribed samples into a recording', async () => {
    const fake = new FakeAdapter();
    const manager = new SensorManager([fake]);
    const recorder = new SensorRecorder(manager, ['accelerometer'], 'pushup');

    await recorder.start();
    fake.push(sample(0, 1));
    fake.push(sample(16, 2));
    fake.push(sample(32, 3));
    const recording = recorder.stop();

    expect(recording.exerciseId).toBe('pushup');
    expect(recording.sampleCount).toBe(3);
    expect(recording.samples.map((s) => s.x)).toEqual([1, 2, 3]);
    expect(recording.formatVersion).toBe(1);
  });
});

describe('ReplayPlayer', () => {
  const recording: SensorRecording = {
    id: 'r1',
    formatVersion: 1,
    exerciseId: 'pushup',
    startedAt: 0,
    durationMs: 32,
    sampleCount: 3,
    samples: [sample(0, 1), sample(16, 2), sample(32, 3)],
  };

  it('replays the exact sample stream synchronously', () => {
    const got: SensorSample[] = [];
    let done = false;
    new ReplayPlayer(recording).play({ onSample: (s) => got.push(s), onDone: () => (done = true) });

    expect(got).toEqual(recording.samples);
    expect(done).toBe(true);
  });

  it('is deterministic across repeated replays', () => {
    const collect = (): SensorSample[] => {
      const out: SensorSample[] = [];
      new ReplayPlayer(recording).play({ onSample: (s) => out.push(s) });
      return out;
    };
    expect(collect()).toEqual(collect());
  });

  it('record → replay round-trips identically', async () => {
    const fake = new FakeAdapter();
    const manager = new SensorManager([fake]);
    const recorder = new SensorRecorder(manager, ['accelerometer']);
    await recorder.start();
    const inputs = [sample(0, 5), sample(16, 6)];
    inputs.forEach((s) => fake.push(s));
    const rec = recorder.stop();

    const replayed: SensorSample[] = [];
    new ReplayPlayer(rec).play({ onSample: (s) => replayed.push(s) });
    expect(replayed).toEqual(inputs);
  });
});
