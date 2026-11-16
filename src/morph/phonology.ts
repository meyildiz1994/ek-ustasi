/** Turkish phonology primitives (spec §6.1). Pure, lower-case input expected (use trLower first). */

export const VOWELS = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'] as const;
export const FRONT = ['e', 'i', 'ö', 'ü'] as const; // ince
export const BACK = ['a', 'ı', 'o', 'u'] as const; // kalın
export const ROUNDED = ['o', 'ö', 'u', 'ü'] as const; // yuvarlak
export const UNROUNDED = ['a', 'e', 'ı', 'i'] as const; // düz
/** "FıSTıKÇı ŞaHaP" */
export const HARD_CONS = ['ç', 'f', 'h', 'k', 'p', 's', 'ş', 't'] as const;
export const SOFTENING: Readonly<Record<string, string>> = { p: 'b', ç: 'c', t: 'd', k: 'ğ' };

export type Vowel = (typeof VOWELS)[number];

const VOWEL_SET: ReadonlySet<string> = new Set(VOWELS);
const FRONT_SET: ReadonlySet<string> = new Set(FRONT);
const ROUNDED_SET: ReadonlySet<string> = new Set(ROUNDED);
const HARD_SET: ReadonlySet<string> = new Set(HARD_CONS);

export const isVowel = (ch: string): ch is Vowel => VOWEL_SET.has(ch);
export const isFront = (v: string): boolean => FRONT_SET.has(v);
export const isRounded = (v: string): boolean => ROUNDED_SET.has(v);
export const isHard = (ch: string): boolean => HARD_SET.has(ch);

/** Last vowel of a word, or undefined if it has none. */
export function lastVowel(s: string): Vowel | undefined {
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i] as string;
    if (isVowel(ch)) return ch;
  }
  return undefined;
}

export function vowelsOf(s: string): Vowel[] {
  return Array.from(s).filter(isVowel);
}

export function endsWithVowel(s: string): boolean {
  return s.length > 0 && isVowel(s[s.length - 1] as string);
}

export function lastChar(s: string): string {
  return s.length > 0 ? (s[s.length - 1] as string) : '';
}

/** Number of syllables = number of vowels (Turkish has no diphthongs). */
export function syllableCount(s: string): number {
  return vowelsOf(s).length;
}

/** Two-way harmony (archiphoneme A): back → a, front → e. */
export function harmonizeA(governing: Vowel): 'a' | 'e' {
  return isFront(governing) ? 'e' : 'a';
}

/** Four-way harmony (archiphoneme I): a,ı → ı; e,i → i; o,u → u; ö,ü → ü. */
export function harmonizeI(governing: Vowel): 'ı' | 'i' | 'u' | 'ü' {
  if (isFront(governing)) return isRounded(governing) ? 'ü' : 'i';
  return isRounded(governing) ? 'u' : 'ı';
}

/** Front counterpart of a vowel (a→e, ı→i, o→ö, u→ü); front vowels map to themselves. */
export function frontOf(v: Vowel): Vowel {
  const map: Partial<Record<Vowel, Vowel>> = { a: 'e', ı: 'i', o: 'ö', u: 'ü' };
  return map[v] ?? v;
}

/** Consonant assimilation (D, C): t / ç after a hard consonant, d / c otherwise. */
export function assimilateD(prev: string): 'd' | 't' {
  return isHard(prev) ? 't' : 'd';
}
export function assimilateC(prev: string): 'c' | 'ç' {
  return isHard(prev) ? 'ç' : 'c';
}

/**
 * Voicing of a final stop before a vowel: p→b, ç→c, t→d, k→ğ; "nk" → "ng".
 * Returns the stem unchanged when its final letter does not soften.
 */
export function soften(stem: string): string {
  const last = lastChar(stem);
  const soft = SOFTENING[last];
  if (soft === undefined) return stem;
  const before = stem.length >= 2 ? stem[stem.length - 2] : '';
  const replacement = last === 'k' && before === 'n' ? 'g' : soft;
  return stem.slice(0, -1) + replacement;
}

/** Removes the last vowel (ağız → ağz, burun → burn). */
export function dropLastVowel(stem: string): string {
  for (let i = stem.length - 1; i >= 0; i--) {
    if (isVowel(stem[i] as string)) return stem.slice(0, i) + stem.slice(i + 1);
  }
  return stem;
}

/** Doubles the final consonant (hak → hakk, his → hiss). */
export function geminate(stem: string): string {
  return stem + lastChar(stem);
}
