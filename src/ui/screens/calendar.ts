import {
  addCalendarEvent,
  deleteCalendarEvent,
  eventsByDateInRange,
  eventsForDate,
  listCalendarEvents,
  type CalendarEvent,
} from '../../data/calendar';
import { googleCalendarUrl, toICS } from '../../services/calendar-export';
import { el, screen } from '../dom';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const QUICK: { label: string; kind: string }[] = [
  { label: 'Push', kind: 'gym' },
  { label: 'Pull', kind: 'gym' },
  { label: 'Legs', kind: 'gym' },
  { label: 'Upper', kind: 'gym' },
  { label: 'Lower', kind: 'gym' },
  { label: 'Full Body', kind: 'gym' },
  { label: 'Cardio', kind: 'bodyweight' },
  { label: 'Rest', kind: 'rest' },
];

const pad = (n: number): string => String(n).padStart(2, '0');
const isoLocal = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export async function renderCalendar(outlet: HTMLElement): Promise<void> {
  const view = screen('Calendar', 'Plan and track your workouts.');
  const root = el('div', { class: 'cal' });
  view.append(root);
  outlet.append(view);

  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let selected = isoLocal(today);
  let addingKind = 'custom';

  const paint = async (): Promise<void> => {
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 41);
    const [eventsMap, dayEvents] = await Promise.all([
      eventsByDateInRange(isoLocal(gridStart), isoLocal(gridEnd)),
      eventsForDate(selected),
    ]);

    root.replaceChildren(
      monthHeader(),
      weekdayRow(),
      monthGrid(gridStart, eventsMap),
      dayPanel(dayEvents),
      syncBar(),
    );
  };

  // ── Month header ──
  function monthHeader(): HTMLElement {
    const prev = navBtn('‹', () => {
      month--;
      if (month < 0) { month = 11; year--; }
      void paint();
    });
    const next = navBtn('›', () => {
      month++;
      if (month > 11) { month = 0; year++; }
      void paint();
    });
    const todayBtn = el('button', { class: 'cal-today', type: 'button' }, ['Today']);
    todayBtn.addEventListener('click', () => {
      const t = new Date();
      year = t.getFullYear();
      month = t.getMonth();
      selected = isoLocal(t);
      void paint();
    });
    return el('div', { class: 'cal-head' }, [
      prev,
      el('div', { class: 'cal-title' }, [`${MONTHS[month]} ${year}`]),
      next,
      todayBtn,
    ]);
  }

  function weekdayRow(): HTMLElement {
    return el(
      'div',
      { class: 'cal-week' },
      WEEKDAYS.map((d) => el('div', { class: 'cal-wd' }, [d.slice(0, 1)])),
    );
  }

  function monthGrid(gridStart: Date, map: Map<string, CalendarEvent[]>): HTMLElement {
    const grid = el('div', { class: 'cal-grid' });
    const todayStr = isoLocal(new Date());
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const ds = isoLocal(d);
      const inMonth = d.getMonth() === month;
      const count = map.get(ds)?.length ?? 0;
      const cell = el('button', {
        class: `cal-cell${inMonth ? '' : ' is-out'}${ds === selected ? ' is-selected' : ''}${ds === todayStr ? ' is-today' : ''}`,
        type: 'button',
      }, [
        el('span', { class: 'cal-num' }, [String(d.getDate())]),
        count > 0
          ? el('span', { class: 'cal-dots' }, Array.from({ length: Math.min(count, 3) }, () => el('span', { class: 'cal-dot' })))
          : el('span', {}),
      ]);
      cell.addEventListener('click', () => {
        selected = ds;
        if (!inMonth) { year = d.getFullYear(); month = d.getMonth(); }
        void paint();
      });
      grid.append(cell);
    }
    return grid;
  }

  // ── Day panel ──
  function dayPanel(events: CalendarEvent[]): HTMLElement {
    const d = new Date(`${selected}T00:00:00`);
    const heading = `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
    const panel = el('div', { class: 'card cal-day' }, [el('div', { class: 'eyebrow' }, [heading])]);

    if (events.length === 0) {
      panel.append(el('div', { class: 'exercise-item__meta' }, ['No workouts planned.']));
    }
    for (const e of events) {
      panel.append(eventRow(e));
    }
    panel.append(addForm());
    return panel;
  }

  function eventRow(e: CalendarEvent): HTMLElement {
    const gcal = el('a', { class: 'cal-ev__act', href: googleCalendarUrl(e), target: '_blank', rel: 'noopener noreferrer', title: 'Add to Google Calendar' }, ['📅']);
    const del = el('button', { class: 'cal-ev__act', type: 'button', 'aria-label': 'Delete' }, ['✕']);
    del.addEventListener('click', async () => {
      await deleteCalendarEvent(e.id);
      void paint();
    });
    return el('div', { class: `cal-ev cal-ev--${e.kind}` }, [
      el('span', { class: 'cal-ev__time' }, [e.time || 'All-day']),
      el('div', { class: 'cal-ev__body' }, [
        el('div', { class: 'cal-ev__title' }, [e.title]),
        ...(e.notes ? [el('div', { class: 'cal-ev__notes' }, [e.notes])] : []),
      ]),
      gcal,
      del,
    ]);
  }

  function addForm(): HTMLElement {
    const title = el('input', { type: 'text', placeholder: 'Workout title', 'aria-label': 'Workout title' }) as HTMLInputElement;
    const time = el('input', { type: 'time', 'aria-label': 'Time (optional)' }) as HTMLInputElement;
    const notes = el('input', { type: 'text', placeholder: 'Notes (optional)', 'aria-label': 'Notes' }) as HTMLInputElement;

    const chips = el('div', { class: 'cal-chips' });
    for (const q of QUICK) {
      const chip = el('button', { class: 'chip cal-chip', type: 'button' }, [q.label]);
      chip.addEventListener('click', () => {
        title.value = q.label === 'Rest' ? 'Rest day' : `${q.label} workout`;
        addingKind = q.kind;
      });
      chips.append(chip);
    }

    const save = el('button', { class: 'btn btn--primary', type: 'button' }, ['+ Add workout']);
    save.addEventListener('click', async () => {
      const t = title.value.trim();
      if (!t) { title.focus(); return; }
      await addCalendarEvent({ date: selected, time: time.value || undefined, title: t, kind: addingKind, notes: notes.value.trim() || undefined });
      addingKind = 'custom';
      void paint();
    });

    return el('div', { class: 'cal-add' }, [chips, title, el('div', { class: 'cal-add__row' }, [time, notes]), save]);
  }

  // ── Sync bar ──
  function syncBar(): HTMLElement {
    const exportBtn = el('button', { class: 'btn', type: 'button' }, ['⬇ Export all (.ics)']);
    exportBtn.addEventListener('click', async () => {
      const all = await listCalendarEvents();
      if (all.length === 0) return;
      download('forma-workouts.ics', toICS(all), 'text/calendar');
    });
    return el('div', { class: 'card' }, [
      el('div', { class: 'eyebrow' }, ['Sync with Google Calendar']),
      el('div', { class: 'exercise-item__meta' }, [
        'Tap 📅 on any workout to add it to Google Calendar, or export everything as an .ics file to import into Google / Apple / Outlook.',
      ]),
      exportBtn,
    ]);
  }

  await paint();
}

function navBtn(label: string, onClick: () => void): HTMLElement {
  const b = el('button', { class: 'cal-nav', type: 'button' }, [label]);
  b.addEventListener('click', onClick);
  return b;
}

function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
