/**
 * Crossword grid model (spec §4.2). Pure data: the store keeps `GridProgress` (plain arrays, easy to
 * persist) and these helpers derive everything else.
 */
import type { PlacedWord } from './level';

export type CellKey = `${number},${number}`;

export const cellKey = (r: number, c: number): CellKey => `${r},${c}`;

export interface GridCell {
  key: CellKey;
  r: number;
  c: number;
  letter: string;
  /** Indices into GridModel.words. */
  words: number[];
}

export interface GridWord {
  w: string;
  d: PlacedWord['d'];
  /** Cells in reading order (left→right or top→bottom) — also the fill animation order. */
  cells: CellKey[];
}

export interface GridModel {
  rows: number;
  cols: number;
  cells: Map<CellKey, GridCell>;
  words: GridWord[];
  byWord: Map<string, number>;
}

/** What the player has done so far. Arrays (not Sets) so it serialises as-is. */
export interface GridProgress {
  found: string[];
  /** Cells opened by hints. */
  revealed: CellKey[];
}

export const emptyProgress = (): GridProgress => ({ found: [], revealed: [] });

export function buildGrid(placed: readonly PlacedWord[]): GridModel {
  const cells = new Map<CellKey, GridCell>();
  const words: GridWord[] = [];
  let rows = 0;
  let cols = 0;
  placed.forEach((p, wi) => {
    const keys: CellKey[] = [];
    [...p.w].forEach((letter, i) => {
      const r = p.d === 'V' ? p.r + i : p.r;
      const c = p.d === 'H' ? p.c + i : p.c;
      rows = Math.max(rows, r + 1);
      cols = Math.max(cols, c + 1);
      const key = cellKey(r, c);
      const cell = cells.get(key);
      if (cell) {
        if (cell.letter !== letter) throw new Error(`Grid conflict at ${key}`);
        cell.words.push(wi);
      } else {
        cells.set(key, { key, r, c, letter, words: [wi] });
      }
      keys.push(key);
    });
    words.push({ w: p.w, d: p.d, cells: keys });
  });
  return { rows, cols, cells, words, byWord: new Map(words.map((w, i) => [w.w, i])) };
}

/** Cells whose letter is shown: part of a found word, or revealed by a hint. */
export function visibleCells(model: GridModel, progress: GridProgress): Set<CellKey> {
  const out = new Set<CellKey>(progress.revealed);
  for (const w of progress.found) {
    const i = model.byWord.get(w);
    if (i !== undefined) for (const k of (model.words[i] as GridWord).cells) out.add(k);
  }
  return out;
}

export const isFound = (progress: GridProgress, word: string): boolean =>
  progress.found.includes(word);

export function unfoundWords(model: GridModel, progress: GridProgress): GridWord[] {
  return model.words.filter((w) => !progress.found.includes(w.w));
}

export const isSolved = (model: GridModel, progress: GridProgress): boolean =>
  model.words.every((w) => progress.found.includes(w.w));

/**
 * Marks words whose cells are all visible as found (a hint can complete a word). Returns the new
 * progress and the words completed this way, in grid order.
 */
export function settle(
  model: GridModel,
  progress: GridProgress,
): { progress: GridProgress; completed: string[] } {
  const visible = visibleCells(model, progress);
  const completed = model.words
    .filter((w) => !progress.found.includes(w.w) && w.cells.every((k) => visible.has(k)))
    .map((w) => w.w);
  if (completed.length === 0) return { progress, completed };
  return { progress: { ...progress, found: [...progress.found, ...completed] }, completed };
}

/** Records a found target word. No-op for non-grid or already-found words. */
export function markFound(model: GridModel, progress: GridProgress, word: string): GridProgress {
  if (!model.byWord.has(word) || progress.found.includes(word)) return progress;
  return settle(model, { ...progress, found: [...progress.found, word] }).progress;
}
