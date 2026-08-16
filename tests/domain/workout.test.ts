import { describe, expect, it } from 'vitest';
import { RestTimer } from '../../src/domain/workout/rest-timer';
import { FreeRepsEngine } from '../../src/domain/workout/free-reps';
import { SetsEngine } from '../../src/domain/workout/sets';
import { AmrapEngine } from '../../src/domain/workout/amrap';
import { EmomEngine } from '../../src/domain/workout/emom';
import { CircuitEngine } from '../../src/domain/workout/circuit';

describe('RestTimer', () => {
  it('counts down and completes', () => {
    const t = new RestTimer();
    t.start(0, 1000);
    expect(t.remaining(400)).toBe(600);
    expect(t.isDone(999)).toBe(false);
    expect(t.isDone(1000)).toBe(true);
  });

  it('supports +30s, skip, pause/resume', () => {
    const t = new RestTimer();
    t.start(0, 1000);
    t.addTime(500);
    expect(t.remaining(0)).toBe(1500);

    t.pause(500); // 1000 left
    expect(t.remaining(9999)).toBe(1000); // frozen while paused
    t.resume(2000);
    expect(t.remaining(2000)).toBe(1000);

    t.skip(2500);
    expect(t.isDone(2500)).toBe(true);
  });
});

describe('FreeRepsEngine', () => {
  it('counts freely and finishes at a target', () => {
    const e = new FreeRepsEngine({ exerciseId: 'pushup', targetReps: 3 });
    e.start(0);
    e.registerRep(1);
    e.registerRep(2);
    expect(e.finished).toBe(false);
    e.registerRep(3);
    expect(e.finished).toBe(true);
    expect(e.result().totalReps).toBe(3);
  });

  it('finishes at a time limit', () => {
    const e = new FreeRepsEngine({ exerciseId: 'pushup', timeLimitMs: 1000 });
    e.start(0);
    e.registerRep(500);
    e.tick(1000);
    expect(e.finished).toBe(true);
  });
});

describe('SetsEngine (3 × 2 acceptance path)', () => {
  it('advances sets automatically with rest between, no manual increment', () => {
    const e = new SetsEngine({ exerciseId: 'pushup', sets: 3, reps: 2, restMs: 1000 });
    e.start(0);

    // Set 1
    e.registerRep(10);
    e.registerRep(20); // set complete → rest
    expect(e.snapshot(20).phase).toBe('RESTING');

    e.tick(1020); // rest done → set 2
    expect(e.snapshot(1020).phase).toBe('ACTIVE_SET');
    expect(e.snapshot(1020).detail).toContain('Set 2 of 3');

    // Set 2
    e.registerRep(1030);
    e.registerRep(1040);
    e.tick(2040); // rest done → set 3

    // Set 3 (final) → done, no rest after
    e.registerRep(2050);
    e.registerRep(2060);
    expect(e.finished).toBe(true);
    expect(e.result().totalReps).toBe(6);
  });

  it('skip rest advances immediately', () => {
    const e = new SetsEngine({ exerciseId: 'squat', sets: 2, reps: 1, restMs: 60000 });
    e.start(0);
    e.registerRep(10); // → rest
    e.skipRest(20);
    e.tick(20);
    expect(e.snapshot(20).phase).toBe('ACTIVE_SET');
  });
});

describe('AmrapEngine', () => {
  it('counts reps until time expires', () => {
    const e = new AmrapEngine({ durationMs: 1000, repsPerRound: 5 });
    e.start(0);
    for (let i = 1; i <= 10; i++) e.registerRep(i * 50); // 10 reps within 500ms
    e.tick(1000);
    expect(e.finished).toBe(true);
    expect(e.result().totalReps).toBe(10);
    expect(e.result().detail.rounds).toBe(2);
  });
});

describe('EmomEngine', () => {
  it('scores each window and finishes after the last minute', () => {
    const e = new EmomEngine({ minutes: 2, repsPerMinute: 3, windowMs: 1000 });
    e.start(0);
    // Minute 1: 3 reps (success)
    e.registerRep(100);
    e.registerRep(200);
    e.registerRep(300);
    e.tick(1000); // close minute 1 → minute 2
    // Minute 2: 2 reps (fail)
    e.registerRep(1100);
    e.registerRep(1200);
    e.tick(2000); // close minute 2 → done
    expect(e.finished).toBe(true);
    expect(e.result().detail.successes).toBe(1);
    expect(e.result().totalReps).toBe(5);
  });
});

describe('CircuitEngine', () => {
  it('advances through mixed rep + duration stations', () => {
    const e = new CircuitEngine({
      stations: [
        { exerciseId: 'pushup', reps: 2 },
        { exerciseId: 'plank', durationMs: 1000 },
      ],
      rounds: 1,
    });
    e.start(0);
    e.registerRep(10);
    e.registerRep(20); // station 1 done → station 2 (plank)
    expect(e.snapshot(20).detail).toContain('plank');
    e.tick(1020); // plank duration elapsed → last station of last round → done
    expect(e.finished).toBe(true);
    expect(e.result().totalReps).toBe(2);
  });

  it('rejects an empty circuit', () => {
    expect(() => new CircuitEngine({ stations: [] })).toThrow();
  });
});
