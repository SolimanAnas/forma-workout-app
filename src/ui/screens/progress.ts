import { el, screen } from '../dom';

export function renderProgress(outlet: HTMLElement): void {
  const view = screen('Progress', 'History, records and levels. (Arrives in Phase 5.)');
  view.append(
    el('div', { class: 'card' }, [
      el('p', { class: 'screen__lead' }, ['Complete a workout to start building your history.']),
    ]),
  );
  outlet.append(view);
}
