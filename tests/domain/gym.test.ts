import { describe, expect, it } from 'vitest';
import { GYM_SPLITS, getGymSplit } from '../../src/domain/gym/splits';

describe('gym splits', () => {
  it('includes the core splits', () => {
    const ids = GYM_SPLITS.map((s) => s.id);
    expect(ids).toContain('ppl');
    expect(ids).toContain('upper-lower');
    expect(ids).toContain('full-body');
  });

  it('has unique split and day ids', () => {
    const splitIds = GYM_SPLITS.map((s) => s.id);
    expect(new Set(splitIds).size).toBe(splitIds.length);
    for (const split of GYM_SPLITS) {
      const dayIds = split.days.map((d) => d.id);
      expect(new Set(dayIds).size, `days unique in ${split.id}`).toBe(dayIds.length);
    }
  });

  it('every exercise has muscles, a set scheme, and variations', () => {
    for (const split of GYM_SPLITS) {
      expect(split.days.length).toBeGreaterThan(0);
      for (const day of split.days) {
        expect(day.exercises.length).toBeGreaterThan(0);
        for (const ex of day.exercises) {
          expect(ex.name).toBeTruthy();
          expect(ex.primaryMuscles.length).toBeGreaterThan(0);
          expect(ex.sets).toBeTruthy();
          expect(ex.reps).toBeTruthy();
          expect(ex.variations.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('looks up a split by id', () => {
    expect(getGymSplit('ppl')?.short).toBe('PPL');
    expect(getGymSplit('nope')).toBeUndefined();
  });
});
