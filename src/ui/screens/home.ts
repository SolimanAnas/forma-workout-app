import { loadDashboard } from '../../services/dashboard';
import { getExerciseById } from '../../domain/exercise/definitions';
import { levelRing, streakStrip, weekBars } from '../components/charts';
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

  const weekTotal = data.week.reduce((s, day) => s + day.reps, 0);
  view.append(
    el('div', { class: 'card' }, [
      el('div', { class: 'eyebrow' }, [`This week · ${weekTotal} reps`]),
      weekBars(data.week),
    ]),
  );

  view.append(
    el('div', { class: 'card' }, [
      el('div', { class: 'eyebrow' }, ['All time']),
      stat('Workouts', String(data.totalWorkouts)),
      stat('Total reps', String(data.totalReps)),
    ]),
  );

  if (Object.keys(data.muscle).length > 0) {
    const max = Math.max(1, ...Object.values(data.muscle));
    const muscleCard = el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, ['Muscle volume'])]);
    for (const [muscle, reps] of Object.entries(data.muscle).sort((a, b) => b[1] - a[1])) {
      const bar = el('div', { class: 'bar' }, [
        el('div', { class: 'bar__fill', style: `width:${Math.round((reps / max) * 100)}%` }, []),
      ]);
      muscleCard.append(
        el('div', { class: 'muscle-row' }, [
          el('span', { class: 'muscle-row__name' }, [muscle]),
          bar,
          el('span', { class: 'muscle-row__val' }, [String(Math.round(reps))]),
        ]),
      );
    }
    muscleCard.append(el('div', { class: 'disclaimer' }, ['Training guidance, not a physiological measurement.']));
    view.append(muscleCard);
  }

  if (data.prs.length > 0) {
    const prCard = el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, ['Personal records'])]);
    for (const pr of data.prs) {
      const name = getExerciseById(pr.exerciseId)?.name ?? pr.exerciseId;
      prCard.append(stat(`${name} · ${pr.metric}`, String(pr.value)));
    }
    view.append(prCard);
  }

  if (data.perExercise.length > 0) {
    const lvlCard = el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, ['Exercise levels'])]);
    for (const p of data.perExercise) {
      const name = getExerciseById(p.exerciseId)?.name ?? p.exerciseId;
      lvlCard.append(stat(name, `Level ${p.level} · ${p.target.sets}×${p.target.reps}`));
    }
    view.append(lvlCard);
  }

  const recentCard = el('div', { class: 'card' }, [el('div', { class: 'eyebrow' }, ['Recent workouts'])]);
  if (data.recent.length === 0) {
    recentCard.append(el('div', { class: 'exercise-item__meta' }, ['No workouts yet — get started!']));
  } else {
    for (const w of data.recent) {
      const when = new Date(w.date).toLocaleDateString();
      recentCard.append(stat(`${when} · ${w.mode}`, `${w.totalReps} reps`));
    }
  }
  view.append(recentCard);

  view.append(el('a', { class: 'btn btn--primary', href: '#/workout' }, ['Start a workout']));
  outlet.append(view);
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'field' }, [el('span', {}, [label]), el('strong', {}, [value])]);
}
