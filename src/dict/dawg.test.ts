import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDawg } from '../../tools/dict/dawg-build';
import { Dawg, letterIndex } from './dawg';

const WORDS = [
  'ev',
  'evde',
  'evler',
  'göz',
  'gözlük',
  'gözlükçü',
  'kalem',
  'kale',
  'elma',
  'alem',
  'ışık',
  'şeker',
];

describe('Dawg (small)', () => {
  const dawg = new Dawg(buildDawg(WORDS));

  it('counts words', () => expect(dawg.wordCount).toBe(WORDS.length));
  it.each(WORDS)('has %s', (w) => expect(dawg.has(w)).toBe(true));
  it.each(['e', 'evd', 'gözlü', 'kalemler', 'x', '', 'ışıklar', 'ab', 'şekerz', 'quiz'])(
    'does not have %p',
    (w) => expect(dawg.has(w)).toBe(false),
  );

  it('iterates all words in Turkish alphabetical order', () => {
    expect([...dawg.words()]).toEqual([
      'alem',
      'elma',
      'ev',
      'evde',
      'evler',
      'göz',
      'gözlük',
      'gözlükçü',
      'ışık',
      'kale',
      'kalem',
      'şeker',
    ]);
  });

  it('finds words spellable from a letter multiset', () => {
    expect(dawg.wordsFromLetters(['k', 'a', 'l', 'e', 'm']).sort()).toEqual([
      'alem',
      'elma',
      'kale',
      'kalem',
    ]);
    expect(dawg.wordsFromLetters(['e', 'v', 'd', 'e'], 2).sort()).toEqual(['ev', 'evde']);
    expect(dawg.wordsFromLetters(['e', 'v', 'd'], 2)).toEqual(['ev']);
    expect(dawg.wordsFromLetters(['q', 'z'])).toEqual([]);
  });

  it('is deterministic and order-independent', () => {
    expect(buildDawg([...WORDS].reverse())).toEqual(buildDawg(WORDS));
  });

  it('ignores duplicates and empty strings', () => {
    expect(new Dawg(buildDawg(['ev', 'ev', ''])).wordCount).toBe(1);
  });

  it('handles an empty dictionary', () => {
    const empty = new Dawg(buildDawg([]));
    expect(empty.has('ev')).toBe(false);
    expect([...empty.words()]).toEqual([]);
    expect(empty.wordsFromLetters(['e', 'v'])).toEqual([]);
  });

  it('rejects bad input', () => {
    expect(() => buildDawg(['quiz'])).toThrow('Non-Turkish');
    expect(() => new Dawg(new Uint8Array(4))).toThrow('Not an EKDW');
    const bad = buildDawg(['ev']);
    new DataView(bad.buffer).setUint32(4, 99, true);
    expect(() => new Dawg(bad)).toThrow('version 99');
  });

  it('accepts an ArrayBuffer', () => {
    const bytes = buildDawg(['ev']);
    expect(new Dawg(bytes.slice().buffer).has('ev')).toBe(true);
  });

  it('maps letters', () => {
    expect(letterIndex('a')).toBe(0);
    expect(letterIndex('z')).toBe(28);
    expect(letterIndex('q')).toBeUndefined();
  });
});

describe('Dawg (assets/dict/valid_words.bin)', () => {
  const dawg = new Dawg(readFileSync(join(__dirname, '../../assets/dict/valid_words.bin')));
  const targets = readFileSync(join(__dirname, '../../assets/dict/target_words.txt'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.split('\t')[0] as string);

  it('holds 80,000+ words (spec §7.3)', () => expect(dawg.wordCount).toBeGreaterThan(80_000));

  it('contains every target word', () => {
    const missing = targets.filter((w) => !dawg.has(w));
    expect(missing).toEqual([]);
  });

  it.each(['kalem', 'kalemler', 'gözlük', 'kitabı', 'evimde', 'saati', 'ağzı', 'gelmek', 'gel'])(
    'accepts %s',
    (w) => expect(dawg.has(w)).toBe(true),
  );

  it.each(['klem', 'kitapı', 'saatı', 'ağızı', 'gözlükçülük'])('rejects %s', (w) =>
    expect(dawg.has(w)).toBe(false),
  );

  it('looks a word up in well under 1 ms (spec §7.3 acceptance)', () => {
    const sample = targets.slice(0, 5000);
    const t0 = performance.now();
    let hits = 0;
    for (let round = 0; round < 4; round++) for (const w of sample) if (dawg.has(w)) hits++;
    const perLookupMs = (performance.now() - t0) / (sample.length * 4);
    expect(hits).toBe(sample.length * 4);
    expect(perLookupMs).toBeLessThan(0.05);
  });
});
