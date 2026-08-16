import type { PermissionState, SensorKind } from '../../types';
import { queryGeolocationPermission } from '../../permissions';
import { BaseAdapter, type DetectionResult } from './base';

/**
 * GPS adapter (`navigator.geolocation.watchPosition`). Emits x = latitude, y = longitude,
 * value = speed (m/s, when provided). Used only for outdoor activities in a later phase.
 */
export class GPSAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'gps';

  private watchId: number | null = null;

  protected detect(): DetectionResult {
    if ('geolocation' in navigator) {
      return { available: true, status: 'detected', source: 'geolocation', unit: 'deg' };
    }
    return { available: false, status: 'unsupported', source: null };
  }

  override getPermission(): Promise<PermissionState> {
    return queryGeolocationPermission();
  }

  override requestPermission(): Promise<PermissionState> {
    // The browser prompts on first watchPosition; report current known state.
    return queryGeolocationPermission();
  }

  protected startImpl(): void {
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.emit({
          kind: this.kind,
          t: performance.now(),
          x: pos.coords.latitude,
          y: pos.coords.longitude,
          value: pos.coords.speed ?? 0,
          source: 'geolocation',
        });
      },
      undefined,
      { enableHighAccuracy: true },
    );
  }

  protected stopImpl(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
