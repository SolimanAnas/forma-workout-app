import { describe, expect, it } from 'vitest';
import { EXERCISE_DEFINITIONS, getExerciseById } from '../../src/domain/exercise/definitions';

describe('MVP exercise definitions', () => {
  it('defines the five MVP exercises', () => {
    expect(EXERCISE_DEFINITIONS).toHaveLength(5);
    expect(EXERCISE_DEFINITIONS.map((e) => e.id).sort()).toEqual([
      'jumping-jack',
      'plank',
      'pushup',
      'situp',
      'squat',
    ]);
  });

  it('has unique ids', () => {
    const ids = EXERCISE_DEFINITIONS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every exercise has required metadata', () => {
    for (const ex of EXERCISE_DEFINITIONS) {
      expect(ex.name).toBeTruthy();
      expect(ex.muscleGroups.primary.length).toBeGreaterThan(0);
      expect(ex.requiredSensors.length).toBeGreaterThan(0);
      expect(ex.difficulty).toBeGreaterThanOrEqual(1);
    }
  });

  it('looks up by id', () => {
    expect(getExerciseById('pushup')?.name).toBe('Push-up');
    expect(getExerciseById('nope')).toBeUndefined();
  });
});
