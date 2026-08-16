import { describe, expect, it } from 'vitest';
import { RepEngine } from '../../src/domain/rep/engine';
import type { RepProfile, RepResult } from '../../src/domain/rep/types';

const PROFILE: RepProfile = {
  enterThreshold: 1,
  exitThreshold: 0.3,
  minAmplitude: 2,
  minDurationMs: 100,
  maxDurationMs: 1000,
  cooldownMs: 300,
};

function engine(): RepEngine {
  return new RepEngine(PROFILE, { expectedAmplitude: 3, targetDurationMs: 200 });
}

/** Feed [t, signal] pairs; return the results that were emitted. */
function feed(e: RepEngine, samples: [number, number][]): RepResult[] {
  const out: RepResult[] = [];
  for (const [t, s] of samples) {
    const r = e.push(t, s);
    if (r) out.push(r);
  }
  return out;
}

describe('RepEngine', () => {
  it('counts a clean valid rep', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 2],
      [100, 3],
      [150, 0],
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].valid).toBe(true);
    expect(out[0].amplitude).toBe(3);
    expect(e.count).toBe(1);
  });

  it('ignores tiny movements below the enter threshold', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 0.5],
      [100, 0],
    ]);
    expect(out).toHaveLength(0);
    expect(e.count).toBe(0);
  });

  it('rejects a partial rep whose amplitude is too small', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 1.5],
      [150, 0],
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].valid).toBe(false);
    expect(out[0].reason).toBe('too-small');
    expect(e.count).toBe(0);
  });

  it('rejects a too-fast rep', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 3],
      [80, 0],
    ]);
    expect(out[0].reason).toBe('too-fast');
  });

  it('rejects a too-slow rep that eventually returns', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 3],
      [1200, 0],
    ]);
    expect(out[0].reason).toBe('too-slow');
  });

  it('rejects an interrupted movement that never returns', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 3],
      [1100, 3],
    ]);
    expect(out[0].reason).toBe('interrupted');
  });

  it('prevents double counting within the cooldown', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 3],
      [150, 0], // valid rep 1, ends at 150
      [200, 3],
      [300, 0], // 300 - 150 = 150 < cooldown 300 → rejected
    ]);
    expect(out.filter((r) => r.valid)).toHaveLength(1);
    expect(out[1].reason).toBe('cooldown');
    expect(e.count).toBe(1);
  });

  it('counts once despite noise (hysteresis prevents chatter)', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [50, 1.2],
      [100, 0.9], // dips but stays above exit → still one movement
      [150, 3],
      [200, 2.5],
      [250, 0],
    ]);
    expect(out.filter((r) => r.valid)).toHaveLength(1);
  });

  it('produces a quality score in [0, 100]', () => {
    const e = engine();
    const out = feed(e, [
      [0, 0],
      [200, 3],
      [400, 0],
    ]);
    expect(out[0].quality).toBeGreaterThanOrEqual(0);
    expect(out[0].quality).toBeLessThanOrEqual(100);
  });

  it('constructor rejects exit >= enter', () => {
    expect(
      () => new RepEngine({ ...PROFILE, exitThreshold: 1 }, { expectedAmplitude: 3 }),
    ).toThrow();
  });
});
