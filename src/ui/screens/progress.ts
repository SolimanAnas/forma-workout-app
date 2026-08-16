import { loadDashboard, type DashboardData } from '../../services/dashboard';
import { getExerciseById } from '../../domain/exercise/definitions';
import { el, screen } from '../dom';

export async function renderProgress(outlet: HTMLElement): Promise<void> {
  const data = await loadDashboard();
  const view = screen('Progress', `Level ${data.progress.level} · ${data.streak}-day streak`);

  view.append(levelCard(data));
  view.append(totalsCard(data));
  if (Object.keys(data.muscle).length > 0) view.append(muscleCard(data));
  if (data.prs.length > 0) view.append(prCard(data));
  if (data.perExercise.length > 0) view.append(progressionCard(data));
  view.append(recentCard(data));

  outlet.append(view);
}

function levelCard(d: DashboardData): HTMLElement {
  const pct =
    d.progress.xpForNextLevel > 0
      ? Math.round((d.progress.xpIntoLevel / d.progress.xpForNextLevel) * 100)
      : 0;
  const bar = el('div', { class: 'bar' }, [
    el('div', { class: 'bar__fill', style: `width:${pct}%` }, []),
  ]);
  return el('div', { class: 'card' }, [
    el('div', { class: 'exercise-item__name' }, [`Level ${d.progress.level}`]),
    bar,
    el('div', { class: 'exercise-item__meta' }, [
      `${d.progress.xpIntoLevel} / ${d.progress.xpForNextLevel} XP to next level · ${d.xp} total`,
    ]),
  ]);
}

function totalsCard(d: DashboardData): HTMLElement {
  return el('div', { class: 'card' }, [
    stat('Today', `${d.today.reps} reps · +${d.today.xp} XP`),
    stat('Workouts', String(d.totalWorkouts)),
    stat('Total reps', String(d.totalReps)),
    stat('Streak', `${d.streak} days`),
  ]);
}

function muscleCard(d: DashboardData): HTMLElement {
  const max = Math.max(1, ...Object.values(d.muscle));
  const card = el('div', { class: 'card' }, [el('div', { class: 'exercise-item__name' }, ['Muscle volume'])]);
  for (const [muscle, reps] of Object.entries(d.muscle).sort((a, b) => b[1] - a[1])) {
    const bar = el('div', { class: 'bar' }, [
      el('div', { class: 'bar__fill', style: `width:${Math.round((reps / max) * 100)}%` }, []),
    ]);
    card.append(
      el('div', { class: 'muscle-row' }, [
        el('span', { class: 'muscle-row__name' }, [muscle]),
        bar,
        el('span', { class: 'muscle-row__val' }, [String(Math.round(reps))]),
      ]),
    );
  }
  card.append(el('div', { class: 'disclaimer' }, ['Training guidance, not a physiological measurement.']));
  return card;
}

function prCard(d: DashboardData): HTMLElement {
  const card = el('div', { class: 'card' }, [el('div', { class: 'exercise-item__name' }, ['Personal records'])]);
  for (const pr of d.prs) {
    const name = getExerciseById(pr.exerciseId)?.name ?? pr.exerciseId;
    card.append(stat(`${name} · ${pr.metric}`, String(pr.value)));
  }
  return card;
}

function progressionCard(d: DashboardData): HTMLElement {
  const card = el('div', { class: 'card' }, [el('div', { class: 'exercise-item__name' }, ['Exercise levels'])]);
  for (const p of d.perExercise) {
    const name = getExerciseById(p.exerciseId)?.name ?? p.exerciseId;
    card.append(stat(name, `Level ${p.level} · ${p.target.sets}×${p.target.reps}`));
  }
  return card;
}

function recentCard(d: DashboardData): HTMLElement {
  const card = el('div', { class: 'card' }, [el('div', { class: 'exercise-item__name' }, ['Recent workouts'])]);
  if (d.recent.length === 0) {
    card.append(el('div', { class: 'exercise-item__meta' }, ['No workouts yet — get started!']));
    return card;
  }
  for (const w of d.recent) {
    const when = new Date(w.date).toLocaleDateString();
    card.append(stat(`${when} · ${w.mode}`, `${w.totalReps} reps`));
  }
  return card;
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'field' }, [el('span', {}, [label]), el('strong', {}, [value])]);
}
