import type { SensorKind } from '../../types';
import { BaseAdapter, type DetectionResult } from './base';

/**
 * Proximity adapter. Browser proximity support is rare and mostly gone — this adapter is honest
 * about that and reports `unsupported` on the vast majority of devices (spec §8/§53). Uses the
 * legacy `ondeviceproximity` event where it genuinely exists.
 */
export class ProximityAdapter extends BaseAdapter {
  readonly kind: SensorKind = 'proximity';

  private handler: EventListener | null = null;

  protected detect(): DetectionResult {
    if ('ondeviceproximity' in globalThis) {
      return { available: true, status: 'detected', source: 'device-motion', unit: 'cm' };
    }
    return { available: false, status: 'unsupported', source: null };
  }

  protected startImpl(): void {
    this.handler = (e: Event) => {
      const value = (e as Event & { value?: number }).value;
      if (value === undefined) return;
      this.emit({ kind: this.kind, t: performance.now(), value, source: 'device-motion' });
    };
    window.addEventListener('deviceproximity', this.handler);
  }

  protected stopImpl(): void {
    if (this.handler) {
      window.removeEventListener('deviceproximity', this.handler);
      this.handler = null;
    }
  }
}
