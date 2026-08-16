import type { PermissionState, SensorKind } from '../../types';
import { queryMotionPermission, requestMotionPermission } from '../../permissions';
import { BaseAdapter, type DetectionResult } from './base';
import { hasDeviceOrientation } from './generic-sensor';

/**
 * Device orientation adapter (`DeviceOrientationEvent`). Emits degrees:
 * x = beta (front-back tilt), y = gamma (left-right tilt), z = alpha (compass heading).
 */
export class OrientationAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'orientation';

  private handler: ((e: DeviceOrientationEvent) => void) | null = null;

  protected detect(): DetectionResult {
    if (hasDeviceOrientation()) {
      return { available: true, status: 'detected', source: 'device-orientation', unit: 'deg' };
    }
    return { available: false, status: 'unsupported', source: null };
  }

  override getPermission(): Promise<PermissionState> {
    return Promise.resolve(queryMotionPermission());
  }

  override requestPermission(): Promise<PermissionState> {
    return requestMotionPermission();
  }

  protected startImpl(): void {
    this.handler = (e: DeviceOrientationEvent) => {
      this.emit({
        kind: this.kind,
        t: performance.now(),
        x: e.beta ?? 0,
        y: e.gamma ?? 0,
        z: e.alpha ?? 0,
        source: 'device-orientation',
      });
    };
    window.addEventListener('deviceorientation', this.handler);
  }

  protected stopImpl(): void {
    if (this.handler) {
      window.removeEventListener('deviceorientation', this.handler);
      this.handler = null;
    }
  }
}
