import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/data/schema';
import { _resetDbForTests } from '../../src/data/db';
import { renderWorkout } from '../../src/ui/screens/workout';
import { renderExercise } from '../../src/ui/screens/exercise';
import { renderActiveWorkout } from '../../src/ui/screens/active-workout';
import { setPendingLaunch, takePendingLaunch } from '../../src/app/workout-context';
import { setState } from '../../src/app/state';
import { listWorkouts } from '../../src/data/workouts';

function outlet(): HTMLElement {
  const el = document.createElement('main');
  document.body.replaceChildren(el);
  return el;
}

const nextFrames = (ms = 80): Promise<void> => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
  setState({ activeWorkout: false });
});

describe('workout picker', () => {
  it('renders exercise buttons that link to their detail pages', () => {
    const o = outlet();
    renderWorkout(o);
    const picks = [...o.querySelectorAll<HTMLAnchorElement>('a.pick-btn')];
    expect(picks.length).toBeGreaterThanOrEqual(5);
    expect(picks[0].getAttribute('href')).toMatch(/^#\/exercise\//);
  });
});

describe('exercise detail page', () => {
  it('renders hero, how-to, a mode control, and a start button', () => {
    const o = outlet();
    renderExercise(o, 'pushup');
    expect(o.querySelector('.ex-hero__name')?.textContent).toBe('Push-up');
    expect(o.querySelectorAll('.howto li').length).toBeGreaterThan(0);
    expect(o.querySelectorAll('.segmented__btn')).toHaveLength(3);
    expect(o.querySelector('button.btn--primary')?.textContent).toContain('Start');
  });

  it('redirects to the picker for an unknown exercise', () => {
    const o = outlet();
    window.location.hash = '#/exercise/nope';
    renderExercise(o, 'nope');
    expect(window.location.hash).toBe('#/workout');
  });

  it('requests motion permission from the Start user-gesture (iOS-style)', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    (globalThis as Record<string, unknown>).DeviceMotionEvent = class {
      static requestPermission = requestPermission;
    };

    const o = outlet();
    renderExercise(o, 'pushup');
    o.querySelector<HTMLButtonElement>('button.btn--primary')?.click();
    await new Promise((r) => setTimeout(r, 20));

    expect(requestPermission).toHaveBeenCalledTimes(1);
    const launch = takePendingLaunch();
    expect(launch?.exerciseId).toBe('pushup');
    expect(launch?.motionPermission).toBe('granted');

    delete (globalThis as Record<string, unknown>).DeviceMotionEvent;
  });
});

describe('active workout (no sensor → manual reps)', () => {
  it('counts a manual rep, finishes at target, persists, and coaches the finish', async () => {
    const speak = vi.fn();
    (window as unknown as Record<string, unknown>).speechSynthesis = { speak, cancel: vi.fn() };
    (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class {
      constructor(public text: string) {}
    };

    setPendingLaunch({ mode: 'free', exerciseId: 'pushup', free: { targetReps: 1 } });
    const o = outlet();
    await renderActiveWorkout(o);

    const repCount = o.querySelector<HTMLElement>('.rep-count');
    expect(repCount?.textContent).toBe('0');
    // Tap-to-count is on by default → the rep number is the tap target.
    expect(repCount?.classList.contains('tappable')).toBe(true);

    repCount?.click();
    await nextFrames();

    // Reaching the target finishes the workout → results view + persisted record.
    expect(o.textContent).toContain('Workout complete');
    const history = await listWorkouts();
    expect(history).toHaveLength(1);
    expect(history[0].totalReps).toBe(1);
    // The voice coach announced completion (integration wiring).
    expect(speak).toHaveBeenCalled();

    delete (window as unknown as Record<string, unknown>).speechSynthesis;
    delete (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
  });

  it('redirects to setup when no launch is pending', async () => {
    const o = outlet();
    window.location.hash = '#/active-workout';
    await renderActiveWorkout(o);
    expect(window.location.hash).toBe('#/workout');
  });
});
