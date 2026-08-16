import { EXERCISE_DEFINITIONS } from '../../domain/exercise/definitions';
import { el, screen } from '../dom';

export function renderExercises(outlet: HTMLElement): void {
  const view = screen('Exercises', `${EXERCISE_DEFINITIONS.length} MVP exercises.`);
  const list = el('ul', { class: 'exercise-list' });

  for (const ex of EXERCISE_DEFINITIONS) {
    const tags = el('div', {}, [
      el('span', { class: 'tag' }, [ex.category]),
      el('span', { class: 'tag' }, [ex.type]),
      ...ex.muscleGroups.primary.map((m) => el('span', { class: 'tag' }, [m])),
    ]);

    list.append(
      el('li', { class: 'card' }, [
        el('div', { class: 'exercise-item__name' }, [ex.name]),
        el('div', { class: 'exercise-item__meta' }, [
          `Difficulty ${ex.difficulty} · prefers ${ex.preferredSensors.join(', ')}`,
        ]),
        tags,
      ]),
    );
  }

  view.append(list);
  outlet.append(view);
}
