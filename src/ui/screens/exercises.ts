import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import { exerciseEmoji, exerciseImage } from '../exercise-image';
import { el, screen } from '../dom';

export function renderExercises(outlet: HTMLElement): void {
  const view = screen('Exercises', `${EXERCISE_DEFINITIONS.length} movements in your MVP library.`);
  const list = el('ul', { class: 'exercise-list' });

  for (const ex of EXERCISE_DEFINITIONS) {
    const tags = el('div', {}, [
      el('span', { class: 'tag' }, [ex.category]),
      el('span', { class: 'tag' }, [ex.type]),
      ...ex.muscleGroups.primary.map((m) => el('span', { class: 'tag' }, [m])),
    ]);

    const img = el('img', {
      class: 'exercise-card__img',
      src: exerciseImage(ex.id),
      alt: ex.name,
      loading: 'lazy',
      width: '64',
      height: '64',
    }) as HTMLImageElement;
    img.addEventListener('error', () => {
      const fallback = el('div', { class: 'exercise-card__icon', 'aria-hidden': 'true' }, [
        exerciseEmoji(ex.id),
      ]);
      img.replaceWith(fallback);
    });

    list.append(
      el('li', { class: 'card exercise-card' }, [
        img,
        el('div', {}, [
          el('div', { class: 'exercise-item__name' }, [ex.name]),
          el('div', { class: 'exercise-item__meta' }, [
            `Difficulty ${ex.difficulty} · prefers ${ex.preferredSensors.join(', ')}`,
          ]),
          tags,
        ]),
      ]),
    );
  }

  view.append(list);
  outlet.append(view);
}
