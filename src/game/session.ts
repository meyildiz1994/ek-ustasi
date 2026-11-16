/**
 * One level being played: pure state transitions (no React, no storage). The store wraps these and
 * persists the session after every change so a half-finished level resumes exactly (spec §14).
 */
import type { Rng } from '../utils/rng';
import {
  buildGrid,
  emptyProgress,
  isSolved,
  markFound,
  type CellKey,
  type GridModel,
  type GridProgress,
} from './grid';
import { HINT_COST, hintCell, hintLetter, hintWord } from './hints';
import type { Level } from './level';
import { initialCombo, nextCombo, stars, wordScore, COINS, type ComboState } from './scoring';
import { classifyWord, type WordResult } from './validate';
import { shuffleOrder } from './wheel';

export interface Session {
  levelId: number;
  progress: GridProgress;
  bonusFound: string[];
  hintsUsed: number;
  /** Wheel order: order[i] = index into level.letters shown at wheel slot i. */
  order: number[];
  score: number;
  combo: ComboState;
}

export function newSession(level: Level): Session {
  return {
    levelId: level.id,
    progress: emptyProgress(),
    bonusFound: [],
    hintsUsed: 0,
    order: level.letters.map((_, i) => i),
    score: 0,
    combo: initialCombo(),
  };
}

const modelCache = new Map<number, GridModel>();
export function gridOf(level: Level): GridModel {
  let m = modelCache.get(level.id);
  if (!m) {
    m = buildGrid(level.words);
    modelCache.set(level.id, m);
    if (modelCache.size > 4) modelCache.delete(modelCache.keys().next().value as number);
  }
  return m;
}

export interface SubmitOutcome {
  session: Session;
  result: WordResult;
  /** Coins earned by this word (target +1). Bonus coins are counted by the caller's counter. */
  coins: number;
  /** Combo multiplier applied (target words only). */
  multiplier: number;
  solved: boolean;
}

export function submitWord(level: Level, s: Session, word: string, now: number): SubmitOutcome {
  const model = gridOf(level);
  const result = classifyWord(word, {
    targets: new Set(model.byWord.keys()),
    bonus: new Set(level.bonus),
    found: s.progress.found,
    bonusFound: s.bonusFound,
  });
  if (result === 'target') {
    const combo = nextCombo(s.combo, now);
    const progress = markFound(model, s.progress, word);
    const session = {
      ...s,
      progress,
      combo: combo.state,
      score: s.score + wordScore(word, combo.multiplier),
    };
    return {
      session,
      result,
      coins: COINS.targetWord,
      multiplier: combo.multiplier,
      solved: isSolved(model, progress),
    };
  }
  if (result === 'bonus') {
    return {
      session: { ...s, bonusFound: [...s.bonusFound, word] },
      result,
      coins: 0,
      multiplier: 1,
      solved: false,
    };
  }
  return { session: s, result, coins: 0, multiplier: 1, solved: false };
}

export type HintRequest =
  { kind: 'letter' } | { kind: 'targeted'; cell: CellKey } | { kind: 'word'; word?: string };

export interface HintOutcome {
  session: Session;
  cost: number;
  opened: CellKey[];
  completed: string[];
  solved: boolean;
}

/** Applies a paid hint. Returns null when the player cannot afford it or it would open nothing. */
export function useHint(
  level: Level,
  s: Session,
  req: HintRequest,
  coins: number,
  rng: Rng,
): HintOutcome | null {
  const cost = HINT_COST[req.kind];
  if (coins < cost) return null;
  const model = gridOf(level);
  const r =
    req.kind === 'letter'
      ? hintLetter(model, s.progress, rng)
      : req.kind === 'targeted'
        ? hintCell(model, s.progress, req.cell)
        : hintWord(model, s.progress, rng, req.word);
  if (r.opened.length === 0) return null;
  return {
    session: { ...s, progress: r.progress, hintsUsed: s.hintsUsed + 1 },
    cost,
    opened: r.opened,
    completed: r.completed,
    solved: isSolved(model, r.progress),
  };
}

export const shuffleSession = (s: Session, rng: Rng): Session => ({
  ...s,
  order: shuffleOrder(s.order, rng),
});

export const sessionStars = (s: Session): 1 | 2 | 3 => stars(s.hintsUsed);
