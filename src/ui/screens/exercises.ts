import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import { exerciseEmoji, exerciseImage } from '../exercise-image';
import { el, screen } from '../dom';

export function renderExercises(outlet: HTMLElement): void {
  const view = screen('Exercises', `${EXERCISE_DEFINITIONS.length} movements — tap one for details.`);
  const list = el('ul', { class: 'exercise-list' });

  for (const ex of EXERCISE_DEFINITIONS) {
    const img = el('img', {
      class: 'exercise-card__img',
      src: exerciseImage(ex.id),
      alt: '',
      loading: 'lazy',
      width: '64',
      height: '64',
    }) as HTMLImageElement;
    img.addEventListener('error', () => {
      img.replaceWith(
        el('div', { class: 'exercise-card__icon', 'aria-hidden': 'true' }, [exerciseEmoji(ex.id)]),
      );
    });

    const tags = el('div', {}, [
      el('span', { class: 'tag' }, [ex.category]),
      el('span', { class: 'tag' }, [ex.type]),
      ...ex.muscleGroups.primary.map((m) => el('span', { class: 'tag' }, [m])),
    ]);

    const link = el('a', { class: 'card exercise-card', href: `#/exercise/${ex.id}` }, [
      img,
      el('div', { class: 'exercise-card__body' }, [
        el('div', { class: 'exercise-item__name' }, [ex.name]),
        el('div', { class: 'exercise-item__meta' }, [`Difficulty ${ex.difficulty} · ${ex.category}`]),
        tags,
      ]),
      el('span', { class: 'exercise-card__chevron', 'aria-hidden': 'true' }, ['›']),
    ]);

    list.append(el('li', {}, [link]));
  }

  view.append(list);
  outlet.append(view);
}
