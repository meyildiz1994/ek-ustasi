/** Helpers / power-ups (spec §4.4). Costs in coins. */
import type { Rng } from '../utils/rng';
import {
  settle,
  unfoundWords,
  visibleCells,
  type CellKey,
  type GridModel,
  type GridProgress,
} from './grid';

export const HINT_COST = {
  shuffle: 0,
  letter: 25,
  targeted: 50,
  word: 100,
  suffix: 40,
} as const;

export type HintKind = keyof typeof HINT_COST;

export interface HintResult {
  progress: GridProgress;
  /** Cells opened by this hint, in order. */
  opened: CellKey[];
  /** Words completed as a side effect. */
  completed: string[];
}

function open(model: GridModel, progress: GridProgress, keys: CellKey[]): HintResult {
  const visible = visibleCells(model, progress);
  const opened = keys.filter((k) => !visible.has(k));
  if (opened.length === 0) return { progress, opened, completed: [] };
  const next = settle(model, { ...progress, revealed: [...progress.revealed, ...opened] });
  return { progress: next.progress, opened, completed: next.completed };
}

/** 💡 Opens the first hidden letter of a random unfound word. */
export function hintLetter(model: GridModel, progress: GridProgress, rng: Rng): HintResult {
  const visible = visibleCells(model, progress);
  const candidates = unfoundWords(model, progress).filter((w) =>
    w.cells.some((k) => !visible.has(k)),
  );
  if (candidates.length === 0) return { progress, opened: [], completed: [] };
  const word = rng.pick(candidates);
  const cell = word.cells.find((k) => !visible.has(k)) as CellKey;
  return open(model, progress, [cell]);
}

/** 🎯 Opens the cell the player picked. */
export function hintCell(model: GridModel, progress: GridProgress, key: CellKey): HintResult {
  if (!model.cells.has(key)) return { progress, opened: [], completed: [] };
  return open(model, progress, [key]);
}

/** Opens a whole word (a random unfound one unless `word` is given). */
export function hintWord(
  model: GridModel,
  progress: GridProgress,
  rng: Rng,
  word?: string,
): HintResult {
  const unfound = unfoundWords(model, progress);
  const target =
    word === undefined
      ? unfound.length > 0
        ? rng.pick(unfound)
        : undefined
      : unfound.find((w) => w.w === word);
  if (!target) return { progress, opened: [], completed: [] };
  return open(model, progress, target.cells);
}
