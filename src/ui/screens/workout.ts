import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import type { WorkoutMode } from '../../domain/workout/types';
import { setPendingLaunch } from '../../app/workout-context';
import type { WorkoutLaunch } from '../../services/workout-factory';
import { el, screen } from '../dom';

/** Quick-start setup for the modes with a single-exercise UI (spec §17/§18/§21). */
const STARTABLE: { mode: WorkoutMode; label: string }[] = [
  { mode: 'free', label: 'Free reps' },
  { mode: 'sets', label: 'Sets' },
  { mode: 'amrap', label: 'AMRAP' },
];

export function renderWorkout(outlet: HTMLElement): void {
  const view = screen('Workout', 'Pick an exercise and mode, then start.');
  const card = el('div', { class: 'card' });

  const exercise = el('select', { 'aria-label': 'Exercise' }) as HTMLSelectElement;
  for (const ex of EXERCISE_DEFINITIONS) {
    exercise.append(el('option', { value: ex.id }, [ex.name]));
  }
  card.append(field('Exercise', exercise));

  const mode = el('select', { 'aria-label': 'Mode' }) as HTMLSelectElement;
  for (const m of STARTABLE) mode.append(el('option', { value: m.mode }, [m.label]));
  card.append(field('Mode', mode));

  // Per-mode params.
  const targetReps = numberInput('20');
  const setsCount = numberInput('3');
  const setsReps = numberInput('12');
  const restSec = numberInput('60');
  const amrapMin = numberInput('5');

  const freeRow = field('Target reps (0 = open)', targetReps);
  const setsRow1 = field('Sets', setsCount);
  const setsRow2 = field('Reps per set', setsReps);
  const setsRow3 = field('Rest (seconds)', restSec);
  const amrapRow = field('Duration (minutes)', amrapMin);
  card.append(freeRow, setsRow1, setsRow2, setsRow3, amrapRow);

  const applyVisibility = (): void => {
    const m = mode.value as WorkoutMode;
    freeRow.hidden = m !== 'free';
    setsRow1.hidden = setsRow2.hidden = setsRow3.hidden = m !== 'sets';
    amrapRow.hidden = m !== 'amrap';
  };
  mode.addEventListener('change', applyVisibility);
  applyVisibility();

  const start = el('button', { class: 'btn btn--primary', type: 'button' }, ['Start workout']);
  start.addEventListener('click', () => {
    const m = mode.value as WorkoutMode;
    const launch: WorkoutLaunch = { mode: m, exerciseId: exercise.value };
    if (m === 'free') {
      const t = Number(targetReps.value) || 0;
      launch.free = t > 0 ? { targetReps: t } : {};
    } else if (m === 'sets') {
      launch.sets = {
        sets: Math.max(1, Number(setsCount.value) || 3),
        reps: Math.max(1, Number(setsReps.value) || 12),
        restMs: Math.max(0, Number(restSec.value) || 60) * 1000,
      };
    } else if (m === 'amrap') {
      launch.amrap = { durationMs: Math.max(1, Number(amrapMin.value) || 5) * 60000 };
    }
    setPendingLaunch(launch);
    window.location.hash = '#/active-workout';
  });

  view.append(card, start);
  outlet.append(view);
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
