import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Level, LevelManifest } from '../game/level';
import { decodePack } from '../game/packs';
import { engine } from '../services/morph';
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
    const store = createGameStore({ provider, loadLevel, engine, now: () => (t += 10_000) });
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
    const again = createGameStore({ provider, loadLevel, engine });
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
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel, engine });
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
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel, engine });
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

describe('Ek Turu in the store', () => {
  const solve = (store: ReturnType<typeof createGameStore>) => {
    for (const w of (store.getState().level as Level).words) store.getState().submit(w.w);
  };

  it('opens after every 5th level, pays ¼ of the score and survives a restart', async () => {
    const provider = memorySaveProvider();
    const store = createGameStore({ provider, loadLevel, engine });
    await store.getState().openLevel(5);
    solve(store);
    expect(store.getState().result).not.toBeNull();
    expect(store.getState().save.pendingEkTuru).toBe(5);

    // Closing the app here: the round is offered again on launch.
    const again = createGameStore({ provider, loadLevel, engine });
    await again.getState().openLevel();
    const ek = again.getState().ek!;
    expect(ek.ek.root).toBe('tane');
    expect(again.getState().tip).toBe('intro');
    again.getState().dismissTip();
    expect(again.getState().save.tipsSeen).toEqual(['intro']);

    const coins = again.getState().save.coins;
    expect(again.getState().ekHint()).toBe(true);
    const hinted = again.getState().ek!.hinted!;
    expect(again.getState().save.coins).toBe(coins - 40);
    expect(again.getState().ekApply([hinted])).toEqual({ added: 1, failed: false });
    expect(again.getState().ek!.word.surface).toBe('taneli');
    const ler = again.getState().ek!.cards.findIndex((c) => c.form === 'ler');
    expect(again.getState().ekApply([ler])).toEqual({ added: 1, failed: false });
    expect(again.getState().ek!.word.surface).toBe('taneliler');
    again.getState().ekCollect();
    const s = again.getState();
    expect(s.ek!.status).toBe('collected');
    expect(s.ekPaid).toBe(Math.floor(s.ek!.score / 4));
    expect(s.save.coins).toBe(coins - 40 + (s.ekPaid as number));
    expect(s.save.pendingEkTuru).toBeNull();
    again.getState().ekCollect();
    expect(again.getState().save.coins).toBe(s.save.coins);

    await again.getState().nextLevel();
    expect(again.getState().level?.id).toBe(6);
    expect(again.getState().ek).toBeNull();
  });

  it('a broken chain ends the round, pays out and shows the matching tip once', async () => {
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel, engine });
    await store.getState().openLevel(5);
    solve(store);
    store.getState().startEkTuru();
    store.getState().dismissTip();
    const wrong = store.getState().ek!.cards.findIndex((c) => c.form === 'lı');
    expect(store.getState().ekApply([wrong])).toEqual({ added: 0, failed: true });
    expect(store.getState().tip).toBe('harmony');
    expect(store.getState().ekPaid).toBe(0);
    expect(store.getState().save.pendingEkTuru).toBeNull();
    store.getState().setSetting('ekTuruExplanations', false);
    store.getState().dismissTip();
    expect(store.getState().tip).toBeNull();
  });
});

describe('postcards', () => {
  it('finishing a stop’s last level earns its postcard once', async () => {
    const store = createGameStore({ provider: memorySaveProvider(), loadLevel, engine });
    await store.getState().openLevel(50);
    for (const w of (store.getState().level as Level).words) store.getState().submit(w.w);
    expect(store.getState().newPostcard).toBe('tr-34-istanbul');
    expect(store.getState().save.postcards).toEqual(['tr-34-istanbul']);
    store.getState().dismissPostcard();
    expect(store.getState().newPostcard).toBeNull();
    await store.getState().openLevel(49);
    for (const w of (store.getState().level as Level).words) store.getState().submit(w.w);
    expect(store.getState().newPostcard).toBeNull();
  });
});
