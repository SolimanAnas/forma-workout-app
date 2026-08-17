import { describe, expect, it } from 'vitest';
import { EXERCISE_DEFINITIONS, getExerciseById } from '../../src/domain/exercise/definitions';
import { getDetectionProfile } from '../../src/domain/exercise/detection-profiles';
import { getPlacement } from '../../src/domain/exercise/placement';

describe('exercise definitions', () => {
  it('defines the full exercise library', () => {
    expect(EXERCISE_DEFINITIONS).toHaveLength(12);
    // Original 5 MVP + 7 added exercises.
    expect(EXERCISE_DEFINITIONS.map((e) => e.id).sort()).toEqual(
      [
        'burpee',
        'crunch',
        'high-knees',
        'jumping-jack',
        'leg-raises',
        'mountain-climbers',
        'plank',
        'pull-up',
        'pushup',
        'russian-twist',
        'situp',
        'squat',
      ].sort(),
    );
  });

  it('has unique ids', () => {
    const ids = EXERCISE_DEFINITIONS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every exercise resolves a detection profile and placement', () => {
    for (const ex of EXERCISE_DEFINITIONS) {
      expect(getDetectionProfile(ex.id), `detection profile for ${ex.id}`).toBeDefined();
      expect(getPlacement(ex.placement), `placement for ${ex.id}`).toBeDefined();
    }
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
