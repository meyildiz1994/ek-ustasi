/**
 * Level generation (spec §8.1): for each level id in order, pick a main word whose letters fill
 * the wheel, choose target words to hit the curve's target difficulty, lay out the grid, choose an
 * Ek Turu root, then commit the repetition counters. Deterministic for a given seed.
 */
import { isBigEkTuruLevel, isEkTuruLevel, LEVELS_PER_PACK, type Level } from '../../src/game/level';
import { trCompare } from '../../src/utils/tr';
import { targetDifficulty, tierOf, tierProgress, type Tier } from './curve';
import type { Dictionary, TargetWord } from './data';
import { difficulty, type DifficultyFeatures } from './difficulty';
import { buildEkTuru, derivationStats } from './ekturu';
import { layoutWords, type GridOptions, type Layout } from './grid';
import { bagKey, fits, repeatedLetters } from './letters';
import { createRng, hashSeed } from './prng';
import { STOP_SEEDS, stopIdOf } from './stops-list';

/** Repetition rules (spec §8.6). */
export const REPEAT = {
  wordGap: 30,
  /** Spec: 12. Three/four-letter words get 24 (DECISIONS D-019): there are too few of them. */
  wordMaxUses: 12,
  shortWordMaxUses: 24,
  rootGap: 200,
} as const;

/** Hand-picked main words for the first levels (spec §8.5: "1–3 elle seçilmiş"). */
export const HANDPICKED: readonly string[] = ['elma', 'kale', 'okul'];

/** Crossing density assumed before the grid exists; replaced by a running mean per letter count. */
const DENSITY_GUESS = 0.22;

/** Ranking penalty per earlier use, so common short words are spread over all 5000 levels. */
const USE_PENALTY = 0.06;

export interface GenerateOptions {
  count: number;
  seed: number;
  grid?: Partial<GridOptions>;
  /** Main-word candidates estimated per level. */
  candidates?: number;
  /** Candidates that get a real grid layout per level. */
  layouts?: number;
  onProgress?: (id: number) => void;
}

export type RejectReason = 'fewWords' | 'gridTooSmall' | 'noEkRoot' | 'outOfBand';

export interface GenerateResult {
  levels: Level[];
  rejections: Record<RejectReason, number>;
  /** Target difficulty per level (for the report). */
  targets: number[];
}

interface Usage {
  lastSeen: Map<string, number>;
  uses: Map<string, number>;
  mains: Set<string>;
  bags: Set<string>;
  rootSeen: Map<string, number>;
}

interface Attempt {
  main: TargetWord;
  words: TargetWord[];
  layout: Layout;
  difficulty: number;
  root?: string;
}

export const maxUses = (w: string): number =>
  w.length <= 4 ? REPEAT.shortWordMaxUses : REPEAT.wordMaxUses;

export function stopIdForLevel(id: number): string {
  const seed = STOP_SEEDS[Math.floor((id - 1) / LEVELS_PER_PACK) % STOP_SEEDS.length];
  if (!seed) throw new Error(`No stop for level ${id}`);
  return stopIdOf(seed);
}

export function features(
  words: readonly TargetWord[],
  letters: number,
  layout?: Layout,
  densityGuess = DENSITY_GUESS,
): DifficultyFeatures {
  return {
    letters,
    words: words.length,
    meanPct: words.reduce((s, w) => s + w.pct, 0) / Math.max(1, words.length),
    longest: Math.max(0, ...words.map((w) => w.w.length)),
    repeated: 0,
    density: layout ? layout.intersections / Math.max(1, layout.cells) : densityGuess,
  };
}

export function generateLevels(dict: Dictionary, opts: GenerateOptions): GenerateResult {
  const nCandidates = opts.candidates ?? 24;
  const nLayouts = opts.layouts ?? 4;
  const usage: Usage = {
    lastSeen: new Map(),
    uses: new Map(),
    mains: new Set(),
    bags: new Set(),
    rootSeen: new Map(),
  };
  const rejections: Record<RejectReason, number> = {
    fewWords: 0,
    gridTooSmall: 0,
    noEkRoot: 0,
    outOfBand: 0,
  };

  // Main-word pools per length: lemmas first, each group shuffled with the seed.
  const pools = new Map<number, TargetWord[]>();
  for (let len = 3; len <= 8; len++) {
    const rng = createRng(hashSeed(opts.seed, 'mains', len));
    const all = dict.targets.filter((t) => t.w.length === len).sort((a, b) => trCompare(a.w, b.w));
    pools.set(len, [
      ...rng.shuffle(all.filter((t) => t.kind === 'L')),
      ...rng.shuffle(all.filter((t) => t.kind === 'I')),
    ]);
  }
  const subsCache = new Map<string, TargetWord[]>();
  const subsOf = (m: TargetWord) => {
    let s = subsCache.get(m.w);
    if (!s) {
      s = dict.targets
        .filter((t) => t.w.length >= 3 && fits(t.bag, m.bag))
        .sort((a, b) => b.pct - a.pct || trCompare(a.w, b.w));
      subsCache.set(m.w, s);
    }
    return s;
  };

  const levels: Level[] = [];
  const targets: number[] = [];
  // Running mean of the crossing density of accepted grids, per word count.
  const density = new Map<number, { sum: number; n: number }>();
  const densityGuess = (k: number) => {
    const d = density.get(k);
    return d && d.n >= 5 ? d.sum / d.n : DENSITY_GUESS;
  };
  for (let id = 1; id <= opts.count; id++) {
    const tier = tierOf(id);
    const target = targetDifficulty(id);
    targets.push(target);
    const rng = createRng(hashSeed(opts.seed, id));
    const ekLevel = isEkTuruLevel(id);
    const rootFree = (w: string) => {
      const last = usage.rootSeen.get(w);
      return last === undefined || id - last > REPEAT.rootGap;
    };
    const available = (w: string) => {
      const last = usage.lastSeen.get(w);
      return (
        (last === undefined || id - last > REPEAT.wordGap) && (usage.uses.get(w) ?? 0) < maxUses(w)
      );
    };
    const mainOk = (m: TargetWord) =>
      !usage.mains.has(m.w) &&
      !usage.bags.has(bagKey(m.w)) &&
      available(m.w) &&
      !dict.isBlocked(m.w);

    // 1. Candidate main words (lazily, round-robin over the allowed lengths).
    const hand = HANDPICKED[id - 1];
    const handWord = hand === undefined ? undefined : dict.byWord.get(hand);
    function* candidateMains(): Generator<TargetWord> {
      if (handWord && mainOk(handWord)) yield handWord;
      // Preferred length first; the next length only once the preferred pool is exhausted.
      for (const len of tier.lengths(tierProgress(tier, id))) {
        for (const m of pools.get(len) ?? []) if (m !== handWord && mainOk(m)) yield m;
      }
    }
    const mains = candidateMains();

    // 2. Estimate the best word selection per main word (pulled lazily from the generator).
    type Estimate = { main: TargetWord; words: TargetWord[]; spare: TargetWord[]; err: number };
    const estimateNext = (n: number): Estimate[] => {
      const out: Estimate[] = [];
      for (;;) {
        if (out.length >= n) break;
        const next = mains.next();
        if (next.done) break;
        const m = next.value;
        const avail = subsOf(m).filter(
          (t) => t.w !== m.w && available(t.w) && !dict.isBlocked(t.w),
        );
        if (avail.length + 1 < tier.words[0]) {
          rejections.fewWords++;
          continue;
        }
        // Ek Turu levels need a root with an attested derivation tree among the targets.
        let root: TargetWord | undefined;
        if (ekLevel) {
          root = [m, ...avail]
            .filter((t) => dict.derivations[t.w] !== undefined && rootFree(t.w))
            .map((t) => ({ t, s: derivationStats(dict.derivations[t.w]) }))
            .sort(
              (x, y) =>
                y.s.height - x.s.height ||
                y.s.size - x.s.size ||
                y.t.pct - x.t.pct ||
                trCompare(x.t.w, y.t.w),
            )[0]?.t;
          if (!root) {
            rejections.noEkRoot++;
            continue;
          }
        }
        let best: Omit<Estimate, 'main'> | undefined;
        for (const alpha of [0, 0.25, 0.5, 0.75, 1]) {
          const ranked = avail
            .map((t) => ({
              t,
              s:
                (1 - alpha) * t.pct +
                alpha * (1 - t.pct) -
                (t.kind === 'I' ? 0.15 : 0) -
                USE_PENALTY * (usage.uses.get(t.w) ?? 0),
            }))
            .sort((x, y) => y.s - x.s || trCompare(x.t.w, y.t.w))
            .map((x) => x.t);
          if (root && root !== m) {
            ranked.splice(ranked.indexOf(root), 1);
            ranked.unshift(root);
          }
          for (let k = tier.words[0]; k <= Math.min(tier.words[1], avail.length + 1); k++) {
            const words = [m, ...ranked.slice(0, k - 1)];
            const f = features(words, m.w.length, undefined, densityGuess(k));
            f.repeated = repeatedLetters(m.w);
            const err = Math.abs(difficulty(f) - target);
            if (!best || err < best.err) best = { words, spare: ranked.slice(k - 1), err };
          }
        }
        if (best) out.push({ main: m, ...best });
      }
      return out.sort(
        (x, y) =>
          Number(y.main === handWord) - Number(x.main === handWord) ||
          x.err - y.err ||
          trCompare(x.main.w, y.main.w),
      );
    };

    // 3. Real layouts for the most promising candidates; widen the search when none fits.
    let chosen: Attempt | undefined;
    let chosenErr = Infinity;
    const [lo, hi] = tier.band;
    const seen: Estimate[] = [];
    const local: string[] = [];
    for (const [n, layouts] of [
      [nCandidates, nLayouts],
      [nCandidates * 10, nCandidates * 2],
    ] as const) {
      const batch = estimateNext(n);
      seen.push(...batch);
      for (const est of batch.slice(0, layouts)) {
        const attempt = tryLayout(dict, est, tier, id, rng, opts.grid, usage);
        if (typeof attempt === 'string') {
          rejections[attempt]++;
          if (local.length < 12) local.push(`${est.main.w}:${attempt}`);
          continue;
        }
        if (attempt.difficulty < lo || attempt.difficulty > hi) {
          rejections.outOfBand++;
          if (local.length < 12) local.push(`${est.main.w}:${attempt.difficulty}`);
          continue;
        }
        // A hand-picked main word wins whenever it fits the band.
        const err = attempt.main === handWord ? 0 : Math.abs(attempt.difficulty - target);
        if (err < chosenErr) {
          chosen = attempt;
          chosenErr = err;
        }
        if (err <= 1.5) break;
      }
      if (chosen) break;
    }
    if (!chosen) {
      const diag = seen
        .slice(0, 8)
        .map((e) => `${e.main.w}(${e.words.length}w err ${e.err.toFixed(1)})`)
        .join(' ');
      throw new Error(
        `Level ${id}: no candidate fits tier ${tier.from}–${tier.to} (target ${target.toFixed(1)}, ` +
          `${seen.length} estimates: ${diag}; tried ${local.join(' ')}; capped words by length: ` +
          JSON.stringify(cappedByLength(usage)) +
          ')',
      );
    }

    // 4. Commit.
    const dk = density.get(chosen.words.length) ?? { sum: 0, n: 0 };
    dk.sum += chosen.layout.intersections / Math.max(1, chosen.layout.cells);
    dk.n++;
    density.set(chosen.words.length, dk);
    const level = finalise(dict, chosen, id, tier, opts.seed, rng);
    levels.push(level);
    usage.mains.add(chosen.main.w);
    usage.bags.add(bagKey(chosen.main.w));
    for (const p of level.words) {
      usage.lastSeen.set(p.w, id);
      usage.uses.set(p.w, (usage.uses.get(p.w) ?? 0) + 1);
    }
    if (level.ekTuru) usage.rootSeen.set(level.ekTuru.root, id);
    opts.onProgress?.(id);
  }
  return { levels, rejections, targets };
}

function tryLayout(
  dict: Dictionary,
  est: { main: TargetWord; words: TargetWord[]; spare: TargetWord[] },
  tier: Tier,
  id: number,
  rng: ReturnType<typeof createRng>,
  grid: Partial<GridOptions> | undefined,
  usage: Usage,
): Attempt | 'gridTooSmall' | 'noEkRoot' {
  let words = est.words;
  const spare = est.spare.slice();
  let layout = layoutWords(
    words.map((w) => w.w),
    rng,
    grid,
  );
  for (
    let retry = 0;
    retry < 2 && layout.placed.length < words.length && spare.length > 0;
    retry++
  ) {
    const placed = new Set(layout.placed.map((p) => p.w));
    const kept = words.filter((w) => placed.has(w.w));
    words = [...kept, ...spare.splice(0, words.length - kept.length)];
    layout = layoutWords(
      words.map((w) => w.w),
      rng,
      grid,
    );
  }
  const placedSet = new Set(layout.placed.map((p) => p.w));
  const placedWords = words.filter((w) => placedSet.has(w.w));
  if (
    placedWords.length < tier.words[0] ||
    placedWords.length > tier.words[1] ||
    !placedWords.some((w) => w.w.length === est.main.w.length)
  ) {
    return 'gridTooSmall';
  }
  let root: string | undefined;
  if (isEkTuruLevel(id)) {
    const roots = placedWords
      .filter((w) => dict.derivations[w.w] !== undefined)
      .filter((w) => {
        const last = usage.rootSeen.get(w.w);
        return last === undefined || id - last > REPEAT.rootGap;
      })
      .map((w) => ({ w, s: derivationStats(dict.derivations[w.w]) }))
      .sort(
        (a, b) =>
          b.s.height - a.s.height ||
          b.s.size - a.s.size ||
          b.w.pct - a.w.pct ||
          trCompare(a.w.w, b.w.w),
      );
    if (roots.length === 0) return 'noEkRoot';
    root = (roots[0] as { w: TargetWord }).w.w;
  }
  const f = features(placedWords, est.main.w.length, layout);
  f.repeated = repeatedLetters(est.main.w);
  const attempt: Attempt = {
    main: est.main,
    words: placedWords,
    layout,
    difficulty: difficulty(f),
  };
  if (root !== undefined) attempt.root = root;
  return attempt;
}

function finalise(
  dict: Dictionary,
  a: Attempt,
  id: number,
  tier: Tier,
  seed: number,
  rng: ReturnType<typeof createRng>,
): Level {
  const placed = new Set(a.layout.placed.map((p) => p.w));
  let letters = rng.shuffle([...a.main.w]);
  for (let i = 0; i < 10 && placed.has(letters.join('')); i++) letters = rng.shuffle([...a.main.w]);
  const bonus = [...new Set(dict.valid.wordsFromLetters([...a.main.w], 3))]
    .filter((w) => !placed.has(w))
    .sort(trCompare);
  const level: Level = {
    id,
    stopId: stopIdForLevel(id),
    letters,
    words: a.layout.placed,
    bonus,
    difficulty: a.difficulty,
    seed: hashSeed(seed, id),
  };
  if (a.root !== undefined) {
    const big = isBigEkTuruLevel(id);
    level.ekTuru = buildEkTuru({
      engine: dict.engine,
      root: a.root,
      tree: dict.derivations[a.root],
      maxDepth: big ? Math.min(12, tier.ekMaxDepth + 2) : tier.ekMaxDepth,
      big,
      archiphoneme: id > 1000,
      rng,
    });
  }
  return level;
}

function cappedByLength(usage: Usage): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [w, n] of usage.uses) if (n >= maxUses(w)) out[w.length] = (out[w.length] ?? 0) + 1;
  return out;
}
