/** Timing of the game-feel sequences (spec §12), kept pure so it can be tested. */

/** Star k (0-based) drops at STAR_AT + k·STAR_GAP ms on the level-complete card. */
export const STAR_AT = 450;
export const STAR_GAP = 320;
/** Gap between per-suffix notes when several suffixes stick in one Ek Turu drag. */
export const EK_STEP_MS = 140;

export type CompleteEvent = 'levelEnd' | 'star' | 'coin';

/** Sound timeline of the level-complete card: fanfare, one chime per star, then the coins. */
export function completeTimeline(stars: number, coins: number): [number, CompleteEvent][] {
  const out: [number, CompleteEvent][] = [[0, 'levelEnd']];
  for (let k = 0; k < stars; k++) out.push([STAR_AT + k * STAR_GAP, 'star']);
  if (coins > 0) out.push([STAR_AT + Math.max(stars, 1) * STAR_GAP, 'coin']);
  return out;
}

export type EkEvent = { kind: 'step'; n: number } | { kind: 'break' };

/** Ek Turu: `added` suffixes stuck after `before` earlier steps; a break (if any) lands last. */
export function ekTimeline(before: number, added: number, failed: boolean): [number, EkEvent][] {
  const out: [number, EkEvent][] = [];
  for (let j = 0; j < added; j++) out.push([j * EK_STEP_MS, { kind: 'step', n: before + j }]);
  if (failed) out.push([added * EK_STEP_MS, { kind: 'break' }]);
  return out;
}
