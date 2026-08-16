import type { SensorAdapter } from '../../types';

/**
 * Placeholder for the future native (Capacitor/Android) sensor adapters (spec §2, §7). When a
 * native bridge is present it will supply adapters here, and `SensorManager` will prefer them
 * over browser adapters. Not implemented in the MVP — returns an empty set.
 */
export function createNativeAdapters(): SensorAdapter[] {
  return [];
}

/** True when running inside a native shell that exposes the sensor bridge. */
export function hasNativeBridge(): boolean {
  return false;
}
