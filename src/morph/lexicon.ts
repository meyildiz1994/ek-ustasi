/**
 * Lexical knowledge the rules cannot derive on their own (spec §6.3, §6.5).
 *
 * TEMPORARY CORE DATA: this hand-written seed exists so the engine can be built and tested in
 * Phase 2. In Phase 3 it is replaced by data generated from an openly licensed dictionary
 * (candidate: Zemberek's lexicon, whose attributes Voicing / NoVoicing / LastVowelDrop / Doubling /
 * InverseHarmony map 1:1 onto RootInfo). See DECISIONS.md D-006.
 */

export interface RootInfo {
  /** Takes front suffixes although its last vowel is back (saat → saati, rol → rolü). */
  frontOverride?: boolean;
  /** Monosyllabic word that nevertheless softens (dip → dibi, renk → rengi). */
  soften?: boolean;
  /** Polysyllabic word that does not soften (bilet → bileti). */
  noSoften?: boolean;
  /** Last vowel drops before a vowel-initial suffix (ağız → ağzı). */
  vowelDrop?: boolean;
  /** Final consonant doubles before a vowel-initial suffix (hak → hakkı). */
  geminate?: boolean;
  /** Can take -ki directly (bugünkü, yarınki). */
  temporal?: boolean;
  /** -ki surfaces as -kü (bugünkü, dünkü, öbürkü). */
  kiRounded?: boolean;
  /** Buffer (s)/(n)/(I) become y (su → suyu, suyun, suyum). */
  bufferY?: boolean;
}

export interface Lexicon {
  /** Lexical flags of a root or lexicalised derived word, if any. */
  info(word: string): RootInfo | undefined;
  /** True when a derivational (yapım) output is an attested word. */
  isDerived(word: string): boolean;
}

export interface LexiconData {
  roots: Readonly<Record<string, RootInfo>>;
  derived: Iterable<string>;
}

export function createLexicon(data: LexiconData): Lexicon {
  const roots = new Map(Object.entries(data.roots));
  const derived = new Set(data.derived);
  return {
    info: (w) => roots.get(w),
    isDerived: (w) => derived.has(w),
  };
}

const flag = (words: string[], info: RootInfo): Record<string, RootInfo> =>
  Object.fromEntries(words.map((w) => [w, info]));

function merge(...parts: Record<string, RootInfo>[]): Record<string, RootInfo> {
  const out: Record<string, RootInfo> = {};
  for (const part of parts) {
    for (const [w, info] of Object.entries(part)) out[w] = { ...out[w], ...info };
  }
  return out;
}

const CORE_ROOTS = merge(
  flag(['dip', 'kap', 'uç', 'gök', 'dert', 'renk', 'kalp', 'tat', 'yurt', 'kurt', 'but', 'denk'], {
    soften: true,
  }),
  flag(
    [
      'bilet',
      'sepet',
      'saat',
      'millet',
      'devlet',
      'hukuk',
      'sanat',
      'dikkat',
      'hayat',
      'evrak',
      'hakikat',
      'kibrit',
      'cesaret',
      'ticaret',
      'zevk',
    ],
    { noSoften: true },
  ),
  flag(
    [
      'saat',
      'hayal',
      'rol',
      'gol',
      'kalp',
      'alkol',
      'harf',
      'dikkat',
      'hakikat',
      'istikbal',
      'petrol',
      'sembol',
      'kontrol',
      'hal',
      'kabul',
    ],
    { frontOverride: true },
  ),
  flag(
    [
      'ağız',
      'burun',
      'oğul',
      'fikir',
      'akıl',
      'alın',
      'beyin',
      'boyun',
      'gönül',
      'isim',
      'resim',
      'şehir',
      'nehir',
      'karın',
      'omuz',
      'göğüs',
      'sabır',
      'ömür',
      'kayıp',
      'vakit',
    ],
    { vowelDrop: true },
  ),
  flag(['hak', 'his', 'sır', 'af', 'zan'], { geminate: true }),
  flag(['bugün', 'dün', 'yarın', 'akşam', 'sabah', 'gece', 'şimdi', 'önce', 'sonra', 'öbür'], {
    temporal: true,
  }),
  flag(['bugün', 'dün', 'öbür'], { kiRounded: true }),
  { su: { bufferY: true } },
);

// prettier-ignore
const CORE_DERIVED = [
  'gözlük', 'gözlükçü', 'gözlükçülük', 'gözlü', 'gözcü',
  'kalemlik',
  'kitaplık', 'kitapçı', 'kitapçılık',
  'işçi', 'işçilik', 'işsiz', 'işsizlik', 'işli',
  'evli', 'evlilik', 'evsiz', 'evsizlik',
  'tuzlu', 'tuzluk', 'tuzsuz',
  'sulu', 'susuz', 'susuzluk',
  'yolcu', 'yolculuk', 'yolsuz', 'yolsuzluk',
  'balıkçı', 'balıkçılık',
  'sütçü', 'sütlü', 'sütsüz',
  'şekerci', 'şekerli', 'şekersiz', 'şekerlik',
  'elmacı', 'elmalık', 'elmalı',
  'kömürcü', 'kömürlük',
  'akıllı', 'akılsız',
  'dostluk', 'arkadaşlık',
  'çiçekçi', 'çiçekli', 'çiçeklik',
  'aylık', 'günlük', 'yıllık', 'haftalık',
  'başlık',
  'renkli', 'renksiz',
  'saatçi', 'saatli',
  'kalpsiz',
  'hayalci',
  'golcü',
  'güneşli', 'güneşlik',
  'bulutlu', 'bulutsuz',
  'karlı',
  'yağmurlu', 'yağmurluk',
  'demirci',
  'ağaçlı', 'ağaçlık',
  'taşçı', 'taşlı', 'taşlık',
  'kapıcı', 'kapıcılık',
];

/** Seed lexicon used until the Phase 3 dictionary pipeline lands. */
export const CORE_LEXICON: Lexicon = createLexicon({ roots: CORE_ROOTS, derived: CORE_DERIVED });
