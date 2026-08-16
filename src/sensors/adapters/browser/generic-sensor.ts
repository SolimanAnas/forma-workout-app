/** Minimal typings + helpers for the Generic Sensor API, accessed without `any`. */

export interface GenericXYZSensor {
  x?: number;
  y?: number;
  z?: number;
  start(): void;
  stop(): void;
  addEventListener(type: 'reading' | 'error', cb: () => void): void;
  removeEventListener(type: 'reading' | 'error', cb: () => void): void;
}

export interface GenericScalarSensor {
  pressure?: number;
  start(): void;
  stop(): void;
  addEventListener(type: 'reading' | 'error', cb: () => void): void;
  removeEventListener(type: 'reading' | 'error', cb: () => void): void;
}

interface SensorCtor<T> {
  new (opts?: { frequency?: number }): T;
}

function getCtor<T>(name: string): SensorCtor<T> | undefined {
  return (globalThis as Record<string, unknown>)[name] as SensorCtor<T> | undefined;
}

export function xyzSensorCtor(name: string): SensorCtor<GenericXYZSensor> | undefined {
  return getCtor<GenericXYZSensor>(name);
}

export function scalarSensorCtor(name: string): SensorCtor<GenericScalarSensor> | undefined {
  return getCtor<GenericScalarSensor>(name);
}

export function hasDeviceMotion(): boolean {
  return 'DeviceMotionEvent' in globalThis;
}

export function hasDeviceOrientation(): boolean {
  return 'DeviceOrientationEvent' in globalThis;
}
