import { SchmittTrigger } from '../signal/filters';
import { clamp } from '../signal/stats';
import type { RepPhase, RepProfile, RepResult } from './types';

export interface RepEngineOptions {
  /** Expected peak amplitude for a full rep — used to scale the range/quality score. */
  expectedAmplitude: number;
  /** Ideal rep tempo in ms — quality peaks near this and decays away from it. */
  targetDurationMs?: number;
}

/**
 * Generic, state-machine-based rep detector (spec §15). Deterministic and explainable — NOT
 * `if (y > threshold) reps++`. Feed it an oriented scalar signal (positive = movement) with a
 * timestamp; it emits a RepResult when an oscillation completes (valid or rejected).
 *
 * Guards: hysteresis (Schmitt trigger) prevents chatter; amplitude gate rejects tiny movements;
 * duration window rejects too-fast/too-slow; cooldown prevents double counting; a max-duration
 * timeout discards interrupted movements.
 */
export class RepEngine {
  private readonly trigger: RepProfile;
  private readonly schmitt: SchmittTrigger;
  private readonly opts: RepEngineOptions;

  private phase: RepPhase = 'REST';
  private startT = 0;
  private peak = 0;
  private validCount = 0;
  private attemptCount = 0;
  private lastValidEndT = Number.NEGATIVE_INFINITY;

  constructor(profile: RepProfile, opts: RepEngineOptions) {
    if (profile.exitThreshold >= profile.enterThreshold) {
      throw new Error('exitThreshold must be < enterThreshold');
    }
    this.trigger = profile;
    this.opts = opts;
    this.schmitt = new SchmittTrigger(profile.enterThreshold, profile.exitThreshold);
  }

  get count(): number {
    return this.validCount;
  }

  get attempts(): number {
    return this.attemptCount;
  }

  get currentPhase(): RepPhase {
    return this.phase;
  }

  reset(): void {
    this.schmitt.reset();
    this.phase = 'REST';
    this.startT = 0;
    this.peak = 0;
    this.validCount = 0;
    this.attemptCount = 0;
    this.lastValidEndT = Number.NEGATIVE_INFINITY;
  }

  /** Push one signal sample. Returns a RepResult when a rep cycle completes, else null. */
  push(t: number, signal: number): RepResult | null {
    const active = this.schmitt.update(signal);

    if (this.phase === 'REST') {
      if (active) {
        this.phase = 'ACTIVE';
        this.startT = t;
        this.peak = signal;
      }
      return null;
    }

    // ACTIVE
    this.peak = Math.max(this.peak, signal);
    const elapsed = t - this.startT;

    if (!active) {
      // Returned to rest → candidate rep complete (finish() judges too-fast/too-slow/etc).
      this.phase = 'REST';
      return this.finish(t, elapsed);
    }

    if (elapsed > this.trigger.maxDurationMs) {
      // Still moving past the max window and never returned — interrupted.
      this.phase = 'REST';
      this.schmitt.reset();
      return this.reject('interrupted', t);
    }
    return null;
  }

  private finish(t: number, durationMs: number): RepResult {
    this.attemptCount++;

    if (this.peak < this.trigger.minAmplitude) return this.reject('too-small', t);
    if (durationMs < this.trigger.minDurationMs) return this.reject('too-fast', t);
    if (durationMs > this.trigger.maxDurationMs) return this.reject('too-slow', t);
    if (t - this.lastValidEndT < this.trigger.cooldownMs) return this.reject('cooldown', t);

    this.validCount++;
    this.lastValidEndT = t;
    return {
      index: this.validCount,
      startT: this.startT,
      endT: t,
      durationMs,
      amplitude: this.peak,
      quality: this.quality(durationMs),
      valid: true,
    };
  }

  private reject(reason: RepResult['reason'], t: number): RepResult {
    return {
      index: this.validCount,
      startT: this.startT,
      endT: t,
      durationMs: t - this.startT,
      amplitude: this.peak,
      quality: 0,
      valid: false,
      reason,
    };
  }

  /** Estimated movement quality from range + tempo. Honest: only proxies we can measure (spec §16). */
  private quality(durationMs: number): number {
    const rangeScore = clamp((this.peak / this.opts.expectedAmplitude) * 100, 0, 100);
    const target = this.opts.targetDurationMs;
    if (!target) return Math.round(rangeScore);
    const tempoScore = clamp(100 - (Math.abs(durationMs - target) / target) * 100, 0, 100);
    return Math.round(rangeScore * 0.6 + tempoScore * 0.4);
  }
}
