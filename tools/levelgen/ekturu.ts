/**
 * Ek Turu data (spec §8.7): root choice, best chain, cards, target score.
 *
 * Root: the level word with the richest attested derivation tree (derivations.json: height, then
 * size). Chain: the deepest derivation path, then a fixed inflection tail
 *   PLURAL → POSS_1PL → CASE_LOC → REL_KI → (PLURAL → CASE_LOC → REL_KI)* …
 * cut to maxDepth. Every chain is re-derived with the engine; a failing chain is never emitted.
 */
import type { DerivationTree } from '../../src/dict/lexicon';
import type { EkCard, EkTuru } from '../../src/game/level';
import { chainScore } from '../../src/game/scoring';
import { SUFFIXES, type Engine, type SuffixId, type Word } from '../../src/morph';
import type { Rng } from './prng';

export interface TreeStats {
  height: number;
  size: number;
}

export function derivationStats(tree: DerivationTree | undefined): TreeStats {
  if (!tree) return { height: 0, size: 0 };
  let height = 0;
  let size = 0;
  for (const [, sub] of Object.values(tree)) {
    const s = derivationStats(sub);
    height = Math.max(height, 1 + s.height);
    size += 1 + s.size;
  }
  return { height, size };
}

/** Deepest derivation path; ties → larger subtree → catalogue (key) order. */
export function deepestDerivation(tree: DerivationTree | undefined): SuffixId[] {
  const path: SuffixId[] = [];
  let node = tree;
  while (node && Object.keys(node).length > 0) {
    let best: { id: SuffixId; sub: DerivationTree | undefined; s: TreeStats } | undefined;
    for (const id of Object.keys(node).sort()) {
      const sub = (node[id] as [string, DerivationTree?])[1];
      const s = derivationStats(sub);
      if (
        best === undefined ||
        s.height > best.s.height ||
        (s.height === best.s.height && s.size > best.s.size)
      ) {
        best = { id: id as SuffixId, sub, s };
      }
    }
    if (!best) break;
    path.push(best.id);
    node = best.sub;
  }
  return path;
}

const TAIL_HEAD: SuffixId[] = ['PLURAL', 'POSS_1PL', 'CASE_LOC', 'REL_KI'];
const TAIL_LOOP: SuffixId[] = ['PLURAL', 'CASE_LOC', 'REL_KI'];

export function inflectionTail(n: number): SuffixId[] {
  const out: SuffixId[] = [];
  for (let i = 0; out.length < n; i++) {
    out.push(
      i < TAIL_HEAD.length
        ? (TAIL_HEAD[i] as SuffixId)
        : (TAIL_LOOP[(i - TAIL_HEAD.length) % TAIL_LOOP.length] as SuffixId),
    );
  }
  return out;
}

export { chainScore };

export function chainFor(
  engine: Engine,
  root: string,
  tree: DerivationTree | undefined,
  maxDepth: number,
): SuffixId[] {
  const der = deepestDerivation(tree).slice(0, maxDepth);
  const chain = [...der, ...inflectionTail(maxDepth - der.length)];
  // Trim from the end until the engine accepts it (should not happen; guards odd roots).
  while (chain.length > 0 && !engine.derive(root, chain).ok) chain.pop();
  return chain;
}

interface Step {
  base: Word;
  id: SuffixId;
  form: string;
}

function steps(engine: Engine, root: string, chain: readonly SuffixId[]): Step[] {
  const out: Step[] = [];
  let word = engine.makeWord(root);
  for (const id of chain) {
    const r = engine.applySuffix(word, { id });
    if (!r.ok) throw new Error(`Chain ${root}+${chain.join('+')} fails at ${id}`);
    out.push({ base: word, id, form: r.morphemes[r.morphemes.length - 1] as string });
    word = r.word;
  }
  return out;
}

const A_CLASS = ['a', 'e'];
const I_CLASS = ['ı', 'i', 'u', 'ü'];
const FRONT_FLIP: Record<string, string> = { a: 'e', e: 'a', ı: 'i', i: 'ı', u: 'ü', ü: 'u' };

/** Wrong-variant forms of a correct suffix form, most instructive (front/back flip) first. */
export function variantDecoys(id: SuffixId, form: string): string[] {
  const tpl = SUFFIXES[id].template;
  const out: string[] = [];
  const add = (f: string) => {
    if (f !== form && !out.includes(f)) out.push(f);
  };
  const chars = [...form];
  // 1. Flip front/back on the first vowel (lik → lık), then on all vowels.
  const firstVowel = chars.findIndex((ch) => FRONT_FLIP[ch] !== undefined);
  if (firstVowel !== -1) {
    const flipped = chars.map((ch) => FRONT_FLIP[ch] ?? ch);
    add(flipped.join(''));
    const one = chars.slice();
    one[firstVowel] = FRONT_FLIP[chars[firstVowel] as string] as string;
    add(one.join(''));
  }
  // 2. Other vowels of the same class (lik → luk, lük).
  chars.forEach((ch, i) => {
    const cls =
      I_CLASS.includes(ch) && tpl.includes('I') ? I_CLASS : A_CLASS.includes(ch) ? A_CLASS : [];
    for (const v of cls) {
      const c = chars.slice();
      c[i] = v;
      add(c.join(''));
    }
  });
  // 3. Voicing of D / C (den → ten, ci → çi).
  if (tpl.includes('D') || tpl.includes('C')) {
    const swap: Record<string, string> = tpl.includes('D')
      ? { d: 't', t: 'd' }
      : { c: 'ç', ç: 'c' };
    const i = chars.findIndex((ch) => swap[ch] !== undefined);
    if (i !== -1) {
      const c = chars.slice();
      c[i] = swap[chars[i] as string] as string;
      add(c.join(''));
    }
  }
  return out;
}

export const cardCount = (maxDepth: number): number =>
  maxDepth <= 3 ? 8 : maxDepth <= 6 ? 10 : 12;

export interface EkTuruInput {
  engine: Engine;
  root: string;
  tree: DerivationTree | undefined;
  maxDepth: number;
  big: boolean;
  archiphoneme: boolean;
  rng: Rng;
}

const cardKey = (c: EkCard) => `${c.id}:${c.form}`;

export function buildEkTuru(input: EkTuruInput): EkTuru {
  const { engine, root, tree, maxDepth, rng } = input;
  const chain = chainFor(engine, root, tree, maxDepth);
  const st = steps(engine, root, chain);
  const n = cardCount(maxDepth);

  // Correct cards of the best chain, in chain order, de-duplicated.
  const valid: EkCard[] = [];
  const validKeys = new Set<string>();
  const addValid = (c: EkCard) => {
    if (!validKeys.has(cardKey(c))) {
      validKeys.add(cardKey(c));
      valid.push(c);
    }
  };
  for (const s of st) addValid({ id: s.id, form: s.form });
  const chainValid = valid.length;

  // One decoy per distinct chain card (wrong harmony / voicing variant).
  const correctForms = new Map<SuffixId, Set<string>>();
  for (const s of st) {
    const set = correctForms.get(s.id) ?? new Set<string>();
    set.add(s.form);
    correctForms.set(s.id, set);
  }
  const decoys: EkCard[] = [];
  const decoyKeys = new Set<string>();
  const addDecoy = (c: EkCard) => {
    const k = cardKey(c);
    if (validKeys.has(k) || decoyKeys.has(k) || correctForms.get(c.id)?.has(c.form)) return false;
    decoyKeys.add(k);
    decoys.push(c);
    return true;
  };
  for (const c of valid.slice(0, chainValid)) {
    for (const f of variantDecoys(c.id, c.form)) if (addDecoy({ id: c.id, form: f })) break;
  }

  // Valid alternatives (other suffixes that continue the chain at some step), until ≥ 40 %.
  const minValid = Math.ceil(n * 0.4);
  const alternatives: EkCard[] = [];
  for (const s of st) {
    for (const id of Object.keys(SUFFIXES) as SuffixId[]) {
      if (id === s.id) continue;
      const r = engine.applySuffix(s.base, { id });
      if (r.ok) alternatives.push({ id, form: r.morphemes[r.morphemes.length - 1] as string });
    }
  }
  for (const c of rng.shuffle(alternatives)) {
    if (valid.length >= minValid || valid.length + decoys.length >= n) break;
    if (!correctForms.get(c.id)?.has(c.form) && decoyKeys.has(cardKey(c))) continue;
    addValid(c);
  }

  // Fill the rest with more decoys: further variants, then out-of-order suffixes.
  const extra: EkCard[] = [];
  for (const c of valid)
    for (const f of variantDecoys(c.id, c.form)) extra.push({ id: c.id, form: f });
  for (const c of rng.shuffle(extra)) {
    if (valid.length + decoys.length >= n) break;
    addDecoy(c);
  }

  let cards = [...valid, ...decoys];
  if (cards.length > 12) {
    // Keep every chain card. A decoy is only required for a suffix whose chain cards all share one
    // form: when the chain already shows two forms of it (ler / lar), each is the other's decoy.
    const chainCards = valid.slice(0, chainValid);
    const formsOf = (id: SuffixId) =>
      new Set(chainCards.filter((c) => c.id === id).map((c) => c.form));
    const required = decoys.filter((d) => formsOf(d.id).size === 1);
    const optional = decoys.filter((d) => formsOf(d.id).size !== 1);
    cards = [...chainCards, ...required, ...optional].slice(0, 12);
  }
  cards = rng.shuffle(cards);

  const prefix = Math.max(1, chain.length - 1);
  const target = engine.derive(root, chain.slice(0, prefix));
  const targetScore = target.ok
    ? Math.round((chainScore(target.surface, prefix) * 2) / 3 / 10) * 10
    : 0;

  return {
    root,
    bestChain: chain,
    maxDepth,
    cards,
    targetScore,
    big: input.big,
    archiphoneme: input.archiphoneme,
  };
}
