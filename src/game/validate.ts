/** Word classification (spec §4.3). */
export type WordResult = 'target' | 'bonus' | 'alreadyFound' | 'invalid' | 'tooShort';

export interface ValidateContext {
  targets: ReadonlySet<string>;
  /** Precomputed bonus words of the level (level.bonus). */
  bonus: ReadonlySet<string>;
  found: readonly string[];
  bonusFound: readonly string[];
}

export const MIN_WORD = 3;

export function classifyWord(word: string, ctx: ValidateContext): WordResult {
  if (word.length < MIN_WORD) return 'tooShort';
  if (ctx.targets.has(word)) return ctx.found.includes(word) ? 'alreadyFound' : 'target';
  if (ctx.bonus.has(word)) return ctx.bonusFound.includes(word) ? 'alreadyFound' : 'bonus';
  return 'invalid';
}
