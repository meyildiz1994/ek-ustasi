/** Stop progress on the map (spec §10): 100 stops × 50 levels. Pure; reads the save only. */
import type { Engine } from '../morph/engine';
import { trLower } from '../utils/tr';
import { LEVELS_PER_PACK } from './level';

export type StopState = 'done' | 'current' | 'locked';

export interface StopProgress {
  state: StopState;
  /** Levels completed in this stop (0–50). */
  done: number;
  /** Stars earned in this stop (0–150). */
  stars: number;
}

export interface StopRange {
  firstLevel: number;
  lastLevel: number;
}

export function stopProgress(
  stop: StopRange,
  currentLevel: number,
  stars: Readonly<Record<number, number>>,
): StopProgress {
  const done = Math.max(0, Math.min(stop.lastLevel, currentLevel - 1) - stop.firstLevel + 1);
  let total = 0;
  for (let id = stop.firstLevel; id <= stop.lastLevel; id++) total += stars[id] ?? 0;
  const state: StopState =
    currentLevel > stop.lastLevel ? 'done' : currentLevel >= stop.firstLevel ? 'current' : 'locked';
  return { state, done, stars: total };
}

/** 1-based stop index of a level. */
export const stopIndexOf = (levelId: number): number => Math.ceil(levelId / LEVELS_PER_PACK);

/** True when solving `levelId` finishes its stop (→ postcard). */
export const isStopFinale = (levelId: number): boolean => levelId % LEVELS_PER_PACK === 0;

/** Horizontal position (0–1) of a stop on the winding map path. */
export const mapX = (index: number): number => 0.5 + 0.3 * Math.sin(index * 0.9);

/**
 * Place name + ablative with an apostrophe, as proper nouns are written: İstanbul'dan, İzmir'den,
 * Bakü'den, New York'tan. The morphology engine picks the variant from the last word.
 */
export function placeAblative(engine: Engine, name: string): string {
  const last = trLower(name.split(' ').pop() ?? name);
  try {
    const r = engine.derive(last, ['CASE_ABL']);
    if (r.ok) return `${name}'${r.morphemes[r.morphemes.length - 1] as string}`;
  } catch {
    // not a parsable word: fall through
  }
  return `${name}'dan`;
}
