/**
 * Deterministic signal-processing primitives (spec §21, §37). PURE — no browser APIs, no ML.
 * These are the building blocks the rep engine uses to tame noisy sensor data.
 */

/** 3-axis vector magnitude. */
export function magnitude3(x: number, y: number, z: number): number {
  return Math.hypot(x, y, z);
}

/** Simple (non-streaming) moving average over a window. */
export function movingAverage(values: number[], window: number): number[] {
  if (window <= 1) return [...values];
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(sum / Math.min(i + 1, window));
  }
  return out;
}

/**
 * Exponential moving average (low-pass) filter, streaming.
 * `alpha` in (0,1]: higher = more responsive/noisier, lower = smoother/laggier.
 */
export class LowPassFilter {
  private value: number | null = null;

  constructor(private readonly alpha: number) {
    if (alpha <= 0 || alpha > 1) throw new Error('alpha must be in (0, 1]');
  }

  next(x: number): number {
    this.value = this.value === null ? x : this.alpha * x + (1 - this.alpha) * this.value;
    return this.value;
  }

  get current(): number | null {
    return this.value;
  }

  reset(seed?: number): void {
    this.value = seed ?? null;
  }
}

/** High-pass = input minus its low-passed component (removes slow drift / gravity bias). */
export class HighPassFilter {
  private readonly lp: LowPassFilter;

  constructor(alpha: number) {
    this.lp = new LowPassFilter(alpha);
  }

  next(x: number): number {
    return x - this.lp.next(x);
  }

  reset(): void {
    this.lp.reset();
  }
}

/**
 * Schmitt trigger — hysteresis comparator that prevents chatter around a threshold.
 * Goes high at/above `high`, low at/below `low`; holds state in between.
 */
export class SchmittTrigger {
  private state: boolean;

  constructor(
    private readonly high: number,
    private readonly low: number,
    initial = false,
  ) {
    if (low > high) throw new Error('low must be <= high');
    this.state = initial;
  }

  update(value: number): boolean {
    if (!this.state && value >= this.high) this.state = true;
    else if (this.state && value <= this.low) this.state = false;
    return this.state;
  }

  get active(): boolean {
    return this.state;
  }

  reset(initial = false): void {
    this.state = initial;
  }
}
