/**
 * Dictionary pipeline (spec §7). Inputs in tools/dict/sources (see fetch.ts), outputs in assets/dict:
 *   target_words.txt  common 3–8 letter words with a Zipf frequency score (level targets)
 *   valid_words.bin   EKDW DAWG of every acceptable 3–8 letter word (bonus validation)
 *   derivations.json  root → attested derivation tree (Ek Turu; engine-validated)
 *   root_flags.json   morphological flags per root (engine lexicon)
 *   STATS.md          counts for review
 * Deterministic: same sources → byte-identical outputs.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { decode } from '@msgpack/msgpack';

import {
  createEngine,
  createLexicon,
  type RootInfo,
  type SuffixId,
  SUFFIXES,
} from '../../src/morph';
import { isTrWord, trCompare, trNormalize } from '../../src/utils/tr';
import { buildDawg } from './dawg-build';
import { parseDictionary, type ZemberekEntry } from './zemberek';

const HERE = __dirname;
const SRC = join(HERE, 'sources');
const OUT = join(HERE, '..', '..', 'assets', 'dict');

export const MIN_LEN = 3;
export const MAX_LEN = 8;
/** Zipf ≥ 3.0 ≈ at least once per million words. The wordfreq "small" list stops at 3.0. */
export const MIN_TARGET_ZIPF = 3.0;
/** Three-letter strings collide with many unrelated forms; demand more evidence. */
export const MIN_TARGET_ZIPF_3 = 3.5;
/** Inflected forms only qualify as targets when clearly common. */
export const MIN_INFLECTED_ZIPF = 3.5;
const TARGET_INFLECTIONS: SuffixId[] = [
  'PLURAL',
  'POSS_3SG',
  'CASE_LOC',
  'CASE_ABL',
  'CASE_DAT',
  'CASE_ACC',
  'CASE_GEN',
  'POSS_1SG',
];

const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
/** wordfreq cB format: [header, bucket0, bucket1, …]; bucket i holds words with frequency 10^(-i/100). */
export function loadWordfreq(buf: Uint8Array): Map<string, number> {
  const data = decode(gunzipSync(buf)) as unknown[];
  const out = new Map<string, number>();
  data.slice(1).forEach((bucket, i) => {
    for (const w of bucket as string[]) {
      const n = trNormalize(w);
      if (!out.has(n)) out.set(n, Math.round((9 - i / 100) * 100) / 100);
    }
  });
  return out;
}

export interface Blocklist {
  exact: Set<string>;
  prefixes: string[];
}

export function parseBlocklist(text: string): Blocklist {
  const exact = new Set<string>();
  const prefixes: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const w = trNormalize(line);
    if (w.endsWith('*')) prefixes.push(w.slice(0, -1));
    else exact.add(w);
  }
  return { exact, prefixes };
}

export const isBlocked = (b: Blocklist, w: string) =>
  b.exact.has(w) || b.prefixes.some((p) => w.startsWith(p));

const parseList = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'))
    .map(trNormalize);

// ---------------------------------------------------------------------------
// Root flags
// ---------------------------------------------------------------------------
const POS_RANK: Record<string, number> = { Noun: 0, Adj: 1 };

/** Picks the entry that represents a homograph group: lowest Index, then Noun before Adj. */
export function pickEntry(entries: ZemberekEntry[]): ZemberekEntry {
  return [...entries].sort(
    (a, b) => a.index - b.index || (POS_RANK[a.pos] ?? 9) - (POS_RANK[b.pos] ?? 9),
  )[0] as ZemberekEntry;
}

export function flagsFromEntry(e: ZemberekEntry, all: ZemberekEntry[]): RootInfo {
  const a = new Set(e.attributes);
  const info: RootInfo = {};
  if (a.has('Voicing')) info.soften = true;
  if (a.has('NoVoicing')) info.noSoften = true;
  if (a.has('LastVowelDrop')) info.vowelDrop = true;
  if (a.has('Doubling')) info.geminate = true;
  if (a.has('InverseHarmony')) {
    info.frontOverride = true;
    // Arabic loans in -t with inverse harmony do not voice (dikkat → dikkati, hakikat → hakikati).
    if (!info.soften && e.lemma.endsWith('t')) info.noSoften = true;
  }
  if (all.some((x) => x.secondaryPos.includes('Time'))) info.temporal = true;
  return info;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const INFLECTABLE = new Set(['Noun', 'Adj']);
const NO_INFLECT_ATTRS = ['NoSuffix', 'CompoundP3sg', 'ImplicitPlural', 'Ext'];

/** Inflection chains used to expand nouns into acceptable bonus words (≤ 2 suffixes). */
const INFLECTIONS: SuffixId[][] = (() => {
  const poss: SuffixId[] = ['POSS_1SG', 'POSS_2SG', 'POSS_3SG', 'POSS_1PL', 'POSS_2PL'];
  const cases: SuffixId[] = ['CASE_ABL', 'CASE_LOC', 'CASE_DAT', 'CASE_ACC', 'CASE_GEN', 'WITH_LA'];
  const out: SuffixId[][] = [['PLURAL'], ...poss.map((p) => [p]), ...cases.map((c) => [c])];
  for (const p of poss) out.push(['PLURAL', p]);
  for (const c of cases) out.push(['PLURAL', c]);
  for (const p of poss) for (const c of cases) out.push([p, c]);
  return out;
})();

const DER_IDS = (Object.keys(SUFFIXES) as SuffixId[]).filter((id) => SUFFIXES[id].slot === 'DER');
const MAX_DER_DEPTH = 4;

type DerTree = { [id: string]: [string, DerTree?] };

export interface BuildResult {
  targets: [string, number, 'L' | 'I'][];
  valid: string[];
  derivations: Record<string, DerTree>;
  rootFlags: Record<string, RootInfo>;
  stats: Record<string, number>;
}

export function build(): BuildResult {
  const master = parseDictionary(read('zemberek/master-dictionary.dict'));
  const nonTdk = parseDictionary(read('zemberek/non-tdk.dict'));
  const abbreviations = new Set(
    parseDictionary(read('zemberek/abbreviations.dict')).map((e) => trNormalize(e.lemma)),
  );
  const freq = loadWordfreq(readFileSync(join(SRC, 'wordfreq/small_tr.msgpack.gz')));
  const blocklist = parseBlocklist(readFileSync(join(HERE, 'blocklist.txt'), 'utf8'));
  const extraDerived = parseList(readFileSync(join(HERE, 'derived-extra.txt'), 'utf8'));
  const overrides = JSON.parse(readFileSync(join(HERE, 'overrides.json'), 'utf8')) as {
    roots: Record<string, RootInfo & Record<string, boolean>>;
  };

  // Group entries by normalised lemma.
  const groups = new Map<string, ZemberekEntry[]>();
  const isCore = new Set<string>();
  for (const [list, core] of [
    [master, true],
    [nonTdk, false],
  ] as const) {
    for (const e of list) {
      if (e.pos === 'Punc' || e.pos === 'Abbrv') continue;
      const w = trNormalize(e.lemma);
      if (!isTrWord(w) || !/[aeıioöuü]/.test(w)) continue;
      const g = groups.get(w);
      if (g) g.push(e);
      else groups.set(w, [e]);
      if (core && !e.attributes.includes('Ext')) isCore.add(w);
    }
  }
  const lemmas = [...groups.keys()].sort(trCompare);

  // Root flags (only non-empty), then manual overrides.
  const rootFlags: Record<string, RootInfo> = {};
  for (const w of lemmas) {
    const entries = groups.get(w) as ZemberekEntry[];
    const info = flagsFromEntry(pickEntry(entries), entries);
    if (Object.keys(info).length > 0) rootFlags[w] = info;
  }
  for (const [w, o] of Object.entries(overrides.roots)) {
    const merged: Record<string, boolean> = { ...rootFlags[w], ...o };
    for (const k of Object.keys(merged)) if (merged[k] === false) delete merged[k];
    rootFlags[w] = merged as RootInfo;
  }

  // Attested words: any lemma, any corpus word, or a hand-verified derivation.
  const attested = new Set<string>([...lemmas, ...freq.keys(), ...extraDerived]);
  const engine = createEngine(createLexicon({ roots: rootFlags, derived: attested }));

  const inflectable = lemmas.filter((w) =>
    (groups.get(w) as ZemberekEntry[]).some(
      (e) => INFLECTABLE.has(e.pos) && !NO_INFLECT_ATTRS.some((a) => e.attributes.includes(a)),
    ),
  );

  // Derivation trees.
  const derivations: Record<string, DerTree> = {};
  const derivedSurfaces = new Set<string>();
  const grow = (word: ReturnType<typeof engine.makeWord>, depth: number): DerTree | undefined => {
    if (depth >= MAX_DER_DEPTH) return undefined;
    const tree: DerTree = {};
    for (const id of DER_IDS) {
      const r = engine.applySuffix(word, { id });
      if (!r.ok || r.surface === word.surface) continue;
      derivedSurfaces.add(r.surface);
      const sub = grow(r.word, depth + 1);
      tree[id] = sub ? [r.surface, sub] : [r.surface];
    }
    return Object.keys(tree).length > 0 ? tree : undefined;
  };
  for (const w of inflectable) {
    const t = grow(engine.makeWord(w), 0);
    if (t) derivations[w] = t;
  }
  const unreachableExtra = extraDerived.filter((w) => !derivedSurfaces.has(w));
  if (unreachableExtra.length > 0) {
    throw new Error(`derived-extra.txt words not derivable: ${unreachableExtra.join(', ')}`);
  }

  // Valid (bonus) words.
  const inRange = (w: string) => w.length >= MIN_LEN && w.length <= MAX_LEN;
  const valid = new Set<string>();
  for (const w of lemmas) {
    if (abbreviations.has(w) && !isCore.has(w)) continue;
    if (inRange(w)) valid.add(w);
    if ((groups.get(w) as ZemberekEntry[]).some((e) => e.pos === 'Verb')) {
      const stem = w.slice(0, -3);
      if (inRange(stem)) valid.add(stem);
    }
  }
  for (const w of derivedSurfaces) if (inRange(w)) valid.add(w);
  for (const w of inflectable) {
    const base = engine.makeWord(w);
    for (const chain of INFLECTIONS) {
      let word = base;
      let ok = true;
      for (const id of chain) {
        const r = engine.applySuffix(word, { id });
        if (!r.ok) {
          ok = false;
          break;
        }
        word = r.word;
      }
      if (ok && inRange(word.surface)) valid.add(word.surface);
    }
  }

  // Target words (spec §7.2): common core-dictionary lemmas, plus very common single-suffix
  // inflections of core nouns (evler, kitabı) so the list reaches the ≥10,000 the spec asks for.
  // Column 3 tells the level generator which is which (it should prefer lemmas).
  const minZipf = (w: string) => (w.length === 3 ? MIN_TARGET_ZIPF_3 : MIN_TARGET_ZIPF);
  const targets: [string, number, 'L' | 'I'][] = [];
  const taken = new Set<string>();
  let blockedCount = 0;
  const consider = (w: string, kind: 'L' | 'I', root: string) => {
    if (taken.has(w) || !inRange(w)) return;
    const z = freq.get(w);
    if (z === undefined || z < (kind === 'L' ? minZipf(w) : MIN_INFLECTED_ZIPF)) return;
    if (isBlocked(blocklist, w) || isBlocked(blocklist, root)) {
      blockedCount++;
      taken.add(w);
      return;
    }
    taken.add(w);
    targets.push([w, z, kind]);
  };
  for (const w of lemmas) {
    if (!isCore.has(w) || abbreviations.has(w)) continue;
    const entries = groups.get(w) as ZemberekEntry[];
    if (entries.every((e) => e.pos === 'Interj' || e.pos === 'Dup')) continue;
    consider(w, 'L', w);
  }
  for (const w of inflectable) {
    if (!isCore.has(w)) continue;
    const base = engine.makeWord(w);
    for (const id of TARGET_INFLECTIONS) {
      const r = engine.applySuffix(base, { id });
      if (r.ok) consider(r.surface, 'I', w);
    }
  }
  targets.sort((a, b) => b[1] - a[1] || trCompare(a[0], b[0]));
  const lemmaTargets = targets.filter((t) => t[2] === 'L').length;

  const validSorted = [...valid].sort(trCompare);
  const stats = {
    zemberekLemmas: lemmas.length,
    wordfreqWords: freq.size,
    rootsWithFlags: Object.keys(rootFlags).length,
    inflectableRoots: inflectable.length,
    rootsWithDerivations: Object.keys(derivations).length,
    derivedSurfaces: derivedSurfaces.size,
    validWords: validSorted.length,
    targetWords: targets.length,
    targetLemmas: lemmaTargets,
    blockedTargets: blockedCount,
  };
  return { targets, valid: validSorted, derivations, rootFlags, stats };
}

function stableJson(value: unknown): string {
  const sortKeys = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as object)
          .sort(trCompare)
          .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(sortKeys(value));
}

export function writeOutputs(r: BuildResult): void {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    join(OUT, 'target_words.txt'),
    r.targets.map(([w, z, k]) => `${w}\t${z.toFixed(2)}\t${k}`).join('\n') + '\n',
  );
  writeFileSync(join(OUT, 'valid_words.bin'), buildDawg(r.valid));
  writeFileSync(join(OUT, 'derivations.json'), stableJson(r.derivations) + '\n');
  writeFileSync(join(OUT, 'root_flags.json'), stableJson(r.rootFlags) + '\n');
  const lines = Object.entries(r.stats).map(([k, v]) => `| ${k} | ${v} |`);
  writeFileSync(
    join(OUT, 'STATS.md'),
    `# Sözlük istatistikleri\n\n\`pnpm dict\` tarafından üretilir.\n\n| Ölçüt | Değer |\n|---|---|\n${lines.join('\n')}\n`,
  );
}

if (require.main === module) {
  const t0 = Date.now();
  const r = build();
  writeOutputs(r);
  console.log(r.stats, `${Date.now() - t0} ms`);
}
