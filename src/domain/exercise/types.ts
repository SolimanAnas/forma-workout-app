/**
 * Exercise definition model (spec §12). PURE domain — no browser/DOM/sensor imports.
 * Adding a new exercise must not require touching the core engine (spec §29).
 */

export type ExerciseType = 'repetition' | 'duration' | 'cyclic';

export type ExerciseCategory = 'strength' | 'core' | 'cardio';

export type SensorId =
  | 'accelerometer'
  | 'gyroscope'
  | 'orientation'
  | 'proximity'
  | 'barometer'
  | 'gps';

export interface MuscleGroups {
  primary: string[];
  secondary: string[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  muscleGroups: MuscleGroups;
  /** Sensors without which the exercise cannot run at all. */
  requiredSensors: SensorId[];
  /** Sensors that improve detection when present. */
  preferredSensors: SensorId[];
  /** Sensors used to degrade gracefully when preferred ones are unavailable. */
  fallbackSensors: SensorId[];
  difficulty: number;
  /** Key into the (future) detection-profile registry. */
  detectionProfile: string;
  /** Key into the (future) progression-profile registry. */
  progressionProfile: string;
  /** Key into the (future) phone-placement config. */
  placement: string;
}
