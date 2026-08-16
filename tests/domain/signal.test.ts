import { describe, expect, it } from 'vitest';
import {
  HighPassFilter,
  LowPassFilter,
  SchmittTrigger,
  magnitude3,
  movingAverage,
} from '../../src/domain/signal/filters';
import { clamp, mean, range, stddev, variance } from '../../src/domain/signal/stats';

describe('filters', () => {
  it('magnitude3', () => {
    expect(magnitude3(3, 4, 0)).toBe(5);
  });

  it('movingAverage smooths and preserves length', () => {
    const out = movingAverage([1, 2, 3, 4], 2);
    expect(out).toHaveLength(4);
    expect(out[3]).toBeCloseTo(3.5);
  });

  it('LowPassFilter with alpha=1 is a passthrough', () => {
    const lp = new LowPassFilter(1);
    expect(lp.next(5)).toBe(5);
    expect(lp.next(10)).toBe(10);
  });

  it('LowPassFilter smooths toward the input', () => {
    const lp = new LowPassFilter(0.5);
    expect(lp.next(0)).toBe(0);
    expect(lp.next(10)).toBe(5);
    expect(lp.next(10)).toBe(7.5);
  });

  it('rejects invalid alpha', () => {
    expect(() => new LowPassFilter(0)).toThrow();
    expect(() => new LowPassFilter(1.5)).toThrow();
  });

  it('HighPassFilter removes a constant bias', () => {
    const hp = new HighPassFilter(0.5);
    hp.next(10);
    hp.next(10);
    // After settling on a constant, high-pass output trends toward 0.
    expect(Math.abs(hp.next(10))).toBeLessThan(5);
  });

  it('SchmittTrigger applies hysteresis', () => {
    const t = new SchmittTrigger(1, 0.3);
    expect(t.update(0.5)).toBe(false); // below high, stays low
    expect(t.update(1)).toBe(true); // hits high
    expect(t.update(0.5)).toBe(true); // between → holds high (no chatter)
    expect(t.update(0.3)).toBe(false); // hits low
  });

  it('SchmittTrigger rejects low > high', () => {
    expect(() => new SchmittTrigger(0, 1)).toThrow();
  });
});

describe('stats', () => {
  it('mean / variance / stddev / range', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(variance([2, 4, 6])).toBeCloseTo(2.6667, 3);
    expect(stddev([2, 4, 6])).toBeCloseTo(1.633, 3);
    expect(range([2, 4, 6, 1])).toBe(5);
  });

  it('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('handles empty arrays', () => {
    expect(mean([])).toBe(0);
    expect(stddev([])).toBe(0);
    expect(range([])).toBe(0);
  });
});
