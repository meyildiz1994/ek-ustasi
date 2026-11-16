import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, strFromU8 } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  isEkTuruLevel,
  type Level,
  type LevelManifest,
  type LevelPack,
} from '../../src/game/level';
import { isRelaxLevel, targetDifficulty, TIERS, tierOf } from './curve';
import { loadDictionary, type Dictionary } from './data';
import { difficulty } from './difficulty';
import { buildEkTuru, chainScore, inflectionTail, variantDecoys } from './ekturu';
import { generateLevels, stopIdForLevel } from './generate';
import { layoutWords, renderGrid } from './grid';
import { bagKey, bagOf, fits, repeatedLetters } from './letters';
import { buildPacks, sha256 } from './pack';
import { createRng, hashSeed } from './prng';
import { buildStops } from './stops';
import { runs, validateLevel, validateRepetition } from './validate';

const SEED = 20261116;
const LEVELS_DIR = join(__dirname, '..', '..', 'assets', 'levels');

let dict: Dictionary;
let first100: Level[];
beforeAll(() => {
  dict = loadDictionary();
  first100 = generateLevels(dict, { count: 100, seed: SEED }).levels;
});

describe('prng', () => {
  it('is deterministic and uniform enough', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 1000 }, () => a.next());
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b.next()));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
    expect(hashSeed(1, 2)).not.toBe(hashSeed(2, 1));
    expect(createRng(1).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('letters', () => {
  it('handles multisets', () => {
    expect(fits(bagOf('elma'), bagOf('kalem'))).toBe(true);
    expect(fits(bagOf('kalak'), bagOf('kalem'))).toBe(false);
    expect(fits(bagOf('kale'), bagOf('kalem'))).toBe(true);
    expect(fits(bagOf('kalak'), bagOf('kalk'))).toBe(false);
    expect(bagKey('kalem')).toBe('aeklm');
    expect(bagKey('çiğ')).toBe('çği');
    expect(repeatedLetters('kalak')).toBe(2);
  });
});

describe('grid', () => {
  it('builds a valid connected crossword', () => {
    const words = ['kalem', 'kale', 'elma', 'alem', 'mal', 'kel', 'lam'];
    const l = layoutWords(words, createRng(7));
    expect(l.placed).toHaveLength(words.length);
    const grid = renderGrid(l.placed);
    const found = runs(grid)
      .map((r) => r.w)
      .sort();
    expect(found).toEqual([...words].sort());
    expect(l.rows).toBeLessThanOrEqual(12);
    expect(l.cols).toBeLessThanOrEqual(12);
    expect(layoutWords(words, createRng(7))).toEqual(l);
  });

  it('drops words that cannot cross', () => {
    const l = layoutWords(['kalem', 'süt'], createRng(1));
    expect(l.placed.map((p) => p.w)).toEqual(['kalem']);
    expect(l.unplaced).toEqual(['süt']);
  });
});

describe('difficulty and curve', () => {
  it('stays within 0–100', () => {
    const easy = { letters: 4, words: 3, meanPct: 1, longest: 4, repeated: 0, density: 0.5 };
    const hard = { letters: 8, words: 16, meanPct: 0, longest: 8, repeated: 3, density: 0 };
    expect(difficulty(easy)).toBe(0);
    expect(difficulty(hard)).toBe(100);
    expect(difficulty({ ...easy, letters: 6 })).toBeGreaterThan(difficulty(easy));
  });

  it('covers 1–5000 with targets inside each band', () => {
    expect(TIERS[0]?.from).toBe(1);
    expect(TIERS[TIERS.length - 1]?.to).toBe(5000);
    for (let id = 1; id <= 5000; id++) {
      const [lo, hi] = tierOf(id).band;
      const t = targetDifficulty(id);
      expect(t).toBeGreaterThanOrEqual(lo);
      expect(t).toBeLessThanOrEqual(hi);
      if (isRelaxLevel(id)) expect(t).toBeLessThanOrEqual(lo + (hi - lo) * 0.2);
    }
  });

  it('is a saw-tooth: a new stop starts easier than the last one ended', () => {
    for (const first of [351, 551, 1501, 2501, 3501, 4501]) {
      expect(targetDifficulty(first)).toBeLessThan(targetDifficulty(first - 1));
      expect(targetDifficulty(first + 48)).toBeGreaterThan(targetDifficulty(first));
    }
  });
});

describe('Ek Turu', () => {
  it('reproduces the spec example for kalem', () => {
    const e = buildEkTuru({
      engine: dict.engine,
      root: 'kalem',
      tree: dict.derivations['kalem'],
      maxDepth: 4,
      big: false,
      archiphoneme: false,
      rng: createRng(1),
    });
    expect(e.bestChain).toEqual(['DER_LIK', 'PLURAL', 'POSS_1PL', 'CASE_LOC']);
    expect(e.targetScore).toBe(160);
    const forms = e.cards.map((c) => c.form);
    for (const f of ['lik', 'ler', 'imiz', 'de']) expect(forms).toContain(f);
    expect(forms).toContain('lık');
    expect(e.cards.length).toBeGreaterThanOrEqual(8);
    expect(e.cards.length).toBeLessThanOrEqual(12);
  });

  it('builds decoys and tails', () => {
    expect(variantDecoys('DER_LIK', 'lik')).toEqual(expect.arrayContaining(['lık', 'luk', 'lük']));
    expect(variantDecoys('CASE_ABL', 'den')).toEqual(expect.arrayContaining(['dan', 'ten']));
    expect(inflectionTail(6)).toEqual([
      'PLURAL',
      'POSS_1PL',
      'CASE_LOC',
      'REL_KI',
      'PLURAL',
      'CASE_LOC',
    ]);
    expect(chainScore('kalemliklerimizden', 4)).toBe(576);
  });
});

describe('stops', () => {
  it('has 81 provinces + 19 world cities with content and palettes', () => {
    const stops = buildStops();
    expect(stops).toHaveLength(100);
    expect(new Set(stops.map((s) => s.id)).size).toBe(100);
    const tr = stops.filter((s) => s.region !== 'dunya');
    expect(tr).toHaveLength(81);
    expect(new Set(tr.map((s) => s.id.slice(3, 5))).size).toBe(81);
    expect(stops[0]?.id).toBe('tr-34-istanbul');
    expect(stops.find((s) => s.id === 'tr-50-nevsehir')).toBeDefined();
    for (const s of stops) {
      expect(s.intro.length).toBeGreaterThan(20);
      for (const c of [...s.palette.sky, ...s.palette.ground, s.palette.accent]) {
        expect(c).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
    expect(stopIdForLevel(1)).toBe('tr-34-istanbul');
    expect(stopIdForLevel(50)).toBe('tr-34-istanbul');
    expect(stopIdForLevel(51)).toBe('tr-22-edirne');
  });
});

describe('generated levels (first 100)', () => {
  it('pass every validation', () => {
    const failures = [
      ...first100.flatMap((l) => validateLevel(l, dict)),
      ...validateRepetition(first100),
    ];
    expect(failures).toEqual([]);
    expect(first100.filter((l) => isEkTuruLevel(l.id)).every((l) => l.ekTuru)).toBe(true);
    expect(first100[0]?.words.map((w) => w.w)).toContain('elma');
  });

  it('are deterministic', () => {
    const again = generateLevels(dict, { count: 30, seed: SEED }).levels;
    expect(again).toEqual(first100.slice(0, 30));
    const a = buildPacks(again, SEED);
    const b = buildPacks(first100.slice(0, 30), SEED);
    expect(a.manifest).toEqual(b.manifest);
  });

  it('validation catches a broken grid', () => {
    const l = structuredClone(first100[10] as Level);
    const p = l.words[1];
    if (p) p.r += 1;
    expect(validateLevel(l, dict).length).toBeGreaterThan(0);
  });

  it.skipIf(!existsSync(join(LEVELS_DIR, 'manifest.json')))(
    'match the committed packs (bit-identical) and their manifest hashes',
    () => {
      const manifest = JSON.parse(
        readFileSync(join(LEVELS_DIR, 'manifest.json'), 'utf8'),
      ) as LevelManifest;
      expect(manifest.seed).toBe(SEED);
      for (const p of manifest.packs) {
        expect(sha256(readFileSync(join(LEVELS_DIR, p.file)))).toBe(p.sha256);
      }
      const built = buildPacks(first100, SEED);
      for (const f of built.files) {
        const committed = readFileSync(join(LEVELS_DIR, f.file));
        expect(sha256(committed)).toBe(sha256(f.bytes));
        const pack = JSON.parse(strFromU8(gunzipSync(committed))) as LevelPack;
        expect(pack.levels).toHaveLength(50);
      }
    },
  );
});
