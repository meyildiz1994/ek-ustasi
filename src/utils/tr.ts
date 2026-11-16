/**
 * Turkish-aware string helpers.
 *
 * Rule (spec §0, §18): never call String#toUpperCase / String#toLowerCase in this codebase.
 * Always go through these helpers. ESLint enforces it (see eslint.config.js).
 *
 * The dotted/dotless I pairs are mapped explicitly *before* delegating to the locale-aware
 * methods, so the result is correct even on a JS engine whose Intl data ignores 'tr-TR'
 * (older Hermes builds). See DECISIONS.md D-003.
 */

const LOCALE = 'tr-TR';

/** The 29 letters of the Turkish alphabet, in dictionary order (lower case). */
export const TR_ALPHABET = [
  'a',
  'b',
  'c',
  'ç',
  'd',
  'e',
  'f',
  'g',
  'ğ',
  'h',
  'ı',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'ö',
  'p',
  'r',
  's',
  'ş',
  't',
  'u',
  'ü',
  'v',
  'y',
  'z',
] as const;

export type TrLetter = (typeof TR_ALPHABET)[number];

/** Upper-cases with Turkish rules: i → İ, ı → I. */
export function trUpper(s: string): string {
  return s.replace(/[iı]/g, (ch) => (ch === 'i' ? 'İ' : 'I')).toLocaleUpperCase(LOCALE);
}

/** Lower-cases with Turkish rules: İ → i, I → ı (no combining dot left behind). */
export function trLower(s: string): string {
  return s.replace(/[İI]/g, (ch) => (ch === 'İ' ? 'i' : 'ı')).toLocaleLowerCase(LOCALE);
}

/** "istanbul" → "İstanbul". */
export function trCapitalize(s: string): string {
  if (s.length === 0) return s;
  const first = Array.from(s)[0] as string;
  return trUpper(first) + trLower(s.slice(first.length));
}

const ORDER: ReadonlyMap<string, number> = new Map(TR_ALPHABET.map((ch, i) => [ch, i]));

/**
 * Compares two strings in Turkish alphabetical order (case-insensitive, deterministic on every
 * platform — we do not rely on Intl.Collator so that the level generator and the device agree).
 * Characters outside the alphabet sort after all letters, by code point.
 */
export function trCompare(a: string, b: string): number {
  const x = Array.from(trLower(a));
  const y = Array.from(trLower(b));
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const cx = x[i] as string;
    const cy = y[i] as string;
    if (cx === cy) continue;
    const ox = ORDER.get(cx);
    const oy = ORDER.get(cy);
    if (ox !== undefined && oy !== undefined) return ox - oy;
    if (ox !== undefined) return -1;
    if (oy !== undefined) return 1;
    return (cx.codePointAt(0) as number) - (cy.codePointAt(0) as number);
  }
  return x.length - y.length;
}

/**
 * Normalises a word for the game: lower-case (tr), circumflex removed (â/î/û → a/i/u),
 * surrounding whitespace trimmed. Spec §7.2: we normalise rather than drop (DECISIONS.md D-004).
 */
export function trNormalize(s: string): string {
  return trLower(s.trim().normalize('NFC'))
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

const LETTER_SET: ReadonlySet<string> = new Set(TR_ALPHABET);

/** True when `s` is non-empty and made only of the 29 lower-case Turkish letters. */
export function isTrWord(s: string): boolean {
  if (s.length === 0) return false;
  for (const ch of s) if (!LETTER_SET.has(ch)) return false;
  return true;
}

/** Splits a word into letters (code-point safe). */
export function trLetters(s: string): string[] {
  return Array.from(s);
}
