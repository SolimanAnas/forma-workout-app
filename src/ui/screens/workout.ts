import { el, screen } from '../dom';

const MODES: { name: string; desc: string }[] = [
  { name: 'Free Reps', desc: 'Unlimited reps, live count and tempo.' },
  { name: 'Sets', desc: 'e.g. 4 × 12 with rest between sets.' },
  { name: 'AMRAP', desc: 'As many rounds as possible in a time box.' },
  { name: 'EMOM', desc: 'Every minute, on the minute.' },
  { name: 'Circuit', desc: 'An ordered list of mixed movements.' },
];

export function renderWorkout(outlet: HTMLElement): void {
  const view = screen('Workout', 'Choose a mode. (Engine lands in Phase 4.)');
  const list = el('ul', { class: 'exercise-list' });

  for (const mode of MODES) {
    list.append(
      el('li', { class: 'card' }, [
        el('div', { class: 'exercise-item__name' }, [mode.name]),
        el('div', { class: 'exercise-item__meta' }, [mode.desc]),
      ]),
    );
  }

  view.append(list);
  outlet.append(view);
}
