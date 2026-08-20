import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { _resetDbForTests } from '../../src/data/db';
import { DB_NAME } from '../../src/data/schema';
import {
  addCalendarEvent,
  deleteCalendarEvent,
  eventsByDateInRange,
  eventsForDate,
  listCalendarEvents,
} from '../../src/data/calendar';

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
});

describe('calendar repository', () => {
  it('adds an event with a generated id and createdAt', async () => {
    const saved = await addCalendarEvent({ date: '2026-08-20', title: 'Push', kind: 'gym' });
    expect(saved.id).toMatch(/^cal_/);
    expect(saved.createdAt).toBeGreaterThan(0);
    const all = await listCalendarEvents();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Push');
  });

  it('deletes an event by id', async () => {
    const saved = await addCalendarEvent({ date: '2026-08-20', title: 'Pull', kind: 'gym' });
    await deleteCalendarEvent(saved.id);
    expect(await listCalendarEvents()).toHaveLength(0);
  });

  it('returns a day sorted by time, all-day events first', async () => {
    await addCalendarEvent({ date: '2026-08-20', title: 'Evening', kind: 'gym', time: '18:00' });
    await addCalendarEvent({ date: '2026-08-20', title: 'Morning', kind: 'gym', time: '07:00' });
    await addCalendarEvent({ date: '2026-08-20', title: 'Anytime', kind: 'rest' });
    await addCalendarEvent({ date: '2026-08-21', title: 'Other day', kind: 'gym' });

    const day = await eventsForDate('2026-08-20');
    expect(day.map((e) => e.title)).toEqual(['Anytime', 'Morning', 'Evening']);
  });

  it('groups events by date within a range and excludes out-of-range dates', async () => {
    await addCalendarEvent({ date: '2026-08-19', title: 'Before', kind: 'gym' });
    await addCalendarEvent({ date: '2026-08-20', title: 'A', kind: 'gym' });
    await addCalendarEvent({ date: '2026-08-20', title: 'B', kind: 'rest' });
    await addCalendarEvent({ date: '2026-08-25', title: 'C', kind: 'gym' });
    await addCalendarEvent({ date: '2026-09-01', title: 'After', kind: 'gym' });

    const map = await eventsByDateInRange('2026-08-20', '2026-08-31');
    expect(map.get('2026-08-20')).toHaveLength(2);
    expect(map.get('2026-08-25')).toHaveLength(1);
    expect(map.has('2026-08-19')).toBe(false);
    expect(map.has('2026-09-01')).toBe(false);
  });
});
