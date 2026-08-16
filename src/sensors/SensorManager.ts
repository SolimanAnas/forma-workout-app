import type {
  PermissionState,
  SensorAdapter,
  SensorCapabilities,
  SensorKind,
  SensorListener,
} from './types';
import { createBrowserAdapters } from './adapters/browser';
import { createNativeAdapters } from './adapters/native';
import { computeDetectionMode, type DetectionMode } from './detection-mode';

/**
 * Central access point for sensors (spec §7, §10). Exercise/domain code goes through the
 * manager — never directly to browser APIs. Native adapters (when present) take precedence.
 */
export class SensorManager {
  private readonly adapters = new Map<SensorKind, SensorAdapter>();

  constructor(adapters?: SensorAdapter[]) {
    const provided = adapters ?? [...createNativeAdapters(), ...createBrowserAdapters()];
    for (const adapter of provided) {
      // First registration wins, so native adapters (listed first) take precedence.
      if (!this.adapters.has(adapter.kind)) this.adapters.set(adapter.kind, adapter);
    }
  }

  getAdapter(kind: SensorKind): SensorAdapter | undefined {
    return this.adapters.get(kind);
  }

  listCapabilities(): SensorCapabilities[] {
    return [...this.adapters.values()].map((a) => a.getCapabilities());
  }

  detectionMode(): DetectionMode {
    return computeDetectionMode(this.listCapabilities());
  }

  async start(kind: SensorKind): Promise<void> {
    const adapter = this.adapters.get(kind);
    if (!adapter) throw new Error(`No adapter registered for ${kind}`);
    await adapter.start();
  }

  stop(kind: SensorKind): void {
    this.adapters.get(kind)?.stop();
  }

  stopAll(): void {
    for (const adapter of this.adapters.values()) adapter.stop();
  }

  subscribe(kind: SensorKind, fn: SensorListener): () => void {
    const adapter = this.adapters.get(kind);
    if (!adapter) throw new Error(`No adapter registered for ${kind}`);
    return adapter.subscribe(fn);
  }

  getPermission(kind: SensorKind): Promise<PermissionState> {
    const adapter = this.adapters.get(kind);
    return adapter ? adapter.getPermission() : Promise.resolve('unsupported');
  }

  requestPermission(kind: SensorKind): Promise<PermissionState> {
    const adapter = this.adapters.get(kind);
    return adapter ? adapter.requestPermission() : Promise.resolve('unsupported');
  }
}

/** App-wide singleton. */
let instance: SensorManager | null = null;

export function getSensorManager(): SensorManager {
  instance ??= new SensorManager();
  return instance;
}
