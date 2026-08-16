import { mean, stddev } from '../signal/stats';

export interface CalibrationResult {
  /** Rest value on the tracked axis. */
  baseline: number;
  /** Signal noise at rest — used to keep thresholds above the noise floor. */
  restStd: number;
  sampleCount: number;
}

/**
 * Captures a short "hold still" window and derives a baseline + rest noise (spec §14). PURE
 * domain — fed plain axis values by the services layer during the 3-2-1 countdown. Kept simple to
 * avoid overfitting: it must improve reliability without making workouts cumbersome.
 */
export class Calibrator {
  private readonly values: number[] = [];

  add(axisValue: number): void {
    this.values.push(axisValue);
  }

  get count(): number {
    return this.values.length;
  }

  reset(): void {
    this.values.length = 0;
  }

  result(): CalibrationResult {
    return {
      baseline: mean(this.values),
      restStd: stddev(this.values),
      sampleCount: this.values.length,
    };
  }
}
