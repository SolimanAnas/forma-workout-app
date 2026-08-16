import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/data/schema';
import { _resetDbForTests } from '../../src/data/db';
import { renderWorkout } from '../../src/ui/screens/workout';
import { renderActiveWorkout } from '../../src/ui/screens/active-workout';
import { setPendingLaunch } from '../../src/app/workout-context';
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

describe('workout setup screen', () => {
  it('renders exercise + mode selectors and a start button', () => {
    const o = outlet();
    renderWorkout(o);
    expect(o.querySelectorAll('select')).toHaveLength(2);
    expect(o.querySelector('button.btn--primary')?.textContent).toContain('Start');
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

    expect(o.querySelector('.rep-count')?.textContent).toBe('0');
    const simulate = [...o.querySelectorAll('button')].find((b) => b.textContent?.includes('Rep'));
    expect(simulate, 'manual rep button should appear without a sensor').toBeDefined();

    simulate?.click();
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
