import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/data/schema';
import { _resetDbForTests } from '../../src/data/db';
import { renderHome } from '../../src/ui/screens/home';
import { renderWorkout } from '../../src/ui/screens/workout';
import { renderExercises } from '../../src/ui/screens/exercises';
import { renderProgress } from '../../src/ui/screens/progress';
import { renderProfile } from '../../src/ui/screens/profile';
import { renderSensorDiag } from '../../src/ui/screens/sensor-diag';
import { renderGym } from '../../src/ui/screens/gym';
import { EXERCISE_DEFINITIONS } from '../../src/domain/exercise/definitions';
import { GYM_SPLITS } from '../../src/domain/gym/splits';

function outlet(): HTMLElement {
  const el = document.createElement('main');
  document.body.replaceChildren(el);
  return el;
}

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
});

describe('screen render smoke tests (jsdom)', () => {
  it('Home renders a title and a start action', async () => {
    const o = outlet();
    await renderHome(o);
    expect(o.querySelector('.screen__title')?.textContent).toBe('Today');
    expect(o.querySelector('a.btn--primary')?.getAttribute('href')).toBe('#/workout');
  });

  it('Workout renders an exercise picker whose buttons link to detail pages (no combo box)', () => {
    const o = outlet();
    renderWorkout(o);
    expect(o.querySelectorAll('select')).toHaveLength(0); // exercises are buttons, not a dropdown
    const picks = o.querySelectorAll<HTMLAnchorElement>('a.pick-btn');
    expect(picks).toHaveLength(EXERCISE_DEFINITIONS.length);
    expect(picks[0].getAttribute('href')).toBe(`#/exercise/${EXERCISE_DEFINITIONS[0].id}`);
    // Mode + Start moved to the detail page.
    expect(o.querySelector('.segmented__btn')).toBeNull();
    expect(o.querySelector('button.btn--primary')).toBeNull();
  });

  it('Exercises lists every MVP exercise from data', () => {
    const o = outlet();
    renderExercises(o);
    expect(o.querySelectorAll('.exercise-list .card')).toHaveLength(EXERCISE_DEFINITIONS.length);
    expect(o.textContent).toContain('Push-up');
  });

  it('Progress renders without throwing', async () => {
    const o = outlet();
    await renderProgress(o);
    expect(o.querySelector('.screen__title')?.textContent).toBe('Progress');
  });

  it('Gym lists splits, each linking to its detail page', () => {
    const o = outlet();
    renderGym(o);
    expect(o.querySelectorAll('a.gym-card')).toHaveLength(GYM_SPLITS.length);
    expect(o.querySelector('a.gym-card')?.getAttribute('href')).toBe(`#/gym/${GYM_SPLITS[0].id}`);
  });

  it('Gym split detail renders day tabs and exercise cards with variations', () => {
    const o = outlet();
    renderGym(o, 'ppl');
    expect(o.querySelectorAll('.day-tab')).toHaveLength(3); // Push / Pull / Legs
    expect(o.querySelectorAll('.gym-ex').length).toBeGreaterThan(0);
    expect(o.querySelector('.gym-ex__sets')).not.toBeNull();
    expect(o.querySelector('.chip')).not.toBeNull(); // variations
  });

  it('Profile renders settings controls (async)', async () => {
    const o = outlet();
    await renderProfile(o);
    expect(o.querySelectorAll('select')).toHaveLength(2); // theme + units
    expect(o.querySelector('.disclaimer')).not.toBeNull();
  });

  it('Sensor diagnostics renders capability badges, detection mode, and the tuning recorder', () => {
    const o = outlet();
    renderSensorDiag(o);
    expect(o.textContent).toContain('Detection mode');
    // Under jsdom (no motion APIs) every sensor is honestly Unsupported.
    expect(o.querySelectorAll('.badge').length).toBeGreaterThan(0);
    expect(o.textContent).toContain('Unsupported');
    // Tuning recorder: exercise select + a Record button.
    expect(o.querySelector('select[aria-label="Exercise to record"]')).not.toBeNull();
    expect([...o.querySelectorAll('button')].some((b) => b.textContent?.includes('Record'))).toBe(true);
  });
});
