import { takePendingLaunch } from '../../app/workout-context';
import { setState } from '../../app/state';
import { createEngine } from '../../services/workout-factory';
import { ActiveWorkout } from '../../services/active-workout';
import { getSensorManager } from '../../sensors/SensorManager';
import { getDetectionProfile } from '../../domain/exercise/detection-profiles';
import { getExerciseById } from '../../domain/exercise/definitions';
import type { WorkoutSnapshot } from '../../domain/workout/types';
import { saveWorkout } from '../../data/workouts';
import { el, screen } from '../dom';

export function renderActiveWorkout(outlet: HTMLElement): void {
  const launch = takePendingLaunch();
  if (!launch) {
    window.location.hash = '#/workout';
    return;
  }

  setState({ activeWorkout: true });

  const engine = createEngine(launch);
  const session = new ActiveWorkout(engine, launch.exerciseId);
  const exerciseName = getExerciseById(launch.exerciseId)?.name ?? launch.exerciseId;

  const view = el('section', { class: 'workout', 'aria-label': 'Active workout' });
  const title = el('div', { class: 'workout__exercise' }, [exerciseName]);
  const big = el('div', { class: 'rep-count', 'aria-live': 'polite' }, ['0']);
  const label = el('div', { class: 'rep-count__label' }, ['reps']);
  const detail = el('div', { class: 'workout__detail' }, ['']);
  view.append(title, big, label, detail);

  // Controls.
  const controls = el('div', { class: 'workout__controls' });
  const skip = el('button', { class: 'btn', type: 'button' }, ['Skip rest']);
  const add30 = el('button', { class: 'btn', type: 'button' }, ['+30s']);
  const finish = el('button', { class: 'btn', type: 'button' }, ['Finish']);
  skip.addEventListener('click', () => session.skipRest());
  add30.addEventListener('click', () => session.addRest(30000));
  finish.addEventListener('click', () => session.finish());
  controls.append(skip, add30, finish);
  view.append(controls);

  // Manual rep control when the driving sensor isn't available (e.g. desktop) or in dev mode.
  const profile = getDetectionProfile(launch.exerciseId);
  const sensorAvailable = profile
    ? (getSensorManager().getAdapter(profile.sensor)?.isAvailable() ?? false)
    : false;
  if (!sensorAvailable) {
    const simulate = el('button', { class: 'btn btn--primary', type: 'button' }, [
      '＋ Rep (no sensor)',
    ]);
    simulate.addEventListener('click', () => session.simulateRep());
    view.append(simulate);
    detail.textContent = 'Motion sensor unavailable — use manual reps.';
  }

  outlet.append(view);

  const paint = (s: WorkoutSnapshot): void => {
    big.textContent = String(s.primaryValue);
    label.textContent = s.primaryLabel;
    if (sensorAvailable || s.phase === 'RESTING') detail.textContent = s.detail ?? '';
    view.dataset.phase = s.phase;
  };
  session.onUpdate(paint);
  session.onFinish(() => void showResults());

  const showResults = async (): Promise<void> => {
    const res = session.result();
    await saveWorkout({
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: Date.now(),
      mode: res.mode,
      exercises: [{ exerciseId: launch.exerciseId, reps: res.totalReps }],
      totalReps: res.totalReps,
      durationSec: Math.round(res.durationMs / 1000),
      xpEarned: 0,
    });

    const results = screen('Workout complete', exerciseName);
    results.append(
      el('div', { class: 'card' }, [
        stat('Total reps', String(res.totalReps)),
        stat('Duration', `${Math.round(res.durationMs / 1000)}s`),
        stat('Mode', res.mode),
      ]),
      el('a', { class: 'btn btn--primary', href: '#/home' }, ['Done']),
    );
    outlet.replaceChildren(results);
  };

  // Lifecycle: release sensors + restore nav when leaving.
  const onLeave = (): void => {
    if (!outlet.contains(view) && !outlet.querySelector('.workout')) {
      session.stop();
      setState({ activeWorkout: false });
      window.removeEventListener('hashchange', onLeave);
    }
  };
  window.addEventListener('hashchange', onLeave);

  void session.start();
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'field' }, [
    el('span', {}, [label]),
    el('strong', {}, [value]),
  ]);
}
