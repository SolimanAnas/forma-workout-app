import type { PermissionState, SensorKind } from '../../types';
import { queryMotionPermission, requestMotionPermission } from '../../permissions';
import { BaseAdapter, type DetectionResult } from './base';
import { hasDeviceMotion, xyzSensorCtor, type GenericXYZSensor } from './generic-sensor';

/**
 * Accelerometer adapter. Prefers the Generic Sensor API (`Accelerometer`) and falls back to
 * `DeviceMotionEvent.accelerationIncludingGravity`. Reports units in m/s².
 */
export class AccelerometerAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'accelerometer';

  private sensor: GenericXYZSensor | null = null;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;

  protected detect(): DetectionResult {
    if (xyzSensorCtor('Accelerometer')) {
      return { available: true, status: 'detected', source: 'generic-sensor', unit: 'm/s²' };
    }
    if (hasDeviceMotion()) {
      return { available: true, status: 'detected', source: 'device-motion', unit: 'm/s²' };
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
    const Ctor = xyzSensorCtor('Accelerometer');
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
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      this.emit({
        kind: this.kind,
        t: performance.now(),
        x: a.x ?? 0,
        y: a.y ?? 0,
        z: a.z ?? 0,
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
