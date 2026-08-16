import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccelerometerAdapter } from '../../src/sensors/adapters/browser/accelerometer';
import { BarometerAdapter } from '../../src/sensors/adapters/browser/barometer';
import { ProximityAdapter } from '../../src/sensors/adapters/browser/proximity';
import type { SensorSample } from '../../src/sensors/types';

const g = globalThis as Record<string, unknown>;

function setGlobal(name: string, value: unknown): void {
  g[name] = value;
}
function unsetGlobal(name: string): void {
  delete g[name];
}

afterEach(() => {
  for (const name of ['DeviceMotionEvent', 'DeviceOrientationEvent', 'Accelerometer', 'Barometer']) {
    unsetGlobal(name);
  }
});

describe('AccelerometerAdapter — availability', () => {
  it('is unsupported when no motion API exists', async () => {
    unsetGlobal('Accelerometer');
    unsetGlobal('DeviceMotionEvent');
    const adapter = new AccelerometerAdapter();
    expect(adapter.isAvailable()).toBe(false);
    expect(adapter.getCapabilities().status).toBe('unsupported');
    await expect(adapter.start()).rejects.toThrow(/not available/);
  });

  it('detects DeviceMotion fallback', () => {
    setGlobal('DeviceMotionEvent', class {});
    const adapter = new AccelerometerAdapter();
    const caps = adapter.getCapabilities();
    expect(adapter.isAvailable()).toBe(true);
    expect(caps.status).toBe('detected');
    expect(caps.source).toBe('device-motion');
  });

  it('prefers the Generic Sensor API when present', () => {
    setGlobal('Accelerometer', class {});
    const adapter = new AccelerometerAdapter();
    expect(adapter.getCapabilities().source).toBe('generic-sensor');
  });
});

describe('AccelerometerAdapter — start/stop/emit via DeviceMotion', () => {
  it('emits normalized samples and stops cleanly', async () => {
    setGlobal('DeviceMotionEvent', class {});
    const adapter = new AccelerometerAdapter();
    const samples: SensorSample[] = [];
    adapter.subscribe((s) => samples.push(s));

    await adapter.start();
    dispatchMotion({ x: 1, y: 2, z: 3 });
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ kind: 'accelerometer', x: 1, y: 2, z: 3, source: 'device-motion' });

    adapter.stop();
    dispatchMotion({ x: 9, y: 9, z: 9 });
    expect(samples).toHaveLength(1); // no more after stop
  });

  it('is idempotent on double start/stop', async () => {
    setGlobal('DeviceMotionEvent', class {});
    const adapter = new AccelerometerAdapter();
    const spy = vi.fn();
    adapter.subscribe(spy);
    await adapter.start();
    await adapter.start(); // second start should not add a second listener
    dispatchMotion({ x: 1, y: 1, z: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    adapter.stop();
    adapter.stop(); // no throw
  });
});

describe('AccelerometerAdapter — permission', () => {
  it('reports granted when no explicit request is required', async () => {
    setGlobal('DeviceMotionEvent', class {});
    const adapter = new AccelerometerAdapter();
    expect(await adapter.getPermission()).toBe('granted');
  });

  it('reports prompt then grants via requestPermission (iOS-style)', async () => {
    setGlobal(
      'DeviceMotionEvent',
      class {
        static requestPermission(): Promise<'granted'> {
          return Promise.resolve('granted');
        }
      },
    );
    const adapter = new AccelerometerAdapter();
    expect(await adapter.getPermission()).toBe('prompt');
    expect(await adapter.requestPermission()).toBe('granted');
  });

  it('maps a rejected request to denied', async () => {
    setGlobal(
      'DeviceMotionEvent',
      class {
        static requestPermission(): Promise<'granted'> {
          return Promise.reject(new Error('no gesture'));
        }
      },
    );
    const adapter = new AccelerometerAdapter();
    expect(await adapter.requestPermission()).toBe('denied');
  });
});

describe('optional sensors are honestly unsupported by default', () => {
  it('proximity and barometer report unsupported under jsdom', () => {
    unsetGlobal('Barometer');
    expect(new ProximityAdapter().getCapabilities().status).toBe('unsupported');
    expect(new BarometerAdapter().getCapabilities().status).toBe('unsupported');
  });
});

function dispatchMotion(accelerationIncludingGravity: { x: number; y: number; z: number }): void {
  const evt = new Event('devicemotion');
  Object.assign(evt, { accelerationIncludingGravity });
  window.dispatchEvent(evt);
}
