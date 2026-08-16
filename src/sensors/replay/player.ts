import type { SensorListener } from '../types';
import type { SensorRecording } from './recording';

export interface ReplayOptions {
  onSample: SensorListener;
  onDone?: () => void;
  /** Replay honoring the original inter-sample timing. Default false (emit synchronously). */
  realtime?: boolean;
  /** Speed multiplier for realtime replay (2 = twice as fast). Default 1. */
  timeScale?: number;
}

/**
 * Replays a `SensorRecording` through the detection pipeline exactly as a live run would
 * (spec §39). Synchronous mode (default) is deterministic and drives unit tests; realtime mode
 * reproduces the original cadence for visual debugging.
 */
export class ReplayPlayer {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private stopped = false;

  constructor(private readonly recording: SensorRecording) {}

  play(options: ReplayOptions): void {
    this.stopped = false;
    const { samples } = this.recording;

    if (!options.realtime) {
      for (const sample of samples) {
        if (this.stopped) return;
        options.onSample(sample);
      }
      options.onDone?.();
      return;
    }

    const scale = options.timeScale && options.timeScale > 0 ? options.timeScale : 1;
    const base = samples.length > 0 ? samples[0].t : 0;
    for (const sample of samples) {
      const delay = Math.max(0, (sample.t - base) / scale);
      this.timers.push(
        setTimeout(() => {
          if (!this.stopped) options.onSample(sample);
        }, delay),
      );
    }
    const total = samples.length > 0 ? (samples[samples.length - 1].t - base) / scale : 0;
    this.timers.push(
      setTimeout(() => {
        if (!this.stopped) options.onDone?.();
      }, total),
    );
  }

  stop(): void {
    this.stopped = true;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
