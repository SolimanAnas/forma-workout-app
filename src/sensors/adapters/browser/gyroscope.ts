import type { PermissionState, SensorKind } from '../../types';
import { queryMotionPermission, requestMotionPermission } from '../../permissions';
import { BaseAdapter, type DetectionResult } from './base';
import { hasDeviceMotion, xyzSensorCtor, type GenericXYZSensor } from './generic-sensor';

/**
 * Gyroscope adapter. Prefers the Generic Sensor API (`Gyroscope`, rad/s) and falls back to
 * `DeviceMotionEvent.rotationRate` (deg/s). The `unit` field reports which one is in use so
 * downstream code never conflates the two.
 */
export class GyroscopeAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'gyroscope';

  private sensor: GenericXYZSensor | null = null;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;

  protected detect(): DetectionResult {
    if (xyzSensorCtor('Gyroscope')) {
      return { available: true, status: 'detected', source: 'generic-sensor', unit: 'rad/s' };
    }
    if (hasDeviceMotion()) {
      return { available: true, status: 'detected', source: 'device-motion', unit: 'deg/s' };
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
    const Ctor = xyzSensorCtor('Gyroscope');
    if (Ctor) {
      const sensor = new Ctor({ frequency: 60 });
      sensor.addEventListener('reading', () => {
        this.emit({
          kind: this.kind,
          t: performance.now(),
          x: sensor.x ?? 0,
          y: sensor.y ?? 0,
          z: sensor.z ?? 0,
          source: 'generic-sensor',
        });
      });
      sensor.start();
      this.sensor = sensor;
      return;
    }

    this.motionHandler = (e: DeviceMotionEvent) => {
      const r = e.rotationRate;
      if (!r) return;
      this.emit({
        kind: this.kind,
        t: performance.now(),
        x: r.beta ?? 0,
        y: r.gamma ?? 0,
        z: r.alpha ?? 0,
        source: 'device-motion',
      });
    };
    window.addEventListener('devicemotion', this.motionHandler);
  }

  protected stopImpl(): void {
    this.sensor?.stop();
    this.sensor = null;
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }
  }
}
