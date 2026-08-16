/**
 * Voice/audio/haptic coaching (spec §23, §24). Every channel is feature-detected and optional —
 * audio is NEVER mandatory (visual feedback always suffices). Speech + beeps honor the on/off
 * setting; vibration is an independent haptic that guides even when audio is off.
 */

interface SpeechCapableWindow {
  speechSynthesis?: {
    speak(u: unknown): void;
    cancel(): void;
  };
  SpeechSynthesisUtterance?: new (text: string) => unknown;
  AudioContext?: new () => AudioContextLike;
  webkitAudioContext?: new () => AudioContextLike;
}

interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  createOscillator(): {
    frequency: { value: number };
    connect(n: unknown): void;
    start(t?: number): void;
    stop(t?: number): void;
  };
  createGain(): { gain: { value: number }; connect(n: unknown): void };
}

export class VoiceCoach {
  private audioCtx: AudioContextLike | null = null;

  constructor(private enabled: boolean) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Speak a short phrase, cancelling any in-flight utterance to stay sparse. */
  speak(text: string): void {
    if (!this.enabled) return;
    const w = window as unknown as SpeechCapableWindow;
    const synth = w.speechSynthesis;
    const Utterance = w.SpeechSynthesisUtterance;
    if (!synth || !Utterance) return;
    try {
      synth.cancel();
      synth.speak(new Utterance(text));
    } catch {
      /* speech unavailable — visual feedback still covers it */
    }
  }

  /** A short audio cue (e.g. one per rep). */
  beep(frequency = 880, durationMs = 80): void {
    if (!this.enabled) return;
    const ctx = this.context();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frequency;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      /* audio unavailable */
    }
  }

  /** Haptic feedback, independent of the audio toggle. */
  vibrate(pattern: number | number[]): void {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    try {
      nav.vibrate?.(pattern);
    } catch {
      /* no haptics */
    }
  }

  private context(): AudioContextLike | null {
    if (this.audioCtx) return this.audioCtx;
    const w = window as unknown as SpeechCapableWindow;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.audioCtx = new Ctor();
      return this.audioCtx;
    } catch {
      return null;
    }
  }
}
