import { GYM_SPLITS, getGymSplit } from '../../domain/gym/splits';
import type { GymDay, GymExercise } from '../../domain/gym/types';
import { el, screen } from '../dom';

/** Gym tab. `#/gym` lists splits; `#/gym/<splitId>` shows a split's days + exercises. */
export function renderGym(outlet: HTMLElement, splitId?: string): void {
  if (splitId) renderSplitDetail(outlet, splitId);
  else renderSplitList(outlet);
}

function renderSplitList(outlet: HTMLElement): void {
  const view = screen('Gym', 'Structured gym programs — pick a training split.');
  const grid = el('div', { class: 'gym-grid' });

  for (const split of GYM_SPLITS) {
    grid.append(
      el('a', { class: 'card gym-card', href: `#/gym/${split.id}` }, [
        el('div', { class: 'gym-card__head' }, [
          el('span', { class: 'gym-card__badge' }, [split.short]),
          el('span', { class: 'gym-card__name' }, [split.name]),
          el('span', { class: 'gym-card__chevron', 'aria-hidden': 'true' }, ['›']),
        ]),
        el('div', { class: 'exercise-item__meta' }, [split.description]),
        el('div', { class: 'gym-card__level' }, [split.level]),
        el(
          'div',
          { class: 'gym-card__days' },
          split.days.map((d) => el('span', { class: 'tag' }, [d.name])),
        ),
      ]),
    );
  }

  view.append(grid);
  outlet.append(view);
}

function renderSplitDetail(outlet: HTMLElement, splitId: string): void {
  const split = getGymSplit(splitId);
  if (!split) {
    window.location.hash = '#/gym';
    return;
  }

  const view = el('section', { class: 'screen', 'aria-label': split.name });
  view.append(el('a', { class: 'back-link', href: '#/gym' }, ['← All splits']));
  view.append(
    el('div', { class: 'ex-detail__head' }, [
      el('div', { class: 'gym-card__head' }, [
        el('span', { class: 'gym-card__badge' }, [split.short]),
        el('h1', { class: 'ex-hero__name' }, [split.name]),
      ]),
      el('div', { class: 'gym-card__level' }, [split.level]),
      el('p', { class: 'screen__lead gym-detail__desc' }, [split.description]),
    ]),
  );

  // Day tabs (horizontally scrollable — a split can have up to 5 days).
  const tabs = el('div', { class: 'day-tabs', role: 'tablist', 'aria-label': 'Training day' });
  const container = el('div', { class: 'gym-day' });
  const buttons: HTMLButtonElement[] = [];

  const showDay = (day: GymDay, active: HTMLButtonElement): void => {
    for (const b of buttons) b.setAttribute('aria-pressed', String(b === active));
    container.replaceChildren(
      el('div', { class: 'gym-day__focus' }, [day.focus]),
      ...day.exercises.map(exerciseCard),
    );
  };

  split.days.forEach((day, i) => {
    const btn = el('button', { class: 'day-tab', type: 'button' }, [day.name]) as HTMLButtonElement;
    btn.setAttribute('aria-pressed', String(i === 0));
    btn.addEventListener('click', () => showDay(day, btn));
    buttons.push(btn);
    tabs.append(btn);
  });

  view.append(tabs, container);
  showDay(split.days[0], buttons[0]);
  outlet.append(view);
}

function exerciseCard(exercise: GymExercise): HTMLElement {
  return el('div', { class: 'card gym-ex' }, [
    el('div', { class: 'gym-ex__head' }, [
      el('div', { class: 'gym-ex__name' }, [exercise.name]),
      el('span', { class: 'gym-ex__sets' }, [`${exercise.sets} × ${exercise.reps}`]),
    ]),
    el(
      'div',
      { class: 'gym-ex__muscles' },
      exercise.primaryMuscles.map((m) => el('span', { class: 'tag tag--muscle' }, [m])),
    ),
    el('div', { class: 'gym-ex__vars' }, [
      el('span', { class: 'gym-ex__vars-label' }, ['Variations']),
      el(
        'div',
        { class: 'gym-ex__vars-chips' },
        exercise.variations.map((v) => el('span', { class: 'chip' }, [v])),
      ),
    ]),
  ]);
}
