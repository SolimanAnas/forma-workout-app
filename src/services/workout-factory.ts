import type { WorkoutEngine, WorkoutMode } from '../domain/workout/types';
import type { PermissionState } from '../sensors/types';
import { FreeRepsEngine } from '../domain/workout/free-reps';
import { SetsEngine } from '../domain/workout/sets';
import { AmrapEngine } from '../domain/workout/amrap';
import { EmomEngine } from '../domain/workout/emom';
import { CircuitEngine, type CircuitStation } from '../domain/workout/circuit';

/** Parameters for launching a workout, produced by the setup screen. */
export interface WorkoutLaunch {
  mode: WorkoutMode;
  exerciseId: string;
  /** Motion permission outcome captured from the Start user-gesture (iOS requires the gesture). */
  motionPermission?: PermissionState;
  free?: { targetReps?: number };
  sets?: { sets: number; reps: number; restMs: number };
  amrap?: { durationMs: number; repsPerRound?: number };
  emom?: { minutes: number; repsPerMinute: number };
  circuit?: { stations: CircuitStation[]; rounds?: number };
}

export function createEngine(launch: WorkoutLaunch): WorkoutEngine {
  switch (launch.mode) {
    case 'free':
      return new FreeRepsEngine({ exerciseId: launch.exerciseId, ...launch.free });
    case 'sets':
      return new SetsEngine({ exerciseId: launch.exerciseId, ...requireConfig(launch.sets, 'sets') });
    case 'amrap':
      return new AmrapEngine({ exerciseId: launch.exerciseId, ...requireConfig(launch.amrap, 'amrap') });
    case 'emom':
      return new EmomEngine({ exerciseId: launch.exerciseId, ...requireConfig(launch.emom, 'emom') });
    case 'circuit':
      return new CircuitEngine(requireConfig(launch.circuit, 'circuit'));
  }
}

function requireConfig<T>(config: T | undefined, mode: WorkoutMode): T {
  if (!config) throw new Error(`missing configuration for ${mode} workout`);
  return config;
}
