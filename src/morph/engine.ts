/**
 * Turkish morphology engine (spec §6): root + suffix sequence → surface form.
 * Pure TypeScript, UI-independent. All player-facing explanations come from i18n/tr.json.
 */
import { t } from '../i18n';
import { isTrWord, trLower, trNormalize } from '../utils/tr';
import { CORE_LEXICON, type Lexicon, type RootInfo } from './lexicon';
import {
  assimilateC,
  assimilateD,
  dropLastVowel,
  endsWithVowel,
  frontOf,
  geminate,
  harmonizeA,
  harmonizeI,
  isFront,
  isHard,
  isRounded,
  isVowel,
  lastChar,
  lastVowel,
  soften,
  SOFTENING,
  syllableCount,
  vowelsOf,
  type Vowel,
} from './phonology';
import {
  MAX_SUFFIXES,
  SUFFIX_IDS,
  SUFFIXES,
  type SuffixCard,
  type SuffixDef,
  type SuffixId,
} from './suffixes';

/** A (possibly suffixed) word plus the phonological state the next suffix needs. */
export interface Word {
  readonly root: string;
  readonly surface: string;
  /** Surface segments; `morphemes.join('') === surface` (e.g. ["kitab", "ı"]). */
  readonly morphemes: readonly string[];
  readonly suffixIds: readonly SuffixId[];
  /** Lexical flags of the current word (root or lexicalised derivation); {} after inflection. */
  readonly info: RootInfo;
  /** Vowel that governs harmony instead of the last surface vowel (frontOverride roots). */
  readonly harmonyOverride: Vowel | undefined;
  /** Next case suffix needs a pronominal n (after 3SG possessive or -ki). */
  readonly pronominalN: boolean;
}

export type FailReason = 'VOWEL_HARMONY' | 'CONSONANT' | 'ORDER' | 'NOT_LEXICAL';

export type ApplyResult =
  | { ok: true; surface: string; morphemes: string[]; word: Word }
  | { ok: false; reason: FailReason; explanation: string };

export interface ApplyOptions {
  /** When true, a card's concrete form must equal the allomorph the engine produces. */
  strictVariant: boolean;
}

export interface ChainTree {
  word: Word;
  surface: string;
  /** Suffix that produced this node (absent on the root). */
  suffixId?: SuffixId;
  children: ChainTree[];
}

export interface Engine {
  makeWord(root: string): Word;
  applySuffix(base: Word, suffix: SuffixCard, opts?: ApplyOptions): ApplyResult;
  derive(root: string, suffixIds: readonly SuffixId[]): ApplyResult;
  enumerateChains(root: string, maxDepth: number): ChainTree;
}

const fail = (reason: FailReason, explanation: string): ApplyResult => ({
  ok: false,
  reason,
  explanation,
});

// ---------------------------------------------------------------------------
// Morphotactics (spec §6.3 rule 8)
// ROOT → DER* → PLURAL? → POSS? → CASE? → (ki → PLURAL? → CASE? → ki ...)
// ---------------------------------------------------------------------------
function orderError(word: Word, def: SuffixDef): string | null {
  if (word.suffixIds.length >= MAX_SUFFIXES) return t('morph.orderMax', { max: MAX_SUFFIXES });
  const prevId = word.suffixIds[word.suffixIds.length - 1];
  const prev = prevId === undefined ? undefined : SUFFIXES[prevId];
  const kiSeen = word.suffixIds.includes('REL_KI');
  let ok: boolean;
  switch (def.slot) {
    case 'DER':
      ok = prev === undefined || prev.slot === 'DER';
      break;
    case 'PLURAL':
      ok = prev === undefined || prev.slot === 'DER' || prev.slot === 'KI';
      break;
    case 'POSS':
      ok = !kiSeen && (prev === undefined || prev.slot === 'DER' || prev.slot === 'PLURAL');
      break;
    case 'CASE':
      ok = prev === undefined || prev.slot !== 'CASE';
      break;
    case 'KI':
      ok =
        prev === undefined
          ? word.info.temporal === true
          : prev.slot === 'CASE' && prev.kiHost === true;
      break;
  }
  if (ok) return null;
  if (def.slot === 'KI') return t('morph.orderKi');
  // Every failing non-KI case above has a previous suffix.
  return t('morph.order', { prev: (prev as SuffixDef).category, next: def.category });
}

// ---------------------------------------------------------------------------
// Realisation (spec §6.3 rules 1–7)
// ---------------------------------------------------------------------------
function shouldSoften(word: Word): boolean {
  if (SOFTENING[lastChar(word.surface)] === undefined) return false;
  if (word.info.noSoften) return false;
  if (word.info.soften) return true;
  if (word.suffixIds.length > 0) return true; // suffix-final stop, word is polysyllabic
  return syllableCount(word.surface) >= 2;
}

/** Expands the leading optional segment and the pronominal n into a plain pattern. */
function resolvePattern(word: Word, def: SuffixDef): string {
  const m = /^\(([ynsI])\)/.exec(def.template);
  let prefix = '';
  let rest = def.template;
  if (m) {
    rest = def.template.slice(m[0].length);
    const buffer = m[1] as string;
    const vowelEnd = endsWithVowel(word.surface);
    if (buffer === 'I') {
      if (!vowelEnd) prefix = 'I';
      else if (word.info.bufferY) prefix = 'yI';
    } else if (vowelEnd) {
      prefix = word.info.bufferY ? 'y' : buffer;
    }
  }
  if (word.pronominalN && def.pronominalN !== undefined) {
    prefix = def.pronominalN === 'prefix' ? 'n' + prefix : 'n';
  }
  return prefix + rest;
}

interface Realization {
  /** Modified last morpheme of the base (kitap → kitab). */
  last: string;
  stem: string;
  suffix: string;
}

function realize(word: Word, def: SuffixDef): Realization {
  const lastMorpheme = word.morphemes[word.morphemes.length - 1] as string;
  const head = word.surface.slice(0, word.surface.length - lastMorpheme.length);

  if (def.invariant) {
    const suffix = word.info.kiRounded && word.suffixIds.length === 0 ? 'kü' : 'ki';
    return { last: lastMorpheme, stem: word.surface, suffix };
  }

  const pattern = resolvePattern(word, def);
  const first = pattern[0] as string;
  const vowelInitial = first === 'A' || first === 'I' || isVowel(first);

  let last = lastMorpheme;
  if (vowelInitial) {
    if (word.info.vowelDrop) last = dropLastVowel(last);
    if (word.info.geminate) last = geminate(last);
    else if (shouldSoften(word)) last = soften(last);
  }
  const stem = head + last;

  let governing = word.harmonyOverride ?? (lastVowel(stem) as Vowel);
  let prev = lastChar(stem);
  let suffix = '';
  for (const ch of pattern) {
    let out: string;
    if (ch === 'A') out = harmonizeA(governing);
    else if (ch === 'I') out = harmonizeI(governing);
    else if (ch === 'D') out = assimilateD(prev);
    else if (ch === 'C') out = assimilateC(prev);
    else out = ch;
    if (isVowel(out)) governing = out;
    suffix += out;
    prev = out;
  }
  return { last, stem, suffix };
}

// ---------------------------------------------------------------------------
// Explanations for strictVariant failures
// ---------------------------------------------------------------------------
const frontDesc = (v: string) => t(isFront(v) ? 'morph.front' : 'morph.back');
const roundDesc = (v: string) => t(isRounded(v) ? 'morph.rounded' : 'morph.unrounded');

function harmonyExplanation(word: Word, r: Realization, form: string): string {
  const expected = vowelsOf(r.suffix);
  const given = vowelsOf(form);
  const idx = expected.findIndex((v, i) => v !== given[i]);
  const cardVowel = given[idx] as Vowel;
  if (idx === 0 && word.harmonyOverride !== undefined) {
    return t('morph.vowelHarmonyException', {
      base: word.surface,
      last: lastVowel(r.stem) as string,
      form,
      formDesc: frontDesc(cardVowel),
    });
  }
  const governing = idx === 0 ? (lastVowel(r.stem) as Vowel) : (expected[idx - 1] as Vowel);
  const byFront = isFront(governing) !== isFront(cardVowel);
  const desc = byFront ? frontDesc : roundDesc;
  return t('morph.vowelHarmony', {
    last: governing,
    lastDesc: desc(governing),
    form,
    formDesc: desc(cardVowel),
  });
}

const ASSIMILATION_PAIRS = new Set(['dt', 'td', 'cç', 'çc']);

function consonantExplanation(word: Word, def: SuffixDef, r: Realization, form: string): string {
  const expected = r.suffix;
  const base = word.surface;
  if (word.pronominalN && def.pronominalN !== undefined && !form.startsWith('n')) {
    return t('morph.pronominalN', { base, expected });
  }
  if (def.template.startsWith('(') && form.length !== expected.length) {
    const key = endsWithVowel(base) ? 'morph.bufferVowelEnd' : 'morph.bufferConsonantEnd';
    return t(key, { base, expected });
  }
  const i = Array.from(expected).findIndex((ch, j) => ch !== form[j]);
  if (ASSIMILATION_PAIRS.has(`${expected[i]}${form[i]}`)) {
    const prev = i === 0 ? lastChar(r.stem) : (expected[i - 1] as string);
    return isHard(prev)
      ? t('morph.consonantHard', { base, last: prev, expected })
      : t('morph.consonantSoft', { base, expected });
  }
  return t('morph.consonantGeneric', { expected });
}

function variantError(word: Word, def: SuffixDef, r: Realization, form: string): ApplyResult {
  const expected = vowelsOf(r.suffix);
  const given = vowelsOf(form);
  const harmonyBroken = expected.length === given.length && expected.some((v, i) => v !== given[i]);
  return harmonyBroken
    ? fail('VOWEL_HARMONY', harmonyExplanation(word, r, form))
    : fail('CONSONANT', consonantExplanation(word, def, r, form));
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export function createEngine(lexicon: Lexicon): Engine {
  function makeWord(root: string): Word {
    const w = trNormalize(root);
    if (!isTrWord(w) || lastVowel(w) === undefined) {
      throw new Error(`Invalid root: "${root}"`);
    }
    const info = lexicon.info(w) ?? {};
    return {
      root: w,
      surface: w,
      morphemes: [w],
      suffixIds: [],
      info,
      harmonyOverride: info.frontOverride ? frontOf(lastVowel(w) as Vowel) : undefined,
      pronominalN: false,
    };
  }

  function applySuffix(base: Word, card: SuffixCard, opts?: ApplyOptions): ApplyResult {
    const def = SUFFIXES[card.id];
    const order = orderError(base, def);
    if (order !== null) return fail('ORDER', order);

    const r = realize(base, def);
    if (opts?.strictVariant && card.form !== undefined) {
      const form = trLower(card.form);
      if (form !== r.suffix) return variantError(base, def, r, form);
    }

    const surface = r.stem + r.suffix;
    const isDer = def.slot === 'DER';
    if (isDer && !lexicon.isDerived(surface)) {
      return fail('NOT_LEXICAL', t('morph.notLexical', { surface }));
    }

    const info: RootInfo = isDer ? (lexicon.info(surface) ?? {}) : {};
    const morphemes = [...base.morphemes.slice(0, -1), r.last, r.suffix];
    const word: Word = {
      root: base.root,
      surface,
      morphemes,
      suffixIds: [...base.suffixIds, def.id],
      info,
      harmonyOverride: info.frontOverride
        ? frontOf(lastVowel(surface) as Vowel)
        : vowelsOf(r.suffix).length > 0
          ? undefined
          : base.harmonyOverride,
      pronominalN: def.setsPronominalN === true,
    };
    return { ok: true, surface, morphemes, word };
  }

  function derive(root: string, suffixIds: readonly SuffixId[]): ApplyResult {
    let word = makeWord(root);
    for (const id of suffixIds) {
      const r = applySuffix(word, { id });
      if (!r.ok) return r;
      word = r.word;
    }
    return { ok: true, surface: word.surface, morphemes: [...word.morphemes], word };
  }

  function enumerateChains(root: string, maxDepth: number): ChainTree {
    const build = (word: Word, depth: number, suffixId?: SuffixId): ChainTree => {
      const children: ChainTree[] = [];
      if (depth < maxDepth) {
        for (const id of SUFFIX_IDS) {
          const r = applySuffix(word, { id });
          if (r.ok) children.push(build(r.word, depth + 1, id));
        }
      }
      const node: ChainTree = { word, surface: word.surface, children };
      if (suffixId !== undefined) node.suffixId = suffixId;
      return node;
    };
    return build(makeWord(root), 0);
  }

  return { makeWord, applySuffix, derive, enumerateChains };
}

// ---------------------------------------------------------------------------
// Tree helpers (used by the level generator to pick Ek Turu roots, spec §8.7)
// ---------------------------------------------------------------------------
export function treeHeight(tree: ChainTree): number {
  return tree.children.reduce((h, c) => Math.max(h, 1 + treeHeight(c)), 0);
}

export function treeSize(tree: ChainTree): number {
  return tree.children.reduce((n, c) => n + treeSize(c), 1);
}

/**
 * The "best" chain: deepest path; ties broken by the larger subtree (more branching), then by
 * catalogue order. Deterministic.
 */
export function bestChain(tree: ChainTree): SuffixId[] {
  const path: SuffixId[] = [];
  let node = tree;
  while (node.children.length > 0) {
    let best = node.children[0] as ChainTree;
    let bestH = treeHeight(best);
    let bestS = treeSize(best);
    for (const c of node.children.slice(1)) {
      const h = treeHeight(c);
      const s = treeSize(c);
      if (h > bestH || (h === bestH && s > bestS)) {
        best = c;
        bestH = h;
        bestS = s;
      }
    }
    path.push(best.suffixId as SuffixId);
    node = best;
  }
  return path;
}

const DEFAULT_ENGINE = createEngine(CORE_LEXICON);

export const makeWord = DEFAULT_ENGINE.makeWord;
export const applySuffix = DEFAULT_ENGINE.applySuffix;
export const derive = DEFAULT_ENGINE.derive;
export const enumerateChains = DEFAULT_ENGINE.enumerateChains;
