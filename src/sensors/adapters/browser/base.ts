import type {
  CapabilityStatus,
  PermissionState,
  SensorAdapter,
  SensorCapabilities,
  SensorKind,
  SensorListener,
  SensorSample,
  SensorSource,
} from '../../types';

export interface DetectionResult {
  available: boolean;
  status: CapabilityStatus;
  source: SensorSource;
  frequency?: number;
  unit?: string;
}

/** Shared listener management + start/stop guarding for browser adapters. */
export abstract class BaseAdapter implements SensorAdapter {
  abstract readonly kind: SensorKind;

  private readonly listeners = new Set<SensorListener>();
  private running = false;

  /** Honest feature detection for this sensor. */
  protected abstract detect(): DetectionResult;

  /** Attach the underlying source; call `this.emit` on each reading. */
  protected abstract startImpl(): Promise<void> | void;

  /** Detach the underlying source. */
  protected abstract stopImpl(): void;

  isAvailable(): boolean {
    return this.detect().available;
  }

  getPermission(): Promise<PermissionState> {
    // Default: available sensors need no explicit permission. Motion adapters override.
    return Promise.resolve(this.isAvailable() ? 'granted' : 'unsupported');
  }

  requestPermission(): Promise<PermissionState> {
    return this.getPermission();
  }

  getCapabilities(): SensorCapabilities {
    const d = this.detect();
    return {
      kind: this.kind,
      available: d.available,
      status: d.status,
      source: d.source,
      frequency: d.frequency,
      unit: d.unit,
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!this.isAvailable()) {
      throw new Error(`${this.kind} is not available on this device/browser`);
    }
    await this.startImpl();
    this.running = true;
  }

  stop(): void {
    if (!this.running) return;
    this.stopImpl();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  subscribe(fn: SensorListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  protected emit(sample: SensorSample): void {
    for (const fn of this.listeners) fn(sample);
  }
}
