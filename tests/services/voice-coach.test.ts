import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceCoach } from '../../src/services/voice-coach';
import { COACH } from '../../src/domain/coach/messages';

const w = window as unknown as Record<string, unknown>;

afterEach(() => {
  delete w.speechSynthesis;
  delete w.SpeechSynthesisUtterance;
});

function stubSpeech() {
  const speak = vi.fn();
  const cancel = vi.fn();
  w.speechSynthesis = { speak, cancel };
  w.SpeechSynthesisUtterance = class {
    constructor(public text: string) {}
  };
  return { speak, cancel };
}

describe('VoiceCoach', () => {
  it('no-ops safely when no speech/audio APIs exist (jsdom)', () => {
    const coach = new VoiceCoach(true);
    expect(() => {
      coach.speak('hi');
      coach.beep();
      coach.vibrate(30);
    }).not.toThrow();
  });

  it('speaks when enabled', () => {
    const { speak } = stubSpeech();
    new VoiceCoach(true).speak('Start');
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('stays silent when disabled', () => {
    const { speak } = stubSpeech();
    const coach = new VoiceCoach(false);
    coach.speak('Start');
    coach.beep();
    expect(speak).not.toHaveBeenCalled();
  });

  it('respects setEnabled toggling', () => {
    const { speak } = stubSpeech();
    const coach = new VoiceCoach(false);
    coach.speak('a');
    coach.setEnabled(true);
    coach.speak('b');
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('uses vibration independently of the audio toggle', () => {
    const vibrate = vi.fn();
    const nav = navigator as unknown as Record<string, unknown>;
    nav.vibrate = vibrate;
    new VoiceCoach(false).vibrate([100, 50, 100]);
    expect(vibrate).toHaveBeenCalledWith([100, 50, 100]);
    delete nav.vibrate;
  });
});

describe('coach messages', () => {
  it('are short and non-empty', () => {
    expect(COACH.start()).toBe('Start');
    expect(COACH.setComplete()).toBe('Set complete');
    expect(COACH.repsLeft(1)).toBe('One more');
    expect(COACH.repsLeft(3)).toBe('3 more');
    expect(COACH.nextExercise('Squat')).toBe('Next: Squat');
  });
});
