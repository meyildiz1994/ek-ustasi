/** Loads the generated dictionary assets (tools/dict → assets/dict) for level generation. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Dawg } from '../../src/dict/dawg';
import { lexiconFromAssets, type DerivationTree } from '../../src/dict/lexicon';
import { createEngine, type Engine, type RootInfo } from '../../src/morph';
import { isBlocked, parseBlocklist, type Blocklist } from '../dict/build';
import { bagOf, type LetterBag } from './letters';

const ROOT = join(__dirname, '..', '..');
const DICT = join(ROOT, 'assets', 'dict');

export interface TargetWord {
  w: string;
  zipf: number;
  /** L = dictionary lemma, I = common single-suffix inflection. */
  kind: 'L' | 'I';
  bag: LetterBag;
  /** Frequency percentile among all target words: 1 = most common, 0 = rarest. */
  pct: number;
}

export interface Dictionary {
  targets: TargetWord[];
  byWord: Map<string, TargetWord>;
  valid: Dawg;
  derivations: Readonly<Record<string, DerivationTree>>;
  engine: Engine;
  blocklist: Blocklist;
  isBlocked(w: string): boolean;
}

export function parseTargets(text: string): TargetWord[] {
  const rows = text
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const [w, z, k] = l.split('\t');
      if (w === undefined || z === undefined || (k !== 'L' && k !== 'I')) {
        throw new Error(`Bad target line: ${l}`);
      }
      return { w, zipf: Number(z), kind: k as 'L' | 'I' };
    });
  // Percentile by Zipf; ties share the lower rank so equal frequencies get equal percentiles.
  const sorted = rows.map((r) => r.zipf).sort((a, b) => a - b);
  const firstIndex = new Map<number, number>();
  sorted.forEach((z, i) => {
    if (!firstIndex.has(z)) firstIndex.set(z, i);
  });
  const n = Math.max(1, sorted.length - 1);
  return rows.map((r) => ({
    ...r,
    bag: bagOf(r.w),
    pct: (firstIndex.get(r.zipf) as number) / n,
  }));
}

export function loadDictionary(dir = DICT): Dictionary {
  const targets = parseTargets(readFileSync(join(dir, 'target_words.txt'), 'utf8'));
  const derivations = JSON.parse(readFileSync(join(dir, 'derivations.json'), 'utf8')) as Record<
    string,
    DerivationTree
  >;
  const rootFlags = JSON.parse(readFileSync(join(dir, 'root_flags.json'), 'utf8')) as Record<
    string,
    RootInfo
  >;
  const blocklist = parseBlocklist(
    readFileSync(join(ROOT, 'tools', 'dict', 'blocklist.txt'), 'utf8'),
  );
  return {
    targets,
    byWord: new Map(targets.map((t) => [t.w, t])),
    valid: new Dawg(readFileSync(join(dir, 'valid_words.bin'))),
    derivations,
    engine: createEngine(lexiconFromAssets(rootFlags, derivations)),
    blocklist,
    isBlocked: (w) => isBlocked(blocklist, w),
  };
}
