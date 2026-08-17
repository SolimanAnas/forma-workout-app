import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import { exerciseEmoji, exerciseImage } from '../exercise-image';
import { el, screen } from '../dom';

/** Workout tab = exercise picker. Tapping an exercise opens its detail/setup page. */
export function renderWorkout(outlet: HTMLElement): void {
  const view = screen('Workout', 'Pick an exercise to get started.');
  const grid = el('div', { class: 'pick-grid', role: 'list', 'aria-label': 'Exercises' });

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

    const link = el('a', { class: 'pick-btn', href: `#/exercise/${ex.id}`, role: 'listitem' }, [
      img,
      el('span', { class: 'pick-btn__name' }, [ex.name]),
      el('span', { class: 'pick-btn__meta' }, [ex.category]),
    ]);
    grid.append(link);
  }

  view.append(grid);
  outlet.append(view);
}
