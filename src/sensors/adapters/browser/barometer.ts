import type { SensorKind } from '../../types';
import { BaseAdapter, type DetectionResult } from './base';
import { scalarSensorCtor, type GenericScalarSensor } from './generic-sensor';

/**
 * Barometer adapter (Generic Sensor API `Barometer`, hPa). Frequently unsupported in browsers —
 * reported honestly. Optional enhancer only (spec §8).
 */
export class BarometerAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'barometer';

  private sensor: GenericScalarSensor | null = null;

  protected detect(): DetectionResult {
    if (scalarSensorCtor('Barometer')) {
      return { available: true, status: 'detected', source: 'generic-sensor', unit: 'hPa' };
    }
    return { available: false, status: 'unsupported', source: null };
  }

  protected startImpl(): void {
    const Ctor = scalarSensorCtor('Barometer');
    if (!Ctor) return;
    const sensor = new Ctor({ frequency: 10 });
    sensor.addEventListener('reading', () => {
      this.emit({
        kind: this.kind,
        t: performance.now(),
        value: sensor.pressure ?? 0,
        source: 'generic-sensor',
      });
    });
    sensor.start();
    this.sensor = sensor;
  }

  protected stopImpl(): void {
    this.sensor?.stop();
    this.sensor = null;
  }
}
