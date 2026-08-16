import type { SensorAdapter } from '../../types';
import { AccelerometerAdapter } from './accelerometer';
import { GyroscopeAdapter } from './gyroscope';
import { OrientationAdapter } from './orientation';
import { ProximityAdapter } from './proximity';
import { BarometerAdapter } from './barometer';
import { GPSAdapter } from './gps';

/** Instantiates the full set of browser-backed sensor adapters. */
export function createBrowserAdapters(): SensorAdapter[] {
  return [
    new AccelerometerAdapter(),
    new GyroscopeAdapter(),
    new OrientationAdapter(),
    new ProximityAdapter(),
    new BarometerAdapter(),
    new GPSAdapter(),
  ];
}

export {
  AccelerometerAdapter,
  GyroscopeAdapter,
  OrientationAdapter,
  ProximityAdapter,
  BarometerAdapter,
  GPSAdapter,
};
