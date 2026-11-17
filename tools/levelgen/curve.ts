/**
 * Difficulty curve (spec §8.5): tiers by level range, a saw-tooth inside every stop (50 levels),
 * and a "relaxing" level every 10th level (bottom 20 % of the band).
 */
import { LEVELS_PER_PACK } from '../../src/game/level';

export interface Tier {
  from: number;
  to: number;
  letters: [number, number];
  words: [number, number];
  band: [number, number];
  ekMaxDepth: number;
  /**
   * Main-word lengths in order of preference, by progress through the tier (0–1). Spreads the
   * limited supply of long words; a later length is the fallback when the pool runs out
   * (DECISIONS D-015, D-025).
   */
  lengths: (progress: number) => number[];
}

export const TIERS: readonly Tier[] = [
  {
    from: 1,
    to: 20,
    letters: [4, 5],
    words: [5, 8],
    band: [0, 12],
    ekMaxDepth: 2,
    lengths: () => [5, 4],
  },
  {
    from: 21,
    to: 100,
    letters: [5, 5],
    words: [6, 10],
    band: [8, 20],
    ekMaxDepth: 3,
    lengths: () => [5],
  },
  {
    from: 101,
    to: 300,
    letters: [5, 6],
    words: [7, 11],
    band: [15, 31],
    ekMaxDepth: 4,
    lengths: (p) => (p < 0.3 ? [5, 6] : [6, 5]),
  },
  {
    from: 301,
    to: 700,
    letters: [6, 6],
    words: [8, 13],
    band: [25, 40],
    ekMaxDepth: 5,
    lengths: () => [6],
  },
  {
    from: 701,
    to: 1200,
    letters: [6, 7],
    words: [9, 14],
    band: [33, 48],
    ekMaxDepth: 6,
    lengths: () => [6, 7],
  },
  {
    from: 1201,
    to: 2000,
    letters: [6, 7],
    words: [10, 15],
    band: [34, 60],
    ekMaxDepth: 7,
    lengths: (p) => (p < 0.5 ? [6, 7] : [7, 6]),
  },
  {
    from: 2001,
    to: 3000,
    letters: [7, 7],
    words: [11, 17],
    band: [52, 70],
    ekMaxDepth: 8,
    lengths: () => [7],
  },
  {
    from: 3001,
    to: 4000,
    letters: [7, 8],
    words: [12, 18],
    band: [52, 80],
    ekMaxDepth: 10,
    lengths: (p) => (p < 0.3 ? [7, 8] : [8, 7]),
  },
  {
    from: 4001,
    to: 5000,
    letters: [7, 8],
    words: [13, 20],
    band: [42, 90],
    ekMaxDepth: 12,
    lengths: () => [8, 7],
  },
];

export const tierProgress = (t: Tier, id: number): number =>
  t.to === t.from ? 0.5 : (id - t.from) / (t.to - t.from);

export function tierOf(id: number): Tier {
  const t = TIERS.find((x) => id >= x.from && id <= x.to);
  if (!t) throw new Error(`No tier for level ${id}`);
  return t;
}

export const isRelaxLevel = (id: number): boolean => id % 10 === 0 && id % LEVELS_PER_PACK !== 0;

/**
 * Target difficulty for a level. Inside a tier the target rises linearly from the bottom 30 % to
 * the top of the band; on top of that every stop climbs by ±15 % of the band width so a new stop
 * starts a little easier than the previous one ended. Relaxing levels sit in the bottom 20 %.
 */
export function targetDifficulty(id: number): number {
  const t = tierOf(id);
  const [lo, hi] = t.band;
  const w = hi - lo;
  if (isRelaxLevel(id)) return lo + w * 0.1;
  const progress = t.to === t.from ? 0.5 : (id - t.from) / (t.to - t.from);
  const inStop = ((id - 1) % LEVELS_PER_PACK) / (LEVELS_PER_PACK - 1); // 0 … 1
  const v = lo + w * (0.3 + 0.5 * progress) + w * 0.3 * (inStop - 0.5);
  // The very top of the last band (> 88) is not reachable with real words; aim below it.
  return Math.min(t.to === 5000 ? lo + w * 0.6 : hi, Math.max(lo, v));
}

/**
 * How many target words a level asks for (Emre, D-025): a seeded draw inside the tier's range so the
 * count keeps changing from level to level, nudged up through the tier, lower on relaxing levels.
 */
export function wordTarget(id: number): number {
  const t = tierOf(id);
  const [lo, hi] = t.words;
  // Integer hash of the id → 0 … 1 (no shared RNG state: adding levels never shifts earlier ones).
  let h = Math.imul(id ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  const r = ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
  if (isRelaxLevel(id)) return lo + Math.floor(r * Math.max(1, (hi - lo) / 3));
  const shift = 0.25 * (tierProgress(t, id) - 0.5);
  return Math.round(lo + (hi - lo) * Math.min(1, Math.max(0, r + shift)));
}
