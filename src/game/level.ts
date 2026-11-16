/**
 * Level data format (spec §9). Produced by tools/levelgen, read by the app.
 * All strings are lower-case Turkish (tr-TR); display goes through trUpper.
 */
import type { SuffixId } from '../morph';

export type Direction = 'H' | 'V';

export interface PlacedWord {
  w: string;
  /** Row of the first letter (0-based, top). */
  r: number;
  /** Column of the first letter (0-based, left). */
  c: number;
  d: Direction;
}

/** One suffix card in an Ek Turu round: the suffix and the concrete form printed on it. */
export interface EkCard {
  id: SuffixId;
  form: string;
}

export interface EkTuru {
  root: string;
  bestChain: SuffixId[];
  maxDepth: number;
  /** 8–12 cards; at least 40 % continue a valid chain, the rest are decoys (spec §5.3). */
  cards: EkCard[];
  targetScore: number;
  /** Last level of a stop: longer chain, 3× reward (spec §5.1). */
  big: boolean;
  /** Archiphoneme cards (-lXk) may be offered (levels 1001+, spec §5.3). */
  archiphoneme: boolean;
}

export interface Level {
  id: number;
  stopId: string;
  letters: string[];
  words: PlacedWord[];
  bonus: string[];
  difficulty: number;
  ekTuru?: EkTuru;
  seed: number;
}

export interface LevelPack {
  version: 1;
  pack: number;
  levels: Level[];
}

export interface LevelManifest {
  version: 1;
  seed: number;
  levelCount: number;
  levelsPerPack: number;
  packs: { file: string; first: number; last: number; sha256: string; bytes: number }[];
}

export const LEVELS_PER_PACK = 50;

/** Grid size limits (spec §4.2). */
export const MAX_GRID = 12;

/** Ek Turu every 5th level (spec §5.1). */
export const isEkTuruLevel = (id: number): boolean => id % 5 === 0;
export const isBigEkTuruLevel = (id: number): boolean => id % LEVELS_PER_PACK === 0;
export const packOf = (id: number): number => Math.ceil(id / LEVELS_PER_PACK);
export const packFileName = (pack: number): string =>
  `pack_${String(pack).padStart(4, '0')}.json.gz`;
