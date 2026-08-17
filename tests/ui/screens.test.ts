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
import { EXERCISE_DEFINITIONS } from '../../src/domain/exercise/definitions';

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

  it('Workout renders exercise buttons + a mode control + start (no combo box)', () => {
    const o = outlet();
    renderWorkout(o);
    expect(o.querySelectorAll('select')).toHaveLength(0); // exercises are buttons, not a dropdown
    expect(o.querySelectorAll('.pick-btn')).toHaveLength(EXERCISE_DEFINITIONS.length);
    expect(o.querySelector('.pick-btn[aria-pressed="true"]')).not.toBeNull();
    expect(o.querySelectorAll('.segmented__btn')).toHaveLength(3);
    expect(o.querySelector('button.btn--primary')?.textContent).toContain('Start');
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

  it('Profile renders settings controls (async)', async () => {
    const o = outlet();
    await renderProfile(o);
    expect(o.querySelectorAll('select')).toHaveLength(2); // theme + units
    expect(o.querySelector('.disclaimer')).not.toBeNull();
  });

  it('Sensor diagnostics renders honest capability badges + detection mode', () => {
    const o = outlet();
    renderSensorDiag(o);
    expect(o.textContent).toContain('Detection mode');
    // Under jsdom (no motion APIs) every sensor is honestly Unsupported.
    expect(o.querySelectorAll('.badge').length).toBeGreaterThan(0);
    expect(o.textContent).toContain('Unsupported');
  });
});
