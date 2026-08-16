import { describe, expect, it } from 'vitest';
import { ReplayPlayer } from '../../src/sensors/replay/player';
import type { SensorRecording } from '../../src/sensors/replay/recording';
import type { SensorSample } from '../../src/sensors/types';
import pushup from '../fixtures/recordings/pushup.synthetic.json';
import squat from '../fixtures/recordings/squat.synthetic.json';
import situp from '../fixtures/recordings/situp.synthetic.json';
import jumpingJack from '../fixtures/recordings/jumping-jack.synthetic.json';
import plank from '../fixtures/recordings/plank.synthetic.json';

const FIXTURES = { pushup, squat, situp, 'jumping-jack': jumpingJack, plank } as Record<
  string,
  SensorRecording
>;

describe('committed sensor fixtures', () => {
  it('has one fixture per MVP exercise', () => {
    expect(Object.keys(FIXTURES).sort()).toEqual(
      ['jumping-jack', 'plank', 'pushup', 'situp', 'squat'].sort(),
    );
  });

  for (const [exercise, recording] of Object.entries(FIXTURES)) {
    it(`${exercise}: replays deterministically through the engine`, () => {
      expect(recording.exerciseId).toBe(exercise);
      expect(recording.samples.length).toBe(recording.sampleCount);

      const replay = (): SensorSample[] => {
        const out: SensorSample[] = [];
        new ReplayPlayer(recording).play({ onSample: (s) => out.push(s) });
        return out;
      };

      const first = replay();
      expect(first).toHaveLength(recording.sampleCount);
      // A replayed fixture must produce the same stream every time (spec §39).
      expect(replay()).toEqual(first);
    });
  }
});
