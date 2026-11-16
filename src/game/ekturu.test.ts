import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { engine } from '../services/morph';
import {
  applyCards,
  cardCategory,
  cardLabel,
  collect,
  ekMultiplier,
  ekReward,
  hintCard,
  naivePreview,
  newEkSession,
  wheelCards,
  type EkSession,
} from './ekturu';
import type { EkTuru, LevelManifest } from './level';
import { decodePack } from './packs';
import { chainScore } from './scoring';
import { placeAblative } from './stops';

const DIR = join(__dirname, '..', '..', 'assets', 'levels');
const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as LevelManifest;
const readPack = (n: number) =>
  decodePack(
    new Uint8Array(readFileSync(join(DIR, `pack_${String(n).padStart(4, '0')}.json.gz`))),
    manifest,
    n,
  );

const kalem: EkTuru = {
  root: 'kalem',
  bestChain: ['DER_LIK', 'PLURAL', 'POSS_1PL', 'CASE_ABL'],
  maxDepth: 4,
  cards: [
    { id: 'DER_LIK', form: 'lik' },
    { id: 'DER_LIK', form: 'lık' },
    { id: 'PLURAL', form: 'ler' },
    { id: 'PLURAL', form: 'lar' },
    { id: 'POSS_1PL', form: 'imiz' },
    { id: 'POSS_1PL', form: 'ımız' },
    { id: 'CASE_ABL', form: 'den' },
    { id: 'CASE_ABL', form: 'ten' },
  ],
  targetScore: 160,
  big: false,
  archiphoneme: false,
};
const idx = (s: EkSession, form: string) => s.cards.findIndex((c) => c.form === form);

describe('Ek Turu round', () => {
  it('builds the best chain card by card and scores len × 2 × 2^n', () => {
    let s = newEkSession(engine, 5, kalem);
    expect(s.score).toBe(0);
    const o1 = applyCards(engine, s, [idx(s, 'lik')]);
    s = o1.session;
    expect(s.word.surface).toBe('kalemlik');
    expect(s.score).toBe(chainScore('kalemlik', 1));
    expect(ekMultiplier(s)).toBe(2);
    s = applyCards(engine, s, [idx(s, 'ler'), idx(s, 'imiz'), idx(s, 'den')]).session;
    expect(s.word.surface).toBe('kalemliklerimizden');
    expect(s.score).toBe(18 * 2 * 16);
    expect(s.status).toBe('playing');
    s = collect(s);
    expect(s.status).toBe('collected');
    expect(ekReward(s)).toBe(Math.floor((18 * 2 * 16) / 4));
    expect(applyCards(engine, s, [0]).added).toBe(0);
  });

  it('a wrong variant breaks the chain, explains why and keeps the score so far', () => {
    let s = newEkSession(engine, 5, kalem);
    s = applyCards(engine, s, [idx(s, 'lik')]).session;
    const before = s.score;
    const out = applyCards(engine, s, [idx(s, 'lar'), idx(s, 'imiz')]);
    expect(out.failed).toBe(true);
    expect(out.added).toBe(0);
    expect(out.session.status).toBe('broken');
    expect(out.session.error?.reason).toBe('VOWEL_HARMONY');
    expect(out.session.error?.explanation).toContain('Ünlü uyumu bozuldu');
    expect(out.session.error?.tried).toBe('kalemliklar');
    expect(out.session.score).toBe(before);
    expect(out.tips).toContain('harmony');
  });

  it('explains order mistakes and hard-consonant assimilation', () => {
    let s = newEkSession(engine, 5, kalem);
    s = applyCards(engine, s, [idx(s, 'imiz')]).session;
    const order = applyCards(engine, s, [idx(s, 'lik')]);
    expect(order.session.error?.reason).toBe('ORDER');
    expect(order.tips).toContain('order');
    const cons = applyCards(engine, newEkSession(engine, 5, kalem), [idx(s, 'ten')]);
    expect(cons.session.error?.reason).toBe('CONSONANT');
    expect(cons.tips).toEqual(['assimilation']);
    const ek: EkTuru = { ...kalem, root: 'tane', cards: [{ id: 'CASE_DAT', form: 'e' }] };
    const buf = applyCards(engine, newEkSession(engine, 5, ek), [0]);
    expect(buf.session.error?.reason).toBe('CONSONANT');
    expect(buf.tips).toEqual(['buffer']);
  });

  it('reports tips for softening, buffer letters and assimilation', () => {
    const ek: EkTuru = {
      ...kalem,
      root: 'kitap',
      cards: [
        { id: 'CASE_ACC', form: 'ı' },
        { id: 'POSS_3SG', form: 'ı' },
        { id: 'CASE_ABL', form: 'tan' },
        { id: 'CASE_DAT', form: 'na' },
      ],
    };
    let s = newEkSession(engine, 5, ek);
    expect(applyCards(engine, s, [0]).tips).toEqual(['softening']);
    expect(applyCards(engine, s, [2]).tips).toEqual(['assimilation']);
    s = applyCards(engine, s, [1]).session;
    expect(s.word.surface).toBe('kitabı');
    expect(applyCards(engine, s, [3]).tips).toEqual(['buffer']);
  });

  it('hints the next card of the best chain, then any valid card', () => {
    let s = newEkSession(engine, 5, kalem);
    expect(s.cards[hintCard(engine, s) as number]).toEqual({ id: 'DER_LIK', form: 'lik' });
    s = applyCards(engine, s, [idx(s, 'ler')]).session;
    const h = hintCard(engine, s) as number;
    expect(engine.applySuffix(s.word, s.cards[h]!, { strictVariant: true }).ok).toBe(true);
    expect(hintCard(engine, collect(s))).toBeNull();
  });

  it('labels cards and previews the naive surface', () => {
    expect(cardLabel({ id: 'DER_LIK', form: 'lık' })).toBe('-lık');
    expect(cardLabel({ id: 'DER_LIK' })).toBe('-lXk');
    expect(cardLabel({ id: 'CASE_DAT' })).toBe('-(y)A');
    expect(cardCategory({ id: 'PLURAL' })).toBe('çoğul');
    const s = newEkSession(engine, 5, kalem);
    expect(naivePreview(s, [s.cards[1]!, s.cards[3]!])).toBe('kalemlıklar');
  });

  it('archiphoneme cards: engine picks the variant, ×1.5 instead of ×2', () => {
    const ek = { ...kalem, archiphoneme: true };
    const cards = wheelCards(ek);
    expect(cards.filter((c) => c.form === undefined)).toHaveLength(2);
    expect(cards.length).toBeLessThan(kalem.cards.length);
    let s = newEkSession(engine, 1005, ek);
    const arch = s.cards.findIndex((c) => c.form === undefined && c.id === 'DER_LIK');
    s = applyCards(engine, s, [arch]).session;
    expect(s.word.surface).toBe('kalemlik');
    expect(s.score).toBe(chainScore('kalemlik', 0, 1));
    expect(ekMultiplier(s)).toBe(1.5);
  });
});

describe('every packed Ek Turu is playable with its own cards', () => {
  const packs = readdirSync(DIR).filter((f) => f.startsWith('pack_')).length;
  it(`replays the best chain of all ${packs} packs through the wheel cards`, () => {
    let rounds = 0;
    for (let p = 1; p <= packs; p++) {
      for (const level of readPack(p).levels) {
        if (!level.ekTuru) continue;
        rounds++;
        let s = newEkSession(engine, level.id, level.ekTuru);
        for (const id of level.ekTuru.bestChain) {
          const fits = (k: number) =>
            s.cards[k]!.id === id &&
            engine.applySuffix(s.word, s.cards[k]!, { strictVariant: true }).ok;
          // Concrete cards first: they score more than an archiphoneme card.
          const order = s.cards
            .map((_, k) => k)
            .sort((x, y) => +!s.cards[x]!.form - +!s.cards[y]!.form);
          const i = order.find(fits) ?? -1;
          expect(i).toBeGreaterThanOrEqual(0);
          s = applyCards(engine, s, [i]).session;
        }
        expect(s.status).toBe('playing');
        expect(s.steps).toHaveLength(level.ekTuru.bestChain.length);
        expect(s.score).toBeGreaterThanOrEqual(s.target);
        if (!level.ekTuru.archiphoneme) expect(s.target).toBe(level.ekTuru.targetScore);
      }
    }
    expect(rounds).toBe(1000);
  });
});

describe('placeAblative', () => {
  it('writes place names with the right ablative', () => {
    const names = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'assets', 'levels', 'stops.json'), 'utf8'),
    ) as { name: string }[];
    const got = Object.fromEntries(names.map((s) => [s.name, placeAblative(engine, s.name)]));
    expect(got['İstanbul']).toBe("İstanbul'dan");
    expect(got['İzmir']).toBe("İzmir'den");
    expect(got['Bakü']).toBe("Bakü'den");
    expect(got['New York']).toBe("New York'tan");
    expect(got['Kars']).toBe("Kars'tan");
    expect(got['Tokyo']).toBe("Tokyo'dan");
    for (const v of Object.values(got)) expect(v).toMatch(/'(?:d|t)(?:a|e)n$/);
  });
});
