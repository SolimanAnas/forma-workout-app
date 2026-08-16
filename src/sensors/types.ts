/**
 * Sensor Abstraction Layer types (spec §7, §8). The sensors layer is the ONLY place allowed to
 * touch browser sensor APIs; exercise/domain code consumes samples through this contract so a
 * future native Android adapter can be swapped in without changing algorithms.
 */

export type SensorKind =
  | 'accelerometer'
  | 'gyroscope'
  | 'orientation'
  | 'proximity'
  | 'barometer'
  | 'gps';

/** Permission outcomes we must handle explicitly (spec §12/§9). */
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** The honest four-state capability vocabulary (spec §8). Never fake this. */
export type CapabilityStatus = 'detected' | 'estimated' | 'unavailable' | 'unsupported';

/** Where a sample actually came from — surfaced so the UI can label Detected vs Estimated. */
export type SensorSource =
  | 'generic-sensor'
  | 'device-motion'
  | 'device-orientation'
  | 'geolocation'
  | 'replay'
  | null;

/** A normalized sample. Vector sensors use x/y/z; scalar sensors use `value`. */
export interface SensorSample {
  kind: SensorKind;
  /** Timestamp in milliseconds (monotonic where possible). */
  t: number;
  x?: number;
  y?: number;
  z?: number;
  value?: number;
  source: Exclude<SensorSource, null>;
}

export interface SensorCapabilities {
  kind: SensorKind;
  available: boolean;
  status: CapabilityStatus;
  source: SensorSource;
  /** Nominal sample frequency in Hz, when known. */
  frequency?: number;
  unit?: string;
}

export type SensorListener = (sample: SensorSample) => void;

/** Uniform adapter contract — every adapter (browser or native) implements this (spec §7). */
export interface SensorAdapter {
  readonly kind: SensorKind;
  /** Honest feature detection — true only if the API genuinely exists. */
  isAvailable(): boolean;
  getPermission(): Promise<PermissionState>;
  /** Must be called from a user gesture on platforms that require it (e.g. iOS). */
  requestPermission(): Promise<PermissionState>;
  getCapabilities(): SensorCapabilities;
  start(): Promise<void>;
  stop(): void;
  subscribe(fn: SensorListener): () => void;
}
