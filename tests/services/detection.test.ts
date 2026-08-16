import { describe, expect, it } from 'vitest';
import { analyzePlank, analyzeReps, calibrateAxis } from '../../src/services/detection';
import { getDetectionProfile } from '../../src/domain/exercise/detection-profiles';
import type { DetectionProfile } from '../../src/domain/exercise/detection-profiles';
import type { SensorRecording } from '../../src/sensors/replay/recording';
import pushup from '../fixtures/recordings/pushup.synthetic.json';
import squat from '../fixtures/recordings/squat.synthetic.json';
import situp from '../fixtures/recordings/situp.synthetic.json';
import jumpingJack from '../fixtures/recordings/jumping-jack.synthetic.json';
import plank from '../fixtures/recordings/plank.synthetic.json';

const FIXTURES = {
  pushup: pushup as SensorRecording,
  squat: squat as SensorRecording,
  situp: situp as SensorRecording,
  'jumping-jack': jumpingJack as SensorRecording,
};

// Each synthetic fixture encodes exactly 5 movement cycles.
const EXPECTED_REPS = 5;

describe('rep detection against committed fixtures', () => {
  for (const [id, recording] of Object.entries(FIXTURES)) {
    it(`${id}: counts the exact number of synthetic reps`, () => {
      const profile = getDetectionProfile(id) as DetectionProfile;
      const { validCount } = analyzeReps(profile, recording.samples);
      expect(validCount).toBe(EXPECTED_REPS);
    });
  }

  it('is deterministic (same recording → same count)', () => {
    const profile = getDetectionProfile('pushup') as DetectionProfile;
    const a = analyzeReps(profile, (pushup as SensorRecording).samples).validCount;
    const b = analyzeReps(profile, (pushup as SensorRecording).samples).validCount;
    expect(a).toBe(b);
  });
});

describe('calibration derives the resting baseline', () => {
  it('recovers ~9.81 on the push-up vertical axis', () => {
    const profile = getDetectionProfile('pushup') as DetectionProfile;
    const { baseline } = calibrateAxis(profile, (pushup as SensorRecording).samples);
    expect(baseline).toBeCloseTo(9.81, 0);
  });
});

describe('plank analysis (duration-based, no rep counting)', () => {
  it('measures a positive hold duration and does not count reps', () => {
    const rec = plank as SensorRecording;
    const profile = getDetectionProfile('plank') as DetectionProfile;

    const plankResult = analyzePlank(rec.samples);
    expect(plankResult.durationMs).toBeGreaterThan(0);
    expect(plankResult.stability).toBeGreaterThan(80);
    expect(plankResult.excessiveMovement).toBe(false);

    // A near-static hold must not register as reps.
    expect(analyzeReps(profile, rec.samples).validCount).toBe(0);
  });
});
