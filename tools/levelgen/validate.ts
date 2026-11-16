/** Automatic checks (spec §8.8). A level that fails any of them is a bug in the generator. */
import { MAX_GRID, type Level } from '../../src/game/level';
import { tierOf } from './curve';
import type { Dictionary } from './data';
import { maxUses, REPEAT } from './generate';
import { renderGrid } from './grid';
import { bagKey, bagOf, fits } from './letters';

export type Check =
  | 'wordsFromLetters'
  | 'noStrayRuns'
  | 'connected'
  | 'gridSize'
  | 'notBlocked'
  | 'band'
  | 'wordCount'
  | 'ekTuruChain'
  | 'ekTuruCards'
  | 'repetition';

export interface Failure {
  level: number;
  check: Check;
  detail: string;
}

/** Every horizontal / vertical run of ≥ 2 letters, as "r,c,d,word". */
export function runs(grid: readonly string[]): { r: number; c: number; d: 'H' | 'V'; w: string }[] {
  const out: { r: number; c: number; d: 'H' | 'V'; w: string }[] = [];
  const rows = grid.length;
  const cols = rows === 0 ? 0 : (grid[0] as string).length;
  const at = (r: number, c: number) => (grid[r] as string)[c] as string;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (at(r, c) === '.') continue;
      if (c === 0 || at(r, c - 1) === '.') {
        let w = '';
        for (let k = c; k < cols && at(r, k) !== '.'; k++) w += at(r, k);
        if (w.length >= 2) out.push({ r, c, d: 'H', w });
      }
      if (r === 0 || at(r - 1, c) === '.') {
        let w = '';
        for (let k = r; k < rows && at(k, c) !== '.'; k++) w += at(k, c);
        if (w.length >= 2) out.push({ r, c, d: 'V', w });
      }
    }
  }
  return out;
}

export function validateLevel(level: Level, dict: Dictionary): Failure[] {
  const f: Failure[] = [];
  const fail = (check: Check, detail: string) => f.push({ level: level.id, check, detail });
  const bag = bagOf(level.letters.join(''));
  const tier = tierOf(level.id);

  for (const p of level.words) {
    if (!fits(bagOf(p.w), bag)) fail('wordsFromLetters', p.w);
    if (dict.isBlocked(p.w)) fail('notBlocked', p.w);
  }
  const grid = renderGrid(level.words);
  const rows = grid.length;
  const cols = rows === 0 ? 0 : (grid[0] as string).length;
  if (rows > MAX_GRID || cols > MAX_GRID) fail('gridSize', `${rows}×${cols}`);

  const placed = new Set(level.words.map((p) => `${p.r},${p.c},${p.d},${p.w}`));
  const found = runs(grid);
  for (const run of found) {
    const k = `${run.r},${run.c},${run.d},${run.w}`;
    if (!placed.has(k)) fail('noStrayRuns', k);
  }
  if (found.length !== level.words.length)
    fail('noStrayRuns', `${found.length} runs vs ${level.words.length} words`);

  // Connectivity over filled cells.
  const cells: [number, number][] = [];
  grid.forEach((row, r) => [...row].forEach((ch, c) => ch !== '.' && cells.push([r, c])));
  if (cells.length > 0) {
    const seen = new Set<string>([`${cells[0]?.[0]},${cells[0]?.[1]}`]);
    const stack = [cells[0] as [number, number]];
    while (stack.length > 0) {
      const [r, c] = stack.pop() as [number, number];
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const rr = r + dr;
        const cc = c + dc;
        const k = `${rr},${cc}`;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols || seen.has(k)) continue;
        if ((grid[rr] as string)[cc] === '.') continue;
        seen.add(k);
        stack.push([rr, cc]);
      }
    }
    if (seen.size !== cells.length)
      fail('connected', `${seen.size}/${cells.length} cells reachable`);
  }

  if (level.difficulty < tier.band[0] || level.difficulty > tier.band[1]) {
    fail('band', `${level.difficulty} not in ${tier.band.join('–')}`);
  }
  if (level.words.length < tier.words[0] || level.words.length > tier.words[1]) {
    fail('wordCount', `${level.words.length} not in ${tier.words.join('–')}`);
  }
  if (level.letters.length < tier.letters[0] || level.letters.length > tier.letters[1]) {
    fail('wordCount', `${level.letters.length} letters not in ${tier.letters.join('–')}`);
  }

  if (level.ekTuru) {
    const e = level.ekTuru;
    const r = dict.engine.derive(e.root, e.bestChain);
    if (!r.ok) fail('ekTuruChain', `${e.root}+${e.bestChain.join('+')}: ${r.reason}`);
    if (!level.words.some((p) => p.w === e.root)) fail('ekTuruChain', `root ${e.root} not in grid`);
    if (e.bestChain.length > e.maxDepth) fail('ekTuruChain', 'chain longer than maxDepth');
    if (e.cards.length < 8 || e.cards.length > 12) fail('ekTuruCards', `${e.cards.length} cards`);
    // Each chain step: its correct form is on a card, plus at least one decoy of that suffix.
    let word = dict.engine.makeWord(e.root);
    for (const id of e.bestChain) {
      const step = dict.engine.applySuffix(word, { id });
      if (!step.ok) break;
      const form = step.morphemes[step.morphemes.length - 1] as string;
      if (!e.cards.some((c) => c.id === id && c.form === form))
        fail('ekTuruCards', `missing ${id}:${form}`);
      if (!e.cards.some((c) => c.id === id && c.form !== form))
        fail('ekTuruCards', `no decoy for ${id}`);
      word = step.word;
    }
  } else if (level.id % 5 === 0) {
    fail('ekTuruChain', 'missing Ek Turu');
  }
  return f;
}

/** Cross-level repetition rules (spec §8.6). */
export function validateRepetition(levels: readonly Level[]): Failure[] {
  const f: Failure[] = [];
  const mains = new Map<string, number>();
  const bags = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  const uses = new Map<string, number>();
  const roots = new Map<string, number>();
  for (const l of levels) {
    const main = l.letters.join('');
    const key = bagKey(main);
    const mainWord = l.words.find((p) => p.w.length === l.letters.length)?.w ?? '';
    const prevMain = mains.get(mainWord);
    if (prevMain !== undefined)
      f.push({ level: l.id, check: 'repetition', detail: `main ${mainWord} also ${prevMain}` });
    mains.set(mainWord, l.id);
    const prevBag = bags.get(key);
    if (prevBag !== undefined)
      f.push({ level: l.id, check: 'repetition', detail: `letters ${key} also ${prevBag}` });
    bags.set(key, l.id);
    for (const p of l.words) {
      const last = lastSeen.get(p.w);
      if (last !== undefined && l.id - last <= REPEAT.wordGap) {
        f.push({ level: l.id, check: 'repetition', detail: `${p.w} also ${last}` });
      }
      lastSeen.set(p.w, l.id);
      const n = (uses.get(p.w) ?? 0) + 1;
      uses.set(p.w, n);
      if (n > maxUses(p.w))
        f.push({ level: l.id, check: 'repetition', detail: `${p.w} used ${n}×` });
    }
    if (l.ekTuru) {
      const last = roots.get(l.ekTuru.root);
      if (last !== undefined && l.id - last <= REPEAT.rootGap) {
        f.push({ level: l.id, check: 'repetition', detail: `root ${l.ekTuru.root} also ${last}` });
      }
      roots.set(l.ekTuru.root, l.id);
    }
  }
  return f;
}
