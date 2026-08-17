import { describe, expect, it } from 'vitest';
import { GYM_SPLITS, getGymSplit } from '../../src/domain/gym/splits';

describe('gym splits', () => {
  it('includes the core splits', () => {
    const ids = GYM_SPLITS.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['ppl', 'upper-lower', 'full-body']));
  });

  it('has unique split and slot ids', () => {
    const splitIds = GYM_SPLITS.map((s) => s.id);
    expect(new Set(splitIds).size).toBe(splitIds.length);
    for (const split of GYM_SPLITS) {
      const slotIds = split.days.flatMap((d) => d.slots.map((s) => s.id));
      expect(new Set(slotIds).size, `slot ids unique in ${split.id}`).toBe(slotIds.length);
    }
  });

  it('every slot has a category, target, set scheme, and options with regions', () => {
    for (const split of GYM_SPLITS) {
      for (const day of split.days) {
        expect(day.slots.length).toBeGreaterThan(0);
        for (const s of day.slots) {
          expect(s.category).toBeTruthy();
          expect(s.target).toBeTruthy();
          expect(s.sets).toBeTruthy();
          expect(s.reps).toBeTruthy();
          expect(s.options.length).toBeGreaterThan(0);
          for (const o of s.options) {
            expect(o.name).toBeTruthy();
            expect(o.region).toBeTruthy();
          }
        }
      }
    }
  });

  it('Push day groups slots by Chest / Shoulders / Triceps', () => {
    const push = getGymSplit('ppl')?.days.find((d) => d.id === 'push');
    const categories = [...new Set(push?.slots.map((s) => s.category))];
    expect(categories).toEqual(['Chest', 'Shoulders', 'Triceps']);
  });

  it('looks up a split by id', () => {
    expect(getGymSplit('ppl')?.short).toBe('PPL');
    expect(getGymSplit('nope')).toBeUndefined();
  });
});
