import type { PermissionState } from './types';

/**
 * Motion/orientation permission handling (spec §9, §12).
 *
 * iOS 13+ exposes `DeviceMotionEvent.requestPermission()` which MUST be invoked from a user
 * gesture. Other browsers grant motion access without a prompt. We never assume — we detect.
 */

interface RequestPermissionCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

function motionEventCtor(): RequestPermissionCtor | undefined {
  return (globalThis as { DeviceMotionEvent?: RequestPermissionCtor }).DeviceMotionEvent;
}

function orientationEventCtor(): RequestPermissionCtor | undefined {
  return (globalThis as { DeviceOrientationEvent?: RequestPermissionCtor }).DeviceOrientationEvent;
}

export function motionSupported(): boolean {
  return motionEventCtor() !== undefined || orientationEventCtor() !== undefined;
}

/** True on platforms (iOS) where an explicit gesture-triggered request is required. */
export function motionRequiresRequest(): boolean {
  const ctor = motionEventCtor() ?? orientationEventCtor();
  return typeof ctor?.requestPermission === 'function';
}

export function queryMotionPermission(): PermissionState {
  if (!motionSupported()) return 'unsupported';
  // If the platform requires an explicit request, we cannot know the state until asked.
  return motionRequiresRequest() ? 'prompt' : 'granted';
}

/** Request motion permission. Call from a click/tap handler on platforms that require it. */
export async function requestMotionPermission(): Promise<PermissionState> {
  if (!motionSupported()) return 'unsupported';
  const ctor = motionEventCtor() ?? orientationEventCtor();
  if (typeof ctor?.requestPermission !== 'function') {
    // No gesture prompt needed on this platform.
    return 'granted';
  }
  try {
    const result = await ctor.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    // Thrown when not called from a user gesture, or the user dismissed it.
    return 'denied';
  }
}

/** Geolocation permission via the Permissions API, with a graceful fallback. */
export async function queryGeolocationPermission(): Promise<PermissionState> {
  if (!('geolocation' in navigator)) return 'unsupported';
  const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
  if (!perms?.query) return 'prompt';
  try {
    const status = await perms.query({ name: 'geolocation' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}
