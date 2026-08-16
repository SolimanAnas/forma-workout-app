import { loadDashboard } from '../../services/dashboard';
import { el, screen } from '../dom';

export async function renderHome(outlet: HTMLElement): Promise<void> {
  const data = await loadDashboard();
  const view = screen('Today', 'Your training at a glance.');

  view.append(
    el('div', { class: 'card' }, [
      stat('Workouts today', String(data.today.workouts)),
      stat('Reps today', String(data.today.reps)),
      stat('XP today', `+${data.today.xp}`),
      stat('Streak', `${data.streak} days`),
      stat('Level', String(data.progress.level)),
    ]),
  );

  view.append(
    el('div', { class: 'card highlight' }, [
      el('div', { class: 'exercise-item__name' }, ["Today's challenge"]),
      el('div', { class: 'exercise-item__meta' }, [data.challenge.label]),
    ]),
  );

  view.append(el('a', { class: 'btn btn--primary', href: '#/workout' }, ['Start a workout']));
  outlet.append(view);
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'field' }, [el('span', {}, [label]), el('strong', {}, [value])]);
}
