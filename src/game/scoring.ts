/** Score, combo, stars and coins (spec §4.5, §5.2, §13.1). */
export const COMBO_WINDOW_MS = 5000;
const COMBO_STEPS = [1, 1.2, 1.5, 2] as const;

export interface ComboState {
  /** Consecutive finds inside the window (0 = none yet). */
  streak: number;
  lastAt: number | null;
}

export const initialCombo = (): ComboState => ({ streak: 0, lastAt: null });

/** Registers a found word at time `now` (ms); returns the multiplier for it and the new state. */
export function nextCombo(
  state: ComboState,
  now: number,
): { multiplier: number; state: ComboState } {
  const streak =
    state.lastAt !== null && now - state.lastAt <= COMBO_WINDOW_MS ? state.streak + 1 : 1;
  const multiplier = COMBO_STEPS[Math.min(streak, COMBO_STEPS.length) - 1] as number;
  return { multiplier, state: { streak, lastAt: now } };
}

export const wordScore = (word: string, multiplier = 1): number =>
  Math.round(word.length * 10 * multiplier);

export function stars(hintsUsed: number): 1 | 2 | 3 {
  if (hintsUsed === 0) return 3;
  return hintsUsed <= 2 ? 2 : 1;
}

export const COINS = {
  start: 200,
  targetWord: 1,
  levelEnd: 10,
  levelEndThreeStars: 20,
  bonusEvery: 10,
  bonusReward: 25,
} as const;

export const levelEndCoins = (s: 1 | 2 | 3): number =>
  s === 3 ? COINS.levelEndThreeStars : COINS.levelEnd;

/** Coins earned when the bonus counter goes from `before` to `after`. */
export const bonusCoins = (before: number, after: number): number =>
  (Math.floor(after / COINS.bonusEvery) - Math.floor(before / COINS.bonusEvery)) *
  COINS.bonusReward;

/** Ek Turu chain score: surface letters × 2 × 2^(suffix count) (spec §5.2). */
export const chainScore = (surface: string, suffixes: number): number =>
  surface.length * 2 * 2 ** suffixes;

/** Ek Turu → coins: a quarter of the score (spec §13.1). */
export const ekTuruCoins = (score: number): number => Math.floor(score / 4);
