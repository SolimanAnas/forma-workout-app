import type { SensorManager } from '../sensors/SensorManager';
import { getSensorManager } from '../sensors/SensorManager';
import { getDetectionProfile } from '../domain/exercise/detection-profiles';
import type { WorkoutEngine, WorkoutSnapshot } from '../domain/workout/types';
import { SetsEngine } from '../domain/workout/sets';
import { RepDetector } from './detection';

export type SnapshotListener = (snapshot: WorkoutSnapshot) => void;

/**
 * Drives a live workout: binds the exercise's sensor through the RepDetector into the workout
 * engine, ticks on animation frames, and emits UI snapshots (spec §23/§34). Keeps sensor coupling
 * out of the engine. Rep detection is automatic; a manual `simulateRep` exists for devices/tests
 * without live motion sensors.
 */
export class ActiveWorkout {
  private detector: RepDetector | null = null;
  private unsubscribe: (() => void) | null = null;
  private rafId = 0;
  private started = false;
  private samples = 0;
  private readonly updateListeners = new Set<SnapshotListener>();
  private readonly finishListeners = new Set<() => void>();

  constructor(
    private readonly engine: WorkoutEngine,
    private readonly exerciseId: string,
    private readonly manager: SensorManager = getSensorManager(),
  ) {}

  onUpdate(fn: SnapshotListener): void {
    this.updateListeners.add(fn);
  }
  onFinish(fn: () => void): void {
    this.finishListeners.add(fn);
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.engine.start(this.now());

    const profile = getDetectionProfile(this.exerciseId);
    if (profile) {
      this.detector = new RepDetector(profile);
      try {
        await this.manager.start(profile.sensor);
        this.unsubscribe = this.manager.subscribe(profile.sensor, (sample) => {
          this.samples++;
          const rep = this.detector?.push(sample);
          if (rep?.valid) this.engine.registerRep(this.now());
        });
      } catch {
        // Sensor unavailable (e.g. desktop) — the workout still runs; use manual/simulated reps.
      }
    }
    this.loop();
  }

  /** Number of sensor samples received so far — used to detect a dead sensor feed. */
  get sampleCount(): number {
    return this.samples;
  }

  /** Manual rep — used on devices without motion sensors and in tests. */
  simulateRep(): void {
    if (this.started && !this.engine.finished) this.engine.registerRep(this.now());
  }

  finish(): void {
    if (this.engine instanceof SetsEngine) return; // sets end automatically
    (this.engine as { finish?: (now: number) => void }).finish?.(this.now());
  }

  pause(): void {
    (this.engine as { pause?: (now: number) => void }).pause?.(this.now());
  }
  resume(): void {
    (this.engine as { resume?: (now: number) => void }).resume?.(this.now());
  }
  skipRest(): void {
    (this.engine as { skipRest?: (now: number) => void }).skipRest?.(this.now());
  }
  addRest(ms: number): void {
    (this.engine as { addRest?: (ms: number) => void }).addRest?.(ms);
  }

  snapshot(): WorkoutSnapshot {
    return this.engine.snapshot(this.now());
  }

  result(): ReturnType<WorkoutEngine['result']> {
    return this.engine.result();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.unsubscribe?.();
    this.unsubscribe = null;
    const profile = getDetectionProfile(this.exerciseId);
    if (profile) this.manager.stop(profile.sensor);
  }

  private loop = (): void => {
    const now = this.now();
    this.engine.tick(now);
    const snapshot = this.engine.snapshot(now);
    for (const fn of this.updateListeners) fn(snapshot);
    if (this.engine.finished) {
      this.stop();
      for (const fn of this.finishListeners) fn();
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private now(): number {
    return performance.now();
  }
}
