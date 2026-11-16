/**
 * Crossword placement (spec §8.3): longest words first, first word horizontal in the centre, every
 * further word must cross an existing letter. Backtracking search + up to 200 random restarts; the
 * best layout wins. Words that do not fit fall back to bonus words.
 */
import { MAX_GRID, type Direction, type PlacedWord } from '../../src/game/level';
import type { Rng } from './prng';

const OFF = 64;
const key = (r: number, c: number) => (r + OFF) * 256 + (c + OFF);
const H = 1;
const V = 2;
const dirBit = (d: Direction) => (d === 'H' ? H : V);

export interface GridOptions {
  restarts: number;
  /** Search nodes per restart (backtracking budget). */
  nodeBudget: number;
  /** Candidate positions tried per word at each search node. */
  branching: number;
  /** Target cols / rows ratio (spec: ~1:1.2 → a bit wider than tall). */
  aspect: number;
  maxSize: number;
}

export const DEFAULT_GRID_OPTIONS: GridOptions = {
  restarts: 200,
  nodeBudget: 400,
  branching: 3,
  aspect: 1.2,
  maxSize: MAX_GRID,
};

export interface Layout {
  placed: PlacedWord[];
  unplaced: string[];
  rows: number;
  cols: number;
  intersections: number;
  cells: number;
  score: number;
}

class Board {
  readonly letters = new Map<number, string>();
  readonly dirs = new Map<number, number>();
  readonly placed: PlacedWord[] = [];
  minR = 0;
  maxR = -1;
  minC = 0;
  maxC = -1;
  intersections = 0;

  get empty() {
    return this.placed.length === 0;
  }

  /** Number of crossings if the word fits at (r, c, d), otherwise -1. */
  check(w: string, r: number, c: number, d: Direction, maxSize: number): number {
    const dr = d === 'V' ? 1 : 0;
    const dc = d === 'H' ? 1 : 0;
    const n = w.length;
    if (this.letters.has(key(r - dr, c - dc)) || this.letters.has(key(r + dr * n, c + dc * n))) {
      return -1;
    }
    const minR = Math.min(this.empty ? r : this.minR, r);
    const maxR = Math.max(this.empty ? r : this.maxR, r + dr * (n - 1));
    const minC = Math.min(this.empty ? c : this.minC, c);
    const maxC = Math.max(this.empty ? c : this.maxC, c + dc * (n - 1));
    if (maxR - minR + 1 > maxSize || maxC - minC + 1 > maxSize) return -1;
    let crossings = 0;
    const bit = dirBit(d);
    for (let i = 0; i < n; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const k = key(rr, cc);
      const existing = this.letters.get(k);
      if (existing !== undefined) {
        if (existing !== w[i] || ((this.dirs.get(k) as number) & bit) !== 0) return -1;
        crossings++;
      } else if (
        this.letters.has(key(rr + dc, cc + dr)) ||
        this.letters.has(key(rr - dc, cc - dr))
      ) {
        return -1;
      }
    }
    if (crossings === n) return -1;
    return crossings;
  }

  place(w: string, r: number, c: number, d: Direction): number[] {
    const dr = d === 'V' ? 1 : 0;
    const dc = d === 'H' ? 1 : 0;
    const added: number[] = [];
    const bit = dirBit(d);
    for (let i = 0; i < w.length; i++) {
      const k = key(r + dr * i, c + dc * i);
      if (this.letters.has(k)) {
        this.intersections++;
      } else {
        this.letters.set(k, w[i] as string);
        added.push(k);
      }
      this.dirs.set(k, (this.dirs.get(k) ?? 0) | bit);
    }
    this.placed.push({ w, r, c, d });
    this.recomputeBounds();
    return added;
  }

  unplace(added: number[]): void {
    const p = this.placed.pop() as PlacedWord;
    const dr = p.d === 'V' ? 1 : 0;
    const dc = p.d === 'H' ? 1 : 0;
    const addedSet = new Set(added);
    const bit = dirBit(p.d);
    for (let i = 0; i < p.w.length; i++) {
      const k = key(p.r + dr * i, p.c + dc * i);
      if (addedSet.has(k)) {
        this.letters.delete(k);
        this.dirs.delete(k);
      } else {
        this.intersections--;
        this.dirs.set(k, (this.dirs.get(k) as number) & ~bit);
      }
    }
    this.recomputeBounds();
  }

  private recomputeBounds() {
    if (this.placed.length === 0) {
      this.minR = this.minC = 0;
      this.maxR = this.maxC = -1;
      return;
    }
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    for (const p of this.placed) {
      const endR = p.d === 'V' ? p.r + p.w.length - 1 : p.r;
      const endC = p.d === 'H' ? p.c + p.w.length - 1 : p.c;
      minR = Math.min(minR, p.r);
      maxR = Math.max(maxR, endR);
      minC = Math.min(minC, p.c);
      maxC = Math.max(maxC, endC);
    }
    this.minR = minR;
    this.maxR = maxR;
    this.minC = minC;
    this.maxC = maxC;
  }

  /** Every legal placement of `w` crossing the current board. */
  candidates(w: string, maxSize: number): { r: number; c: number; d: Direction; x: number }[] {
    const out: { r: number; c: number; d: Direction; x: number }[] = [];
    const seen = new Set<string>();
    for (const [k, ch] of this.letters) {
      const r = Math.floor(k / 256) - OFF;
      const c = (k % 256) - OFF;
      const used = this.dirs.get(k) as number;
      for (let i = 0; i < w.length; i++) {
        if (w[i] !== ch) continue;
        for (const d of ['H', 'V'] as const) {
          if ((used & dirBit(d)) !== 0) continue;
          const sr = d === 'V' ? r - i : r;
          const sc = d === 'H' ? c - i : c;
          const id = `${sr},${sc},${d}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const x = this.check(w, sr, sc, d, maxSize);
          if (x > 0) out.push({ r: sr, c: sc, d, x });
        }
      }
    }
    return out;
  }

  layoutScore(aspect: number): number {
    if (this.placed.length === 0) return 0;
    const rows = this.maxR - this.minR + 1;
    const cols = this.maxC - this.minC + 1;
    return (
      this.intersections * 10 - Math.abs(Math.log(cols / rows / aspect)) * 8 - rows * cols * 0.3
    );
  }
}

/** Lays out `words` (any order; sorted here by length, longest first). */
export function layoutWords(
  words: readonly string[],
  rng: Rng,
  options: Partial<GridOptions> = {},
): Layout {
  const opt = { ...DEFAULT_GRID_OPTIONS, ...options };
  const base = [...words].sort((a, b) => b.length - a.length);
  let best: { placed: PlacedWord[]; count: number; score: number; x: number } | undefined;

  for (let attempt = 0; attempt < opt.restarts; attempt++) {
    // Restart 0 keeps the given order inside each length group; later ones shuffle it.
    const order =
      attempt === 0
        ? base
        : [...base]
            .map((w) => ({ w, k: rng.next() }))
            .sort((a, b) => b.w.length - a.w.length || a.k - b.k)
            .map((x) => x.w);
    const board = new Board();
    const first = order[0];
    if (first === undefined) break;
    if (first.length > opt.maxSize) continue;
    board.place(first, 0, 0, 'H');
    let budget = opt.nodeBudget;

    const consider = () => {
      const count = board.placed.length;
      const score = board.layoutScore(opt.aspect);
      if (
        best === undefined ||
        count > best.count ||
        (count === best.count && score > best.score)
      ) {
        best = { placed: board.placed.slice(), count, score, x: board.intersections };
      }
    };

    const search = (i: number) => {
      if (budget-- <= 0) return;
      if (i === order.length) {
        consider();
        return;
      }
      const w = order[i] as string;
      const cands = board
        .candidates(w, opt.maxSize)
        .map((p) => {
          const added = board.place(w, p.r, p.c, p.d);
          const s = board.layoutScore(opt.aspect) + rng.next() * 0.5;
          board.unplace(added);
          return { ...p, s };
        })
        .sort((a, b) => b.s - a.s)
        .slice(0, opt.branching);
      for (const p of cands) {
        const added = board.place(w, p.r, p.c, p.d);
        search(i + 1);
        board.unplace(added);
        if (budget <= 0) return;
      }
      // Skipping is always allowed; a skipped word becomes a bonus word.
      if (budget > 0) search(i + 1);
    };
    search(1);
    if (best !== undefined && best.count === base.length && attempt >= 20) break;
  }

  if (best === undefined) {
    return {
      placed: [],
      unplaced: [...words],
      rows: 0,
      cols: 0,
      intersections: 0,
      cells: 0,
      score: 0,
    };
  }
  return normalise(best.placed, words, opt.aspect);
}

function normalise(placed: PlacedWord[], words: readonly string[], aspect: number): Layout {
  const board = new Board();
  const minR = Math.min(...placed.map((p) => p.r));
  const minC = Math.min(...placed.map((p) => p.c));
  const shifted = placed.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC }));
  for (const p of shifted) board.place(p.w, p.r, p.c, p.d);
  const placedSet = new Set(shifted.map((p) => p.w));
  // Reading order: top-to-bottom, then left-to-right, H before V.
  shifted.sort((a, b) => a.r - b.r || a.c - b.c || (a.d === b.d ? 0 : a.d === 'H' ? -1 : 1));
  return {
    placed: shifted,
    unplaced: words.filter((w) => !placedSet.has(w)),
    rows: board.maxR + 1,
    cols: board.maxC + 1,
    intersections: board.intersections,
    cells: board.letters.size,
    score: board.layoutScore(aspect),
  };
}

/** Renders the grid as text rows ('.' = empty). Used by validation, tests and review.html. */
export function renderGrid(placed: readonly PlacedWord[]): string[] {
  if (placed.length === 0) return [];
  const rows = Math.max(...placed.map((p) => (p.d === 'V' ? p.r + p.w.length : p.r + 1)));
  const cols = Math.max(...placed.map((p) => (p.d === 'H' ? p.c + p.w.length : p.c + 1)));
  const g: string[][] = Array.from({ length: rows }, () => new Array<string>(cols).fill('.'));
  for (const p of placed) {
    [...p.w].forEach((ch, i) => {
      const row = g[p.d === 'V' ? p.r + i : p.r] as string[];
      row[p.d === 'H' ? p.c + i : p.c] = ch;
    });
  }
  return g.map((r) => r.join(''));
}
