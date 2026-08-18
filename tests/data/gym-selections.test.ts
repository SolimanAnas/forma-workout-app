import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/data/schema';
import { _resetDbForTests } from '../../src/data/db';
import {
  clearGymSelections,
  loadGymSelections,
  saveGymSelection,
} from '../../src/data/gym-selections';

beforeEach(async () => {
  await _resetDbForTests();
  await deleteDB(DB_NAME);
});

describe('gym selection persistence', () => {
  it('saves and reloads split-scoped choices', async () => {
    expect(await loadGymSelections()).toEqual({});

    await saveGymSelection('ppl:push:push-chest-primary', 'Dumbbell Bench Press');
    await saveGymSelection('ppl:push:push-chest-iso', 'Cable Fly');

    const map = await loadGymSelections();
    expect(map['ppl:push:push-chest-primary']).toBe('Dumbbell Bench Press');
    expect(map['ppl:push:push-chest-iso']).toBe('Cable Fly');
  });

  it('keeps choices in different splits independent', async () => {
    await saveGymSelection('ppl:legs:legs-squat', 'Front Squat');
    await saveGymSelection('bro-split:legs:bro-legs-squat', 'Hack Squat');
    const map = await loadGymSelections();
    expect(map['ppl:legs:legs-squat']).toBe('Front Squat');
    expect(map['bro-split:legs:bro-legs-squat']).toBe('Hack Squat');
  });

  it('resets only the matching prefix', async () => {
    await saveGymSelection('ppl:push:push-chest-primary', 'Bench Press');
    await saveGymSelection('ppl:pull:pull-vert', 'Chin-up');

    await clearGymSelections('ppl:push:');
    const map = await loadGymSelections();
    expect(map['ppl:push:push-chest-primary']).toBeUndefined();
    expect(map['ppl:pull:pull-vert']).toBe('Chin-up'); // untouched
  });
});
