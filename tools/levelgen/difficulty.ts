/**
 * Difficulty score 0–100 (spec §8.4):
 *   0.25·norm(letters) + 0.20·norm(target words) + 0.20·(1 − mean frequency percentile)
 *   + 0.15·norm(longest word) + 0.10·norm(repeated letters) + 0.10·(1 − crossing density)
 * The norm ranges are ours (DECISIONS D-015): they span what the curve (§8.5) actually uses.
 */
export interface DifficultyFeatures {
  letters: number;
  words: number;
  /** Mean frequency percentile of the target words (1 = most common). */
  meanPct: number;
  longest: number;
  repeated: number;
  /** Crossing cells / filled cells (0 when unknown). */
  density: number;
}

export const NORMS = {
  letters: [4, 7],
  words: [3, 12],
  longest: [4, 7],
  repeated: [0, 2],
  density: [0.1, 0.5],
} as const;

const norm = (v: number, [lo, hi]: readonly [number, number]) =>
  Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

export function difficulty(f: DifficultyFeatures): number {
  const d =
    0.25 * norm(f.letters, NORMS.letters) +
    0.2 * norm(f.words, NORMS.words) +
    0.2 * (1 - f.meanPct) +
    0.15 * norm(f.longest, NORMS.longest) +
    0.1 * norm(f.repeated, NORMS.repeated) +
    0.1 * (1 - norm(f.density, NORMS.density));
  return Math.round(d * 1000) / 10;
}
