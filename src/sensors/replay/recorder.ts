import type { SensorKind, SensorSample } from '../types';
import type { SensorManager } from '../SensorManager';
import { RECORDING_FORMAT_VERSION, newId, type SensorRecording } from './recording';

/**
 * Records samples from one or more sensors into a `SensorRecording` (spec §39). Start it,
 * perform the movement, stop it — the resulting recording can be persisted and replayed.
 */
export class SensorRecorder {
  private samples: SensorSample[] = [];
  private unsubscribers: (() => void)[] = [];
  private startedAt = 0;
  private recording = false;

  constructor(
    private readonly manager: SensorManager,
    private readonly kinds: SensorKind[],
    private readonly exerciseId: string | null = null,
  ) {}

  isRecording(): boolean {
    return this.recording;
  }

  /** Samples captured so far (for live UI while recording). */
  get sampleCount(): number {
    return this.samples.length;
  }

  async start(): Promise<void> {
    if (this.recording) return;
    this.samples = [];
    this.startedAt = Date.now();
    for (const kind of this.kinds) {
      await this.manager.start(kind);
      this.unsubscribers.push(this.manager.subscribe(kind, (s) => this.samples.push(s)));
    }
    this.recording = true;
  }

  stop(): SensorRecording {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    for (const kind of this.kinds) this.manager.stop(kind);
    this.recording = false;

    return {
      id: newId(),
      formatVersion: RECORDING_FORMAT_VERSION,
      exerciseId: this.exerciseId,
      startedAt: this.startedAt,
      durationMs: Date.now() - this.startedAt,
      sampleCount: this.samples.length,
      samples: this.samples,
    };
  }
}
