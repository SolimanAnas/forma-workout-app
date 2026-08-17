import { ACCESSORY_POOL, GYM_SPLITS, getGymSplit } from '../../domain/gym/splits';
import type { GymDay, GymSlot, SlotOption } from '../../domain/gym/types';
import { el, screen } from '../dom';

/** Gym tab. `#/gym` lists splits; `#/gym/<splitId>` is the slot-based workout builder. */
export function renderGym(outlet: HTMLElement, splitId?: string): void {
  if (splitId) renderSplitDetail(outlet, splitId);
  else renderSplitList(outlet);
}

// ── In-session state (persists across navigation, resets on reload) ──
const selections = new Map<string, string>(); // `${dayId}:${slotId}` → option name
const addedSlots = new Map<string, GymSlot[]>(); // dayId → user-added slots

function selectedOption(dayId: string, slot: GymSlot): SlotOption {
  const chosen = selections.get(`${dayId}:${slot.id}`);
  return slot.options.find((o) => o.name === chosen) ?? slot.options[0];
}
function setSelection(dayId: string, slotId: string, name: string): void {
  selections.set(`${dayId}:${slotId}`, name);
}
function daySlots(day: GymDay): GymSlot[] {
  return [...day.slots, ...(addedSlots.get(day.id) ?? [])];
}

// ── Split list ──
function renderSplitList(outlet: HTMLElement): void {
  const view = screen('Gym', 'Structured gym programs — pick a training split.');
  const grid = el('div', { class: 'gym-grid' });
  for (const split of GYM_SPLITS) {
    grid.append(
      el('a', { class: 'card gym-card', href: `#/gym/${split.id}` }, [
        el('div', { class: 'gym-card__head' }, [
          el('span', { class: 'gym-card__badge' }, [split.short]),
          el('span', { class: 'gym-card__name' }, [split.name]),
          el('span', { class: 'gym-card__chevron', 'aria-hidden': 'true' }, ['›']),
        ]),
        el('div', { class: 'exercise-item__meta' }, [split.description]),
        el('div', { class: 'gym-card__level' }, [split.level]),
        el('div', { class: 'gym-card__days' }, split.days.map((d) => el('span', { class: 'tag' }, [d.name]))),
      ]),
    );
  }
  view.append(grid);
  outlet.append(view);
}

// ── Split detail (builder) ──
function renderSplitDetail(outlet: HTMLElement, splitId: string): void {
  const split = getGymSplit(splitId);
  if (!split) {
    window.location.hash = '#/gym';
    return;
  }

  const view = el('section', { class: 'screen', 'aria-label': split.name });
  view.append(el('a', { class: 'back-link', href: '#/gym' }, ['← All splits']));
  view.append(
    el('div', { class: 'ex-detail__head' }, [
      el('div', { class: 'gym-card__head' }, [
        el('span', { class: 'gym-card__badge' }, [split.short]),
        el('h1', { class: 'ex-hero__name' }, [split.name]),
      ]),
      el('div', { class: 'gym-card__level' }, [split.level]),
    ]),
  );

  const tabs = el('div', { class: 'day-tabs', role: 'tablist', 'aria-label': 'Training day' });
  const container = el('div', { class: 'gym-build' });
  const buttons: HTMLButtonElement[] = [];

  const showDay = (day: GymDay, active: HTMLButtonElement): void => {
    for (const b of buttons) b.setAttribute('aria-pressed', String(b === active));
    renderBuilder(day, container);
  };
  split.days.forEach((day, i) => {
    const btn = el('button', { class: 'day-tab', type: 'button' }, [day.name]) as HTMLButtonElement;
    btn.setAttribute('aria-pressed', String(i === 0));
    btn.addEventListener('click', () => showDay(day, btn));
    buttons.push(btn);
    tabs.append(btn);
  });

  view.append(tabs, container);
  showDay(split.days[0], buttons[0]);
  outlet.append(view);
}

// ── Builder view ──
function renderBuilder(day: GymDay, container: HTMLElement): void {
  const rerender = (): void => renderBuilder(day, container);
  container.replaceChildren();
  container.append(el('div', { class: 'gym-day__focus' }, [day.focus]));

  // Group slots by category, preserving order.
  const groups = new Map<string, GymSlot[]>();
  for (const s of daySlots(day)) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }

  for (const [category, slots] of groups) {
    container.append(el('div', { class: 'gym-cat' }, [category]));
    for (const s of slots) container.append(slotCard(day, s, rerender));
  }

  const addBtn = el('button', { class: 'btn gym-add', type: 'button' }, ['+ Add exercise']);
  addBtn.addEventListener('click', () => {
    const added = addedSlots.get(day.id) ?? [];
    added.push({
      id: `added-${day.id}-${added.length + 1}`,
      category: 'Extra',
      target: 'Accessory',
      sets: '3',
      reps: '10–15',
      options: ACCESSORY_POOL,
    });
    addedSlots.set(day.id, added);
    rerender();
  });

  const startBtn = el('button', { class: 'btn btn--primary', type: 'button' }, ['Start workout']);
  startBtn.addEventListener('click', () => renderSession(day, container));

  container.append(addBtn, startBtn);
}

function slotCard(day: GymDay, s: GymSlot, rerender: () => void): HTMLElement {
  const selected = selectedOption(day.id, s);
  const duplicate = isDuplicateRegion(day, s, selected.region);

  const indicator = duplicate
    ? el('span', { class: 'slot__flag slot__flag--warn', title: 'Overlaps another slot' }, ['⚠'])
    : el('span', { class: 'slot__flag slot__flag--ok', 'aria-hidden': 'true' }, ['✓']);

  const card = el('div', { class: 'card slot' }, [
    el('div', { class: 'slot__head' }, [el('span', { class: 'slot__target' }, [s.target]), indicator]),
    el('div', { class: 'slot__pick' }, [
      el('div', {}, [
        el('div', { class: 'slot__exercise' }, [selected.name]),
        el('div', { class: 'slot__meta' }, [`${selected.region} · ${s.sets} × ${s.reps}`]),
      ]),
    ]),
  ]);

  const changeBtn = el('button', { class: 'slot__change', type: 'button' }, ['Change']);
  card.querySelector('.slot__pick')?.append(changeBtn);

  changeBtn.addEventListener('click', () => {
    const existing = card.querySelector('.slot-picker');
    if (existing) {
      existing.remove();
      changeBtn.setAttribute('aria-expanded', 'false');
      return;
    }
    changeBtn.setAttribute('aria-expanded', 'true');
    card.append(picker(day, s, rerender));
  });

  if (duplicate) {
    card.append(el('div', { class: 'slot__dup-note' }, [`Same region (${selected.region}) as another slot — try a different angle.`]));
  }
  return card;
}

function picker(day: GymDay, s: GymSlot, rerender: () => void): HTMLElement {
  const covered = coveredRegions(day, s);
  const selected = selectedOption(day.id, s);
  const box = el('div', { class: 'slot-picker' });

  if (covered.size > 0) {
    box.append(
      el('div', { class: 'slot-picker__hint' }, [`Already covering: ${[...covered].join(', ')}`]),
    );
  }

  // Uncovered regions first (smart suggestions avoid duplicating what's already trained).
  const sorted = [...s.options].sort(
    (a, b) => (covered.has(a.region) ? 1 : 0) - (covered.has(b.region) ? 1 : 0),
  );
  for (const o of sorted) {
    const isSel = o.name === selected.name;
    const isCov = covered.has(o.region) && !isSel;
    const btn = el('button', { class: `opt${isSel ? ' is-sel' : ''}${isCov ? ' is-covered' : ''}`, type: 'button' }, [
      el('span', { class: 'opt__name' }, [o.name]),
      el('span', { class: 'opt__region' }, [isCov ? `${o.region} · already covered` : o.region]),
    ]);
    btn.addEventListener('click', () => {
      setSelection(day.id, s.id, o.name);
      rerender();
    });
    box.append(btn);
  }
  return box;
}

/** Regions selected in OTHER slots of the same category. */
function coveredRegions(day: GymDay, slot: GymSlot): Set<string> {
  const set = new Set<string>();
  for (const other of daySlots(day)) {
    if (other.category === slot.category && other.id !== slot.id) {
      set.add(selectedOption(day.id, other).region);
    }
  }
  return set;
}

function isDuplicateRegion(day: GymDay, slot: GymSlot, region: string): boolean {
  return coveredRegions(day, slot).has(region);
}

// ── Session view (checklist) ──
function renderSession(day: GymDay, container: HTMLElement): void {
  container.replaceChildren();

  const back = el('button', { class: 'slot__change', type: 'button' }, ['← Edit workout']);
  back.addEventListener('click', () => renderBuilder(day, container));
  container.append(el('div', { class: 'gym-session__bar' }, [back, el('span', { class: 'gym-day__focus' }, ['Session'])]));

  const groups = new Map<string, GymSlot[]>();
  for (const s of daySlots(day)) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }

  let total = 0;
  const done = new Set<string>();
  const counter = el('div', { class: 'gym-day__focus' }, ['0 done']);

  for (const [category, slots] of groups) {
    const card = el('div', { class: 'card' }, [el('div', { class: 'gym-cat' }, [category])]);
    for (const s of slots) {
      total++;
      const selected = selectedOption(day.id, s);
      const row = el('label', { class: 'gym-check' }, [
        (() => {
          const cb = el('input', { type: 'checkbox' }) as HTMLInputElement;
          cb.addEventListener('change', () => {
            if (cb.checked) done.add(s.id);
            else done.delete(s.id);
            row.classList.toggle('is-done', cb.checked);
            counter.textContent = `${done.size} / ${total} done`;
          });
          return cb;
        })(),
        el('div', { class: 'gym-check__body' }, [
          el('div', { class: 'slot__exercise' }, [selected.name]),
          el('div', { class: 'slot__meta' }, [`${s.sets} × ${s.reps}`]),
        ]),
      ]);
      card.append(row);
    }
    container.append(card);
  }

  const finish = el('button', { class: 'btn btn--primary', type: 'button' }, ['Finish workout']);
  finish.addEventListener('click', () => renderBuilder(day, container));
  container.append(counter, finish);
}
