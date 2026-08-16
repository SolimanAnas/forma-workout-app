import { el, screen } from '../dom';

export function renderHome(outlet: HTMLElement): void {
  const view = screen('Today', 'Your training at a glance.');

  const summary = el('div', { class: 'card' }, [
    el('p', { class: 'screen__lead' }, ['No workouts logged yet — start your first session.']),
  ]);

  const start = el('a', { class: 'btn btn--primary', href: '#/workout' }, ['Start a workout']);

  view.append(summary, start);
  outlet.append(view);
}
