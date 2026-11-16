/** Letter multisets over the 29-letter Turkish alphabet. */
import { TR_ALPHABET } from '../../src/utils/tr';

const INDEX = new Map<string, number>(TR_ALPHABET.map((ch, i) => [ch, i]));

export interface LetterBag {
  /** Counts per alphabet index. */
  counts: Uint8Array;
  /** Bit i set when letter i occurs. */
  mask: number;
  length: number;
}

export function bagOf(word: string): LetterBag {
  const counts = new Uint8Array(TR_ALPHABET.length);
  let mask = 0;
  let length = 0;
  for (const ch of word) {
    const i = INDEX.get(ch);
    if (i === undefined) throw new Error(`Not a Turkish letter: "${ch}" in "${word}"`);
    counts[i] = (counts[i] as number) + 1;
    mask |= 1 << i;
    length++;
  }
  return { counts, mask, length };
}

/** True when every letter of `small` is available in `big` (with multiplicity). */
export function fits(small: LetterBag, big: LetterBag): boolean {
  if (small.length > big.length || (small.mask & ~big.mask) !== 0) return false;
  for (let i = 0; i < small.counts.length; i++) {
    if ((small.counts[i] as number) > (big.counts[i] as number)) return false;
  }
  return true;
}

/** Canonical key of a multiset: letters sorted by alphabet index ("kalem" → "aeklm"). */
export function bagKey(word: string): string {
  return [...word].sort((x, y) => (INDEX.get(x) as number) - (INDEX.get(y) as number)).join('');
}

/** Number of letters that are extra copies (kalak → 2: second a, second k). */
export function repeatedLetters(word: string): number {
  return word.length - new Set(word).size;
}
