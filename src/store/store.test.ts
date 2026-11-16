import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Level, LevelManifest } from '../game/level';
import { decodePack } from '../game/packs';
import { createGameStore } from './game';
import { defaultSave, memorySaveProvider, migrate, readSave, SAVE_VERSION } from './save';

const DIR = join(__dirname, '..', '..', 'assets', 'levels');
const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as LevelManifest;
const pack = decodePack(new Uint8Array(readFileSync(join(DIR, 'pack_0001.json.gz'))), manifest, 1);
const loadLevel = async (id: number): Promise<Level> => {
  const l = pack.levels.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
};

describe('save', () => {
  it('migrates unknown data to a fresh save', () => {
    expect(migrate(null)).toEqual(defaultSave());
    expect(migrate({ saveVersion: 0 })).toEqual(defaultSave());
    const partial = migrate({ saveVersion: SAVE_VERSION, coins: 5, settings: { sound: false } });
    expect(partial.coins).toBe(5);
    expect(partial.settings.sound).toBe(false);
    expect(partial.settings.haptics).toBe(true);
    expect(readSave(memorySaveProvider('{broken'))).toEqual(defaultSave());
  });
});

describe('game store', () => {
  it('plays level 1 to the end and resumes a half-finished level', async () => {
    const provider = memorySaveProvider();
    let t = 0;
    const store = createGameStore({ provider, loadLevel, now: () => (t += 10_000) });
    await store.getState().openLevel();
    const level = store.getState().level as Level;
    expect(level.id).toBe(1);
    const [first, ...rest] = level.words.map((w) => w.w);

    expect(store.getState().submit('zzz')?.result).toBe('invalid');
    expect(store.getState().submit(first as string)?.result).toBe('target');
    expect(store.getState().submit(first as string)?.result).toBe('alreadyFound');
    const coinsAfterOne = store.getState().save.coins;
    expect(coinsAfterOne).toBe(201);

    // Re-open with the same storage: the session comes back.
    const again = createGameStore({ provider, loadLevel });
    await again.getState().openLevel();
    expect(again.getState().session?.progress.found).toEqual([first]);

    for (const w of rest) again.getState().submit(w);
    const s = again.getState();
    expect(s.result?.stars).toBe(3);
    expect(s.save.currentLevel).toBe(2);
    expect(s.save.coins).toBe(coinsAfterOne + rest.length + 20);
    expect(s.save.session).toBeNull();
    expect(s.submit('x')).toBeNull();

    await s.nextLevel();
    expect(again.getState().level?.id).toBe(2);
  });

  it('charges hints, counts bonus words and shuffles', async () => {
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel });
    await store.getState().openLevel(5);
    const level = store.getState().level as Level;
    const h = store.getState().hint({ kind: 'letter' });
    expect(h?.cost).toBe(25);
    expect(store.getState().save.coins).toBe(175);
    expect(store.getState().session?.hintsUsed).toBe(1);
    const bonus = level.bonus[0];
    if (bonus) {
      expect(store.getState().submit(bonus)?.result).toBe('bonus');
      expect(store.getState().save.bonusCounter).toBe(1);
    }
    const before = store.getState().session?.order;
    store.getState().shuffle();
    expect(store.getState().session?.order).not.toEqual(before);
    store.getState().setSetting('sound', false);
    expect(store.getState().save.settings.sound).toBe(false);
  });

  it('refuses unaffordable hints and reports load errors', async () => {
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel });
    expect(store.getState().hint({ kind: 'letter' })).toBeNull();
    await store.getState().openLevel(99);
    expect(store.getState().error).toMatch(/no level/);
    await store.getState().openLevel(1);
    store.setState((s) => {
      s.save.coins = 10;
    });
    expect(store.getState().hint({ kind: 'word' })).toBeNull();
  });
});
