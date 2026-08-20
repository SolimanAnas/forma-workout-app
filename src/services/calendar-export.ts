import type { CalendarEvent } from '../data/calendar';

/**
 * Export helpers so workouts can go into Google Calendar (or Apple/Outlook) without a backend:
 *  - `googleCalendarUrl` opens a pre-filled Google Calendar "add event" page (one tap, no login).
 *  - `toICS` builds a standard .ics file the user can import anywhere.
 * PURE string builders.
 */

const ymd = (date: string): string => date.replace(/-/g, '');

function nextDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return ymd(next.toISOString().slice(0, 10));
}

function timedRange(date: string, time: string): { start: string; end: string } {
  const [h, m] = time.split(':');
  const endH = String((Number(h) + 1) % 24).padStart(2, '0');
  return { start: `${ymd(date)}T${h}${m}00`, end: `${ymd(date)}T${endH}${m}00` };
}

/** A Google Calendar "add event" URL, pre-filled from the workout. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title });
  if (e.time) {
    const { start, end } = timedRange(e.date, e.time);
    params.set('dates', `${start}/${end}`);
  } else {
    params.set('dates', `${ymd(e.date)}/${nextDay(e.date)}`);
  }
  if (e.notes) params.set('details', e.notes);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function dtStamp(ms: number): string {
  return `${new Date(ms).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** A complete .ics calendar for the given events. */
export function toICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forma//Workout Calendar//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@forma`, `DTSTAMP:${dtStamp(e.createdAt)}`);
    if (e.time) {
      const { start, end } = timedRange(e.date, e.time);
      lines.push(`DTSTART:${start}`, `DTEND:${end}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${nextDay(e.date)}`);
    }
    lines.push(`SUMMARY:${escapeICS(e.title)}`);
    if (e.notes) lines.push(`DESCRIPTION:${escapeICS(e.notes)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
