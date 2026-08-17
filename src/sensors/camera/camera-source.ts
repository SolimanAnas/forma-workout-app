/**
 * Camera brightness source (spec §50 camera-based detection, prototype). Grabs frames from the
 * front camera and emits the average frame luminance. With the phone flat on the floor and the
 * front camera facing up, the frame darkens as your head/chest approaches on each rep and brightens
 * as you rise — an oscillating scalar the RepEngine can count. Browser-only (sensors layer).
 */

export interface BrightnessSample {
  /** Monotonic timestamp (ms). */
  t: number;
  /** Average frame luminance, 0 (black) – 255 (white). */
  value: number;
}

export type BrightnessListener = (sample: BrightnessSample) => void;

export interface BrightnessSource {
  start(): Promise<void>;
  stop(): void;
  subscribe(fn: BrightnessListener): () => void;
  readonly running: boolean;
}

/** True when the browser can grant camera access (secure context + API present). */
export function cameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

export class CameraBrightnessSource implements BrightnessSource {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly listeners = new Set<BrightnessListener>();
  private active = false;

  /** Sampling period in ms (~20 fps by default) and the downscaled analysis resolution. */
  constructor(
    private readonly periodMs = 50,
    private readonly w = 32,
    private readonly h = 24,
  ) {}

  get running(): boolean {
    return this.active;
  }

  subscribe(fn: BrightnessListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async start(): Promise<void> {
    if (this.active) return;
    if (!cameraSupported()) throw new Error('Camera not available');

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 } },
      audio: false,
    });

    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.playsInline = true;
    video.muted = true;
    await video.play();
    this.video = video;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.active = true;
    this.timer = setInterval(() => this.sample(), this.periodMs);
  }

  stop(): void {
    this.active = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  private sample(): void {
    if (!this.ctx || !this.video || this.video.readyState < 2) return;
    this.ctx.drawImage(this.video, 0, 0, this.w, this.h);
    let sum = 0;
    const { data } = this.ctx.getImageData(0, 0, this.w, this.h);
    for (let i = 0; i < data.length; i += 4) {
      // Rec. 601 luma.
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const value = sum / (data.length / 4);
    const sample: BrightnessSample = { t: performance.now(), value };
    for (const fn of this.listeners) fn(sample);
  }
}
