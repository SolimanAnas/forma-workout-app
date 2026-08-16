/** Personal-record evaluation (spec §26). PURE domain. */

export type PrMetric =
  | 'maxReps'
  | 'bestSet'
  | 'mostRepsInTime'
  | 'fastestCompletion'
  | 'bestQuality'
  | 'longestDuration'
  | 'highestVolume';

export interface PrCandidate {
  metric: PrMetric;
  value: number;
}

/** Metrics where a smaller value is better (times). */
const LOWER_IS_BETTER: ReadonlySet<PrMetric> = new Set<PrMetric>(['fastestCompletion']);

export function isBetter(metric: PrMetric, value: number, existing: number | undefined): boolean {
  if (existing === undefined) return true;
  return LOWER_IS_BETTER.has(metric) ? value < existing : value > existing;
}

/** Returns the candidates that beat the existing records. */
export function evaluatePRs(
  candidates: PrCandidate[],
  existing: Partial<Record<PrMetric, number>>,
): PrCandidate[] {
  return candidates.filter((c) => isBetter(c.metric, c.value, existing[c.metric]));
}
