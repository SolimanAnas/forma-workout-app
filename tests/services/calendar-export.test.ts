import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, toICS } from '../../src/services/calendar-export';
import type { CalendarEvent } from '../../src/data/calendar';

function ev(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'cal_1',
    date: '2026-08-20',
    title: 'Push workout',
    kind: 'gym',
    createdAt: Date.UTC(2026, 7, 19, 10, 30, 0),
    ...overrides,
  };
}

describe('googleCalendarUrl', () => {
  it('builds an all-day TEMPLATE link spanning to the next day', () => {
    const url = new URL(googleCalendarUrl(ev()));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Push workout');
    expect(url.searchParams.get('dates')).toBe('20260820/20260821');
  });

  it('builds a one-hour timed range when a time is set', () => {
    const url = new URL(googleCalendarUrl(ev({ time: '18:30' })));
    expect(url.searchParams.get('dates')).toBe('20260820T183000/20260820T193000');
  });

  it('wraps 23:xx timed events to hour 00 for the end', () => {
    const url = new URL(googleCalendarUrl(ev({ time: '23:15' })));
    expect(url.searchParams.get('dates')).toBe('20260820T231500/20260820T001500');
  });

  it('includes notes as details when present', () => {
    const url = new URL(googleCalendarUrl(ev({ notes: 'Heavy day' })));
    expect(url.searchParams.get('details')).toBe('Heavy day');
  });
});

describe('toICS', () => {
  it('emits a VCALENDAR with a VEVENT per event', () => {
    const ics = toICS([ev(), ev({ id: 'cal_2', title: 'Rest', kind: 'rest' })]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:cal_1@forma');
    expect(ics).toContain('SUMMARY:Push workout');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260820');
    expect(ics).toContain('DTEND;VALUE=DATE:20260821');
  });

  it('uses timed DTSTART/DTEND for timed events', () => {
    const ics = toICS([ev({ time: '18:30' })]);
    expect(ics).toContain('DTSTART:20260820T183000');
    expect(ics).toContain('DTEND:20260820T193000');
  });

  it('escapes commas, semicolons and newlines in text', () => {
    const ics = toICS([ev({ title: 'Push, Pull; Legs', notes: 'line1\nline2' })]);
    expect(ics).toContain('SUMMARY:Push\\, Pull\\; Legs');
    expect(ics).toContain('DESCRIPTION:line1\\nline2');
  });

  it('uses CRLF line endings', () => {
    expect(toICS([ev()])).toContain('\r\n');
  });
});
