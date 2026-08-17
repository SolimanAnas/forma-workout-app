import { getExerciseById } from '../../domain/exercise/definitions';
import { getDetectionProfile } from '../../domain/exercise/detection-profiles';
import { getHowto } from '../../domain/exercise/howto';
import { getPlacement } from '../../domain/exercise/placement';
import type { WorkoutMode } from '../../domain/workout/types';
import { setPendingLaunch } from '../../app/workout-context';
import type { WorkoutLaunch } from '../../services/workout-factory';
import { motionSupported, requestMotionPermission } from '../../sensors/permissions';
import { exerciseEmoji, exerciseImage, exercisePoster } from '../exercise-image';
import { el } from '../dom';

const MOTION_SENSORS = new Set(['accelerometer', 'gyroscope', 'orientation']);

const STARTABLE: { mode: WorkoutMode; label: string }[] = [
  { mode: 'free', label: 'Free' },
  { mode: 'sets', label: 'Sets' },
  { mode: 'amrap', label: 'Max' },
];

/** Exercise detail + setup page. Opened from the Workout picker via `#/exercise/<id>`. */
export function renderExercise(outlet: HTMLElement, id?: string): void {
  const exercise = id ? getExerciseById(id) : undefined;
  if (!exercise) {
    window.location.hash = '#/workout';
    return;
  }

  const view = el('section', { class: 'screen ex-detail', 'aria-label': exercise.name });

  view.append(el('a', { class: 'back-link', href: '#/workout' }, ['← All exercises']));

  // Header.
  view.append(
    el('div', { class: 'ex-detail__head' }, [
      el('h1', { class: 'ex-hero__name' }, [exercise.name]),
      el('div', { class: 'ex-hero__tags' }, [
        el('span', { class: 'tag' }, [exercise.category]),
        el('span', { class: 'tag' }, [exercise.type]),
        ...exercise.muscleGroups.primary.map((m) => el('span', { class: 'tag' }, [m])),
      ]),
    ]),
  );

  // Detailed poster — the visual "how to". Falls back to the icon, then an emoji tile.
  const poster = el('img', {
    class: 'ex-poster',
    src: exercisePoster(exercise.id),
    alt: `How to do ${exercise.name}`,
    loading: 'eager',
  }) as HTMLImageElement;
  let posterFellBack = false;
  poster.addEventListener('error', () => {
    if (!posterFellBack) {
      posterFellBack = true;
      poster.src = exerciseImage(exercise.id);
    } else {
      poster.replaceWith(
        el('div', { class: 'ex-poster ex-poster--fallback', 'aria-hidden': 'true' }, [
          exerciseEmoji(exercise.id),
        ]),
      );
    }
  });
  view.append(el('figure', { class: 'ex-poster-wrap' }, [poster]));

  // Setup: mode + params + start.
  let selectedMode: WorkoutMode = 'free';
  const card = el('div', { class: 'card' });
  card.append(el('div', { class: 'eyebrow' }, ['Mode']));

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
  view.append(card);

  const start = el('button', { class: 'btn btn--primary', type: 'button' }, ['Start workout']);
  const hint = el('p', { class: 'exercise-item__meta' }, [
    'Starting will ask for motion-sensor permission to count your reps automatically.',
  ]);

  start.addEventListener('click', async () => {
    const launch: WorkoutLaunch = { mode: selectedMode, exerciseId: exercise.id };
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
    const profile = getDetectionProfile(exercise.id);
    if (profile && MOTION_SENSORS.has(profile.sensor) && motionSupported()) {
      start.disabled = true;
      start.textContent = 'Requesting permission…';
      launch.motionPermission = await requestMotionPermission();
    }

    setPendingLaunch(launch);
    window.location.hash = '#/active-workout';
  });

  view.append(start, hint);

  // Phone placement (so the sensor can actually see the movement).
  const placement = getPlacement(exercise.placement);
  if (placement) {
    const steps = el('ul', { class: 'howto placement-steps' });
    for (const step of placement.steps) steps.append(el('li', {}, [step]));
    view.append(
      el('div', { class: 'card' }, [
        el('div', { class: 'eyebrow' }, ['📱 Phone placement']),
        el('div', { class: 'exercise-item__name' }, [placement.title]),
        steps,
        ...(placement.recommendedDistance
          ? [el('div', { class: 'exercise-item__meta' }, [`Distance: ${placement.recommendedDistance}`])]
          : []),
      ]),
    );
  }

  // How-to.
  const howto = getHowto(exercise.id);
  if (howto.length > 0) {
    const list = el('ol', { class: 'howto' });
    for (const step of howto) list.append(el('li', {}, [step]));
    view.append(el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, ['How to']), list]));
  }

  outlet.append(view);
}

function group(children: HTMLElement[]): HTMLElement {
  return el('div', { class: 'form-group' }, children);
}

function field(label: string, control: HTMLElement): HTMLElement {
  const fid = `x-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  control.id = fid;
  return el('div', { class: 'field' }, [el('label', { for: fid }, [label]), control]);
}

function numberInput(value: string): HTMLInputElement {
  const input = el('input', { type: 'number', inputmode: 'numeric', min: '0' }) as HTMLInputElement;
  input.value = value;
  return input;
}
