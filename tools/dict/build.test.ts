import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildDawg } from './dawg-build';
import {
  build,
  flagsFromEntry,
  isBlocked,
  parseBlocklist,
  pickEntry,
  type BuildResult,
} from './build';
import { parseLine, type ZemberekEntry } from './zemberek';

const ASSETS = join(__dirname, '..', '..', 'assets', 'dict');
const entry = (l: string) => parseLine(l) as ZemberekEntry;

describe('blocklist', () => {
  const b = parseBlocklist('# c\nfoo\nbar*\n\n  Baz  \n');
  it('matches exact words and prefixes', () => {
    expect(isBlocked(b, 'foo')).toBe(true);
    expect(isBlocked(b, 'foolar')).toBe(false);
    expect(isBlocked(b, 'barlar')).toBe(true);
    expect(isBlocked(b, 'baz')).toBe(true);
    expect(isBlocked(b, 'qux')).toBe(false);
  });
});

describe('root flags', () => {
  it('maps Zemberek attributes', () => {
    const e = entry('kayıp [A:Voicing, LastVowelDrop]');
    expect(flagsFromEntry(e, [e])).toEqual({ soften: true, vowelDrop: true });
    const h = entry('hak [A:Doubling]');
    expect(flagsFromEntry(h, [h])).toEqual({ geminate: true });
    const s = entry('saat [A:InverseHarmony, NoVoicing]');
    expect(flagsFromEntry(s, [s])).toEqual({ frontOverride: true, noSoften: true });
  });
  it('treats inverse-harmony -t loans as non-voicing', () => {
    const d = entry('dikkat [A:InverseHarmony]');
    expect(flagsFromEntry(d, [d])).toEqual({ frontOverride: true, noSoften: true });
  });
  it('marks time nouns as temporal', () => {
    const all = [entry('yarın [P:Adv]'), entry('yarın [P:Noun, Time]')];
    expect(flagsFromEntry(pickEntry(all), all)).toEqual({ temporal: true });
  });
  it('picks the unindexed noun reading of homographs', () => {
    const all = [
      entry('hak [P:Noun; A:Doubling, InverseHarmony ; Index:1]'),
      entry('hak [P:Adj]'),
      entry('hak [A:Doubling]'),
    ];
    expect(pickEntry(all).attributes).toEqual(['Doubling']);
  });
});

describe('build (full pipeline)', () => {
  let r: BuildResult;
  beforeAll(() => {
    r = build();
  });

  it('produces ≥ 10,000 target words (spec §3 acceptance)', () => {
    expect(r.targets.length).toBeGreaterThanOrEqual(10_000);
  });

  it('keeps targets 3–8 letters, unique, sorted by frequency', () => {
    const words = r.targets.map((t) => t[0]);
    expect(new Set(words).size).toBe(words.length);
    for (const [w] of r.targets) expect(w.length >= 3 && w.length <= 8).toBe(true);
    const scores = r.targets.map((t) => t[1]);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('applies the blocklist to targets', () => {
    const b = parseBlocklist(readFileSync(join(__dirname, 'blocklist.txt'), 'utf8'));
    expect(r.targets.filter(([w]) => isBlocked(b, w))).toEqual([]);
    expect(r.stats.blockedTargets).toBeGreaterThan(0);
  });

  it('includes the Ek Turu spec chain', () => {
    expect(JSON.stringify(r.derivations['göz'])).toContain('gözlükçülük');
  });

  it('is byte-identical to the committed assets (run `pnpm dict` after changing inputs)', () => {
    const committed = (f: string) => readFileSync(join(ASSETS, f));
    expect(Buffer.from(buildDawg(r.valid)).equals(committed('valid_words.bin'))).toBe(true);
    expect(r.targets.map(([w, z, k]) => `${w}\t${z.toFixed(2)}\t${k}`).join('\n') + '\n').toBe(
      committed('target_words.txt').toString('utf8'),
    );
  });

  it('is deterministic', () => {
    const again = build();
    expect(again.valid).toEqual(r.valid);
    expect(again.targets).toEqual(r.targets);
    expect(again.derivations).toEqual(r.derivations);
  });
});
