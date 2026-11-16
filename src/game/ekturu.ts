/**
 * Ek Turu round (spec §5): pure state transitions on top of the morphology engine. The player
 * draws a path through suffix cards on the wheel; each card is applied in order with
 * strictVariant, the first mistake ends the round (score so far is kept), "Topla" cashes in.
 */
import type { ApplyResult, Engine, FailReason, Word } from '../morph/engine';
import { SUFFIXES, type SuffixCard, type SuffixId } from '../morph/suffixes';
import type { EkTuru } from './level';
import { BIG_EK_TURU_REWARD, chainScore, ekTuruCoins } from './scoring';

/** Tutorial cards shown the first time each idea comes up (spec §5.4). */
export type EkTip = 'intro' | 'harmony' | 'softening' | 'buffer' | 'assimilation' | 'order';

export interface EkStep {
  card: SuffixCard;
  surface: string;
  morphemes: string[];
}

export interface EkSession {
  levelId: number;
  ek: EkTuru;
  cards: SuffixCard[];
  word: Word;
  steps: EkStep[];
  /** Steps made with archiphoneme cards (lower multiplier). */
  archSteps: number;
  score: number;
  /** Goal shown to the player: the level's targetScore, scaled down when archiphoneme cards replace
   * concrete ones on the best chain (they score ×1.5 instead of ×2). */
  target: number;
  status: 'playing' | 'broken' | 'collected';
  error: { reason: FailReason; explanation: string; card: SuffixCard; tried: string } | null;
  /** Card index highlighted by the Ek hint. */
  hinted: number | null;
}

/** Archiphoneme display: lIk → -lXk, (y)A → -(y)A (spec §5.3). */
export function cardLabel(card: SuffixCard): string {
  if (card.form !== undefined) return `-${card.form}`;
  return `-${SUFFIXES[card.id].template.replace(/I/g, 'X')}`;
}

export const cardCategory = (card: SuffixCard): string => SUFFIXES[card.id].category;

/**
 * The wheel's cards. On archiphoneme levels (1001+) up to two suffixes of the best chain that come
 * in several variants are offered as one archiphoneme card instead (DECISIONS D-020).
 */
export function wheelCards(ek: EkTuru): SuffixCard[] {
  const cards: SuffixCard[] = ek.cards.map((c) => ({ id: c.id, form: c.form }));
  if (!ek.archiphoneme) return cards;
  const counts = new Map<SuffixId, number>();
  for (const c of cards) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  const arch = [...new Set(ek.bestChain)]
    .filter((id) => (counts.get(id) ?? 0) >= 2)
    .sort((a, b) => (counts.get(b) as number) - (counts.get(a) as number))
    .slice(0, 2);
  const out: SuffixCard[] = [];
  for (const c of cards) {
    if (!arch.includes(c.id)) out.push(c);
    else if (!out.some((o) => o.id === c.id && o.form === undefined)) out.push({ id: c.id });
  }
  return out;
}

export function newEkSession(engine: Engine, levelId: number, ek: EkTuru): EkSession {
  const cards = wheelCards(ek);
  const archIds = new Set(cards.filter((c) => c.form === undefined).map((c) => c.id));
  const k = ek.bestChain.filter((id) => archIds.has(id)).length;
  const best = engine.derive(ek.root, ek.bestChain);
  const n = ek.bestChain.length;
  const target =
    k === 0 || !best.ok
      ? ek.targetScore
      : Math.round(
          (ek.targetScore * chainScore(best.surface, n - k, k)) / chainScore(best.surface, n) / 10,
        ) * 10;
  return {
    levelId,
    ek,
    cards,
    word: engine.makeWord(ek.root),
    steps: [],
    archSteps: 0,
    score: 0,
    target,
    status: 'playing',
    error: null,
    hinted: null,
  };
}

/** What the word would look like with these cards glued on as shown (no validation). */
export function naivePreview(s: EkSession, cards: readonly SuffixCard[]): string {
  return s.word.surface + cards.map((c) => c.form ?? cardLabel(c).slice(1)).join('');
}

/** Tips a successful step teaches (first time only, filtered by the caller). */
export function tipsForStep(prev: Word, card: SuffixCard, r: Extract<ApplyResult, { ok: true }>) {
  const tips: EkTip[] = [];
  const def = SUFFIXES[card.id];
  const suffix = r.morphemes[r.morphemes.length - 1] as string;
  const stemBefore = prev.morphemes[prev.morphemes.length - 1] as string;
  const stemAfter = r.morphemes[r.morphemes.length - 2] as string;
  if (stemBefore !== stemAfter) tips.push('softening');
  const buffer = /^\(([yns])\)/.exec(def.template)?.[1];
  if (
    (buffer !== undefined && suffix.startsWith(buffer)) ||
    (prev.pronominalN && suffix.startsWith('n'))
  )
    tips.push('buffer');
  if (
    (def.template.includes('D') && suffix.includes('t')) ||
    (def.template.includes('C') && suffix.includes('ç'))
  )
    tips.push('assimilation');
  return tips;
}

/** A consonant mistake is either a missing/extra buffer letter or a d/t, c/ç mix-up. */
function consonantTip(engine: Engine, word: Word, card: SuffixCard): EkTip {
  const r = engine.applySuffix(word, { id: card.id });
  const expected = r.ok ? (r.morphemes[r.morphemes.length - 1] as string) : '';
  return card.form !== undefined && card.form.length !== expected.length
    ? 'buffer'
    : 'assimilation';
}

export function tipForError(reason: FailReason): EkTip | null {
  if (reason === 'VOWEL_HARMONY') return 'harmony';
  if (reason === 'CONSONANT') return 'assimilation';
  if (reason === 'ORDER') return 'order';
  return null;
}

export interface EkApplyOutcome {
  session: EkSession;
  /** Steps that succeeded in this move (0 … cards.length). */
  added: number;
  failed: boolean;
  tips: EkTip[];
}

/** Applies the cards in order; stops at the first error, which ends the round. */
export function applyCards(
  engine: Engine,
  s: EkSession,
  indices: readonly number[],
): EkApplyOutcome {
  if (s.status !== 'playing' || indices.length === 0) {
    return { session: s, added: 0, failed: false, tips: [] };
  }
  let word = s.word;
  const steps = [...s.steps];
  let archSteps = s.archSteps;
  const tips: EkTip[] = [];
  let error: EkSession['error'] = null;
  for (const i of indices) {
    const card = s.cards[i];
    if (!card) continue;
    const r = engine.applySuffix(word, card, { strictVariant: true });
    if (!r.ok) {
      error = {
        reason: r.reason,
        explanation: r.explanation,
        card,
        tried: naivePreview({ ...s, word }, [card]),
      };
      const tip =
        r.reason === 'CONSONANT' ? consonantTip(engine, word, card) : tipForError(r.reason);
      if (tip) tips.push(tip);
      break;
    }
    tips.push(...tipsForStep(word, card, r));
    word = r.word;
    steps.push({ card, surface: r.surface, morphemes: r.morphemes });
    if (card.form === undefined) archSteps++;
  }
  const added = steps.length - s.steps.length;
  const score =
    steps.length === 0 ? 0 : chainScore(word.surface, steps.length - archSteps, archSteps);
  return {
    session: {
      ...s,
      word,
      steps,
      archSteps,
      // A mistake ends the round but keeps the score reached so far (spec §5.2).
      score,
      status: error ? 'broken' : 'playing',
      error,
      hinted: null,
    },
    added,
    failed: error !== null,
    tips: [...new Set(tips)],
  };
}

/** Cashes in: ends the round with the current score. */
export const collect = (s: EkSession): EkSession =>
  s.status === 'playing' ? { ...s, status: 'collected', hinted: null } : s;

/** Coins for a finished round: ¼ of the score, 3× on a Big Ek Turu (spec §5.1, §13.1). */
export const ekReward = (s: EkSession): number =>
  ekTuruCoins(s.score) * (s.ek.big ? BIG_EK_TURU_REWARD : 1);

/**
 * Ek hint (spec §4.4): a card that validly continues the word — the best chain's next suffix when
 * the player is still on it, otherwise any card that applies. null when nothing continues.
 */
export function hintCard(engine: Engine, s: EkSession): number | null {
  if (s.status !== 'playing') return null;
  const ok = (i: number) =>
    engine.applySuffix(s.word, s.cards[i] as SuffixCard, { strictVariant: true }).ok;
  const onBest = s.word.suffixIds.every((id, i) => s.ek.bestChain[i] === id);
  const next = onBest ? s.ek.bestChain[s.steps.length] : undefined;
  const indices = s.cards.map((_, i) => i);
  const preferred = indices.find((i) => s.cards[i]?.id === next && ok(i));
  return preferred ?? indices.find(ok) ?? null;
}

/** Multiplier shown on the badge: ×2 per suffix (×1.5 for archiphoneme cards). */
export const ekMultiplier = (s: EkSession): number =>
  2 ** (s.steps.length - s.archSteps) * 1.5 ** s.archSteps;
