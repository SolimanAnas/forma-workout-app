import { describe, expect, it } from 'vitest';
import { Calibrator } from '../../src/domain/calibration/calibrator';
import { getPlacement } from '../../src/domain/exercise/placement';
import { EXERCISE_DEFINITIONS } from '../../src/domain/exercise/definitions';

describe('Calibrator', () => {
  it('computes baseline and rest noise', () => {
    const c = new Calibrator();
    for (const v of [9.8, 9.82, 9.79, 9.81]) c.add(v);
    const r = c.result();
    expect(r.baseline).toBeCloseTo(9.805, 2);
    expect(r.restStd).toBeGreaterThan(0);
    expect(r.sampleCount).toBe(4);
  });

  it('resets', () => {
    const c = new Calibrator();
    c.add(1);
    c.reset();
    expect(c.count).toBe(0);
  });
});

describe('placement guidance', () => {
  it('every MVP exercise has a valid placement config', () => {
    for (const ex of EXERCISE_DEFINITIONS) {
      const placement = getPlacement(ex.placement);
      expect(placement, `missing placement for ${ex.id}`).toBeDefined();
      expect(placement?.steps.length).toBeGreaterThan(0);
    }
  });
});
