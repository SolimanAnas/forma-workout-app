import { getDB } from './db';
import type { CalendarEventRecord } from './schema';

/** Scheduled-workout calendar persistence (local-first). */

export type CalendarEvent = CalendarEventRecord;

export async function addCalendarEvent(
  event: Omit<CalendarEvent, 'id' | 'createdAt'>,
): Promise<CalendarEvent> {
  const db = await getDB();
  const record: CalendarEvent = {
    ...event,
    id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  await db.put('calendarEvents', record);
  return record;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('calendarEvents', id);
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const db = await getDB();
  return db.getAll('calendarEvents');
}

/** Events for a single day (YYYY-MM-DD), sorted by time (all-day first). */
export async function eventsForDate(date: string): Promise<CalendarEvent[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('calendarEvents', 'by-date', date);
  return events.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

/** Events within a month, keyed by date string, for grid rendering. */
export async function eventsByDateInRange(
  startDate: string,
  endDate: string,
): Promise<Map<string, CalendarEvent[]>> {
  const db = await getDB();
  const range = IDBKeyRange.bound(startDate, endDate);
  const events = await db.getAllFromIndex('calendarEvents', 'by-date', range);
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}
