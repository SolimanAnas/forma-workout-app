import { loadDashboard } from '../../services/dashboard';
import { levelRing, streakStrip } from '../components/charts';
import { el, screen } from '../dom';

export async function renderHome(outlet: HTMLElement): Promise<void> {
  const data = await loadDashboard();
  const view = screen('Today', 'Your training at a glance.');
  const pct =
    data.progress.xpForNextLevel > 0 ? data.progress.xpIntoLevel / data.progress.xpForNextLevel : 0;

  // Hero: animated level ring + streak.
  view.append(
    el('div', { class: 'card hero-card' }, [
      levelRing(pct, String(data.progress.level), 'Level'),
      el('div', { class: 'exercise-item__meta hero-card__xp' }, [
        `${data.progress.xpIntoLevel} / ${data.progress.xpForNextLevel} XP to next level`,
      ]),
      streakStrip(
        data.week.map((d) => d.active),
        data.streak,
      ),
    ]),
  );

  // Today.
  view.append(
    el('div', { class: 'card' }, [
      stat('Reps today', String(data.today.reps)),
      stat('XP today', `+${data.today.xp}`),
      stat('Workouts today', String(data.today.workouts)),
    ]),
  );

  // Daily challenge.
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
