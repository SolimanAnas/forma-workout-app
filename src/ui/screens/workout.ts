import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import type { WorkoutMode } from '../../domain/workout/types';
import { setPendingLaunch } from '../../app/workout-context';
import type { WorkoutLaunch } from '../../services/workout-factory';
import { getDetectionProfile } from '../../domain/exercise/detection-profiles';
import { motionSupported, requestMotionPermission } from '../../sensors/permissions';
import { exerciseEmoji, exerciseImage } from '../exercise-image';
import { el, screen } from '../dom';

const MOTION_SENSORS = new Set(['accelerometer', 'gyroscope', 'orientation']);

const STARTABLE: { mode: WorkoutMode; label: string }[] = [
  { mode: 'free', label: 'Free' },
  { mode: 'sets', label: 'Sets' },
  { mode: 'amrap', label: 'AMRAP' },
];

export function renderWorkout(outlet: HTMLElement): void {
  const view = screen('Workout', 'Choose an exercise and mode, then go.');

  let selectedExerciseId = EXERCISE_DEFINITIONS[0].id;
  let selectedMode: WorkoutMode = 'free';

  const card = el('div', { class: 'card' });

  // ── Exercise picker (buttons, not a dropdown) ──
  card.append(el('div', { class: 'eyebrow' }, ['Exercise']));
  const grid = el('div', { class: 'pick-grid', role: 'group', 'aria-label': 'Exercise' });
  const exerciseButtons: HTMLButtonElement[] = [];
  for (const ex of EXERCISE_DEFINITIONS) {
    const img = el('img', {
      class: 'pick-btn__img',
      src: exerciseImage(ex.id),
      alt: '',
      loading: 'lazy',
      width: '52',
      height: '52',
    }) as HTMLImageElement;
    img.addEventListener('error', () => {
      img.replaceWith(el('span', { class: 'pick-btn__icon', 'aria-hidden': 'true' }, [exerciseEmoji(ex.id)]));
    });
    const btn = el('button', { class: 'pick-btn', type: 'button' }, [
      img,
      el('span', { class: 'pick-btn__name' }, [ex.name]),
      el('span', { class: 'pick-btn__meta' }, [ex.category]),
    ]) as HTMLButtonElement;
    btn.dataset.id = ex.id;
    btn.setAttribute('aria-pressed', String(ex.id === selectedExerciseId));
    btn.addEventListener('click', () => {
      selectedExerciseId = ex.id;
      for (const b of exerciseButtons) b.setAttribute('aria-pressed', String(b.dataset.id === ex.id));
    });
    exerciseButtons.push(btn);
    grid.append(btn);
  }
  card.append(grid);

  // ── Mode picker (segmented control) ──
  card.append(el('div', { class: 'eyebrow', style: 'margin-top:var(--space-4)' }, ['Mode']));
  const segmented = el('div', { class: 'segmented', role: 'group', 'aria-label': 'Mode' });
  const modeButtons: HTMLButtonElement[] = [];
  for (const m of STARTABLE) {
    const btn = el('button', { class: 'segmented__btn', type: 'button' }, [m.label]) as HTMLButtonElement;
    btn.dataset.mode = m.mode;
    btn.setAttribute('aria-pressed', String(m.mode === selectedMode));
    btn.addEventListener('click', () => {
      selectedMode = m.mode;
      for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.dataset.mode === m.mode));
      applyVisibility();
    });
    modeButtons.push(btn);
    segmented.append(btn);
  }
  card.append(segmented);

  // ── Per-mode params ──
  const targetReps = numberInput('20');
  const setsCount = numberInput('3');
  const setsReps = numberInput('12');
  const restSec = numberInput('60');
  const amrapMin = numberInput('5');

  const freeGroup = group([field('Target reps (0 = open)', targetReps)]);
  const setsGroup = group([
    field('Sets', setsCount),
    field('Reps per set', setsReps),
    field('Rest (seconds)', restSec),
  ]);
  const amrapGroup = group([field('Duration (minutes)', amrapMin)]);
  card.append(freeGroup, setsGroup, amrapGroup);

  const applyVisibility = (): void => {
    freeGroup.hidden = selectedMode !== 'free';
    setsGroup.hidden = selectedMode !== 'sets';
    amrapGroup.hidden = selectedMode !== 'amrap';
  };
  applyVisibility();

  // ── Start ──
  const start = el('button', { class: 'btn btn--primary', type: 'button' }, ['Start workout']);
  const hint = el('p', { class: 'exercise-item__meta' }, [
    'Starting will ask for motion-sensor permission to count your reps automatically.',
  ]);

  start.addEventListener('click', async () => {
    const launch: WorkoutLaunch = { mode: selectedMode, exerciseId: selectedExerciseId };
    if (selectedMode === 'free') {
      const t = Number(targetReps.value) || 0;
      launch.free = t > 0 ? { targetReps: t } : {};
    } else if (selectedMode === 'sets') {
      launch.sets = {
        sets: Math.max(1, Number(setsCount.value) || 3),
        reps: Math.max(1, Number(setsReps.value) || 12),
        restMs: Math.max(0, Number(restSec.value) || 60) * 1000,
      };
    } else if (selectedMode === 'amrap') {
      launch.amrap = { durationMs: Math.max(1, Number(amrapMin.value) || 5) * 60000 };
    }

    // Request motion permission NOW, inside the user gesture (required on iOS 13+).
    const profile = getDetectionProfile(selectedExerciseId);
    if (profile && MOTION_SENSORS.has(profile.sensor) && motionSupported()) {
      start.disabled = true;
      start.textContent = 'Requesting permission…';
      launch.motionPermission = await requestMotionPermission();
    }

    setPendingLaunch(launch);
    window.location.hash = '#/active-workout';
  });

  view.append(card, start, hint);
  outlet.append(view);
}

function group(children: HTMLElement[]): HTMLElement {
  return el('div', { class: 'form-group' }, children);
}

function field(label: string, control: HTMLElement): HTMLElement {
  const id = `w-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  control.id = id;
  return el('div', { class: 'field' }, [el('label', { for: id }, [label]), control]);
}

function numberInput(value: string): HTMLInputElement {
  const input = el('input', { type: 'number', inputmode: 'numeric', min: '0' }) as HTMLInputElement;
  input.value = value;
  return input;
}
