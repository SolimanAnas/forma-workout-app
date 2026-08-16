/** Rep detection engine types (spec §15, §16). PURE domain. */

export type RepPhase = 'REST' | 'ACTIVE';

/**
 * Tunable per-exercise thresholds. The engine consumes an oriented scalar `signal` (positive =
 * movement away from rest) and detects one rep per oscillation, guarded by amplitude + timing.
 */
export interface RepProfile {
  /** signal ≥ enter → the movement phase begins. */
  enterThreshold: number;
  /** signal ≤ exit (after entering) → the rep candidate completes. Must be < enterThreshold. */
  exitThreshold: number;
  /** Peak signal during the movement must reach this, else it is a partial rep. */
  minAmplitude: number;
  minDurationMs: number;
  maxDurationMs: number;
  /** Minimum time between two counted reps (debounce). */
  cooldownMs: number;
}

export type RepRejectReason =
  | 'too-fast'
  | 'too-slow'
  | 'too-small'
  | 'cooldown'
  | 'interrupted';

export interface RepResult {
  index: number;
  startT: number;
  endT: number;
  durationMs: number;
  /** Peak oriented signal reached (movement range proxy). */
  amplitude: number;
  /** Estimated 0–100 movement-quality score. Labeled "estimated" in UI (spec §16). */
  quality: number;
  valid: boolean;
  reason?: RepRejectReason;
}
