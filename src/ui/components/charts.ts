import { el } from '../dom';

/**
 * Lightweight, animated SVG/CSS charts on the app's design tokens (no chart library).
 * Entrance animations are CSS-driven and respect prefers-reduced-motion via app.css.
 */

/** Circular progress ring (e.g. XP toward the next level). Animates its fill on mount. */
export function levelRing(pct: number, centerTop: string, centerBottom: string): HTMLElement {
  const p = Math.max(0, Math.min(1, Number.isFinite(pct) ? pct : 0));
  const r = 52;
  const c = 2 * Math.PI * r;

  const wrap = el('div', { class: 'ring' });
  wrap.innerHTML = `
    <svg viewBox="0 0 120 120" class="ring__svg" role="img" aria-label="Progress ${Math.round(p * 100)} percent">
      <circle cx="60" cy="60" r="${r}" class="ring__track"></circle>
      <circle cx="60" cy="60" r="${r}" class="ring__value"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}"></circle>
    </svg>
    <div class="ring__center">
      <div class="ring__top"></div>
      <div class="ring__bottom"></div>
    </div>`;
  // Set text content safely (no HTML injection).
  wrap.querySelector('.ring__top')!.textContent = centerTop;
  wrap.querySelector('.ring__bottom')!.textContent = centerBottom;

  const value = wrap.querySelector<SVGCircleElement>('.ring__value');
  if (value) {
    requestAnimationFrame(() => {
      value.style.strokeDashoffset = String(c * (1 - p));
    });
  }
  return wrap;
}

/** Vertical bar chart with day labels; bars grow from 0 on mount. */
export function weekBars(week: { label: string; reps: number; active: boolean }[]): HTMLElement {
  const max = Math.max(1, ...week.map((d) => d.reps));
  const bars = el('div', { class: 'chart__bars' });

  week.forEach((d, i) => {
    const fill = el('div', { class: 'chart__bar' });
    fill.style.height = '0%';
    fill.style.transitionDelay = `${i * 0.05}s`;
    if (d.active) fill.classList.add('is-active');
    const targetPct = d.reps > 0 ? Math.max(8, Math.round((d.reps / max) * 100)) : 2;
    requestAnimationFrame(() => {
      fill.style.height = `${targetPct}%`;
    });

    bars.append(
      el('div', { class: 'chart__col' }, [
        el('div', { class: 'chart__value' }, [d.reps > 0 ? String(d.reps) : '']),
        el('div', { class: 'chart__bar-track' }, [fill]),
        el('div', { class: 'chart__label' }, [d.label]),
      ]),
    );
  });

  return el('div', { class: 'chart' }, [bars]);
}

/** Streak flame + a 7-day dot strip (which recent days had a workout), lighting up staggered. */
export function streakStrip(days: boolean[], streak: number): HTMLElement {
  const dots = el('div', { class: 'streak__dots' });
  days.forEach((active, i) => {
    const dot = el('span', { class: `streak__dot${active ? ' is-active' : ''}` });
    dot.style.animationDelay = `${i * 0.06}s`;
    dots.append(dot);
  });

  return el('div', { class: 'streak' }, [
    el('div', { class: 'streak__main' }, [
      el('div', { class: 'streak__flame' }, [streak > 0 ? '🔥' : '💤']),
      el('div', {}, [
        el('div', { class: 'streak__num' }, [String(streak)]),
        el('div', { class: 'streak__label' }, ['day streak']),
      ]),
    ]),
    dots,
  ]);
}
