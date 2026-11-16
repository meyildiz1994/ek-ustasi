/**
 * Suffix catalogue (spec §6.2). Templates use archiphonemes:
 *   A = a|e, I = ı|i|u|ü, D = d|t, C = c|ç, (y)/(n)/(s) = buffer consonants (after vowels only),
 *   (I) = buffer vowel (after consonants only).
 */

export type SuffixCategory = 'çoğul' | 'yapım' | 'iyelik' | 'hâl' | 'ilgi' | 'vasıta';

/** Morphotactic slot (spec §6.3 rule 8). WITH_LA shares the case slot. */
export type Slot = 'DER' | 'PLURAL' | 'POSS' | 'CASE' | 'KI';

export type SuffixId =
  | 'PLURAL'
  | 'DER_LIK'
  | 'DER_CI'
  | 'DER_SIZ'
  | 'DER_LI'
  | 'POSS_1SG'
  | 'POSS_2SG'
  | 'POSS_3SG'
  | 'POSS_1PL'
  | 'POSS_2PL'
  | 'CASE_ABL'
  | 'CASE_LOC'
  | 'CASE_DAT'
  | 'CASE_ACC'
  | 'CASE_GEN'
  | 'REL_KI'
  | 'WITH_LA';

export interface SuffixDef {
  id: SuffixId;
  template: string;
  category: SuffixCategory;
  slot: Slot;
  /** Case suffixes that take the pronominal n after 3SG possessive / -ki (evi-n-de, evi-n-e). */
  pronominalN?: 'prefix' | 'replaceBuffer';
  /** -ki can attach after this case (yoldaki, kaleminki). */
  kiHost?: boolean;
  /** Leaves the next case suffix needing a pronominal n (3SG possessive, -ki). */
  setsPronominalN?: boolean;
  /** Does not harmonise (-ki), except roots flagged kiRounded. */
  invariant?: boolean;
}

export const SUFFIXES: Readonly<Record<SuffixId, SuffixDef>> = {
  PLURAL: { id: 'PLURAL', template: 'lAr', category: 'çoğul', slot: 'PLURAL' },
  DER_LIK: { id: 'DER_LIK', template: 'lIk', category: 'yapım', slot: 'DER' },
  DER_CI: { id: 'DER_CI', template: 'CI', category: 'yapım', slot: 'DER' },
  DER_SIZ: { id: 'DER_SIZ', template: 'sIz', category: 'yapım', slot: 'DER' },
  DER_LI: { id: 'DER_LI', template: 'lI', category: 'yapım', slot: 'DER' },
  POSS_1SG: { id: 'POSS_1SG', template: '(I)m', category: 'iyelik', slot: 'POSS' },
  POSS_2SG: { id: 'POSS_2SG', template: '(I)n', category: 'iyelik', slot: 'POSS' },
  POSS_3SG: {
    id: 'POSS_3SG',
    template: '(s)I',
    category: 'iyelik',
    slot: 'POSS',
    setsPronominalN: true,
  },
  POSS_1PL: { id: 'POSS_1PL', template: '(I)mIz', category: 'iyelik', slot: 'POSS' },
  POSS_2PL: { id: 'POSS_2PL', template: '(I)nIz', category: 'iyelik', slot: 'POSS' },
  CASE_ABL: {
    id: 'CASE_ABL',
    template: 'DAn',
    category: 'hâl',
    slot: 'CASE',
    pronominalN: 'prefix',
  },
  CASE_LOC: {
    id: 'CASE_LOC',
    template: 'DA',
    category: 'hâl',
    slot: 'CASE',
    pronominalN: 'prefix',
    kiHost: true,
  },
  CASE_DAT: {
    id: 'CASE_DAT',
    template: '(y)A',
    category: 'hâl',
    slot: 'CASE',
    pronominalN: 'replaceBuffer',
  },
  CASE_ACC: {
    id: 'CASE_ACC',
    template: '(y)I',
    category: 'hâl',
    slot: 'CASE',
    pronominalN: 'replaceBuffer',
  },
  CASE_GEN: { id: 'CASE_GEN', template: '(n)In', category: 'hâl', slot: 'CASE', kiHost: true },
  REL_KI: {
    id: 'REL_KI',
    template: 'ki',
    category: 'ilgi',
    slot: 'KI',
    invariant: true,
    setsPronominalN: true,
  },
  WITH_LA: { id: 'WITH_LA', template: '(y)lA', category: 'vasıta', slot: 'CASE' },
};

export const SUFFIX_IDS = Object.keys(SUFFIXES) as SuffixId[];

/** A card the player drops onto the word. `form` is the concrete variant shown (e.g. "lık");
 * omit it for archiphoneme cards (spec §5.3, "-lXk"), where the engine picks the variant. */
export interface SuffixCard {
  id: SuffixId;
  form?: string;
}

/** Maximum number of suffixes in one chain (spec §5.2). */
export const MAX_SUFFIXES = 12;
