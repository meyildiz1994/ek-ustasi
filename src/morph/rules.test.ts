/**
 * Morphology rule tests — written before the engine (spec §19, test-first).
 * Section A is the mandatory list from spec §6.6, verbatim.
 * Uncertain grammar decisions are documented in MORPHOLOGY_NOTES.md.
 */
import { COLUMNS, PARADIGMS, SPEC_CASES } from './cases.fixture';
import { applySuffix, derive, makeWord, type SuffixId } from './index';

const ids = (s: string) => (s === '' ? [] : (s.split(' ') as SuffixId[]));

function surfaceOf(root: string, chain: string): string {
  const r = derive(root, ids(chain));
  if (!r.ok) throw new Error(`${root} + ${chain} failed: ${r.reason} — ${r.explanation}`);
  return r.surface;
}

// ---------------------------------------------------------------------------
// A. Spec §6.6 mandatory cases
// ---------------------------------------------------------------------------
describe('§6.6 mandatory cases', () => {
  it.each(SPEC_CASES)('%s + %s → %s', (root, chain, expected) => {
    expect(surfaceOf(root, chain)).toBe(expected);
  });

  it('göz + lük (strict) ✓', () => {
    const r = applySuffix(makeWord('göz'), { id: 'DER_LIK', form: 'lük' }, { strictVariant: true });
    expect(r).toMatchObject({ ok: true, surface: 'gözlük' });
  });

  it('göz + lık (strict) ✗ VOWEL_HARMONY', () => {
    const r = applySuffix(makeWord('göz'), { id: 'DER_LIK', form: 'lık' }, { strictVariant: true });
    expect(r).toMatchObject({ ok: false, reason: 'VOWEL_HARMONY' });
  });

  it('kalem + DAn + lIk ✗ ORDER', () => {
    expect(derive('kalem', ['CASE_ABL', 'DER_LIK'])).toMatchObject({ ok: false, reason: 'ORDER' });
  });
});

// ---------------------------------------------------------------------------
// B. Inflection paradigms: one row per (root, suffix).
//    Columns: PLURAL, LOC, ABL, DAT, ACC, GEN, POSS_1SG, POSS_3SG, POSS_1PL, WITH_LA
// ---------------------------------------------------------------------------

describe.each(PARADIGMS)('paradigm: %s (%s)', (root, _rule, forms) => {
  it.each(COLUMNS.map((id, i) => [id, forms[i] as string]))(`${root} + %s → %s`, (id, expected) => {
    expect(surfaceOf(root, id)).toBe(expected);
  });
});

describe('2nd person possessives', () => {
  it.each([
    ['ev', 'POSS_2SG', 'evin'],
    ['kapı', 'POSS_2SG', 'kapın'],
    ['kitap', 'POSS_2SG', 'kitabın'],
    ['göz', 'POSS_2SG', 'gözün'],
    ['ev', 'POSS_2PL', 'eviniz'],
    ['kapı', 'POSS_2PL', 'kapınız'],
    ['kitap', 'POSS_2PL', 'kitabınız'],
    ['göz', 'POSS_2PL', 'gözünüz'],
    ['yol', 'POSS_2PL', 'yolunuz'],
    ['su', 'POSS_2SG', 'suyun'],
    ['ev', 'POSS_2SG CASE_LOC', 'evinde'],
  ])('%s + %s → %s', (root, chain, expected) => {
    expect(surfaceOf(root, chain)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// C. Derivation (yapım ekleri) — every intermediate form must be in the lexicon.
// ---------------------------------------------------------------------------
describe('derivation', () => {
  it.each([
    ['kitap', 'DER_CI', 'kitapçı'],
    ['kitap', 'DER_LIK', 'kitaplık'],
    ['kitap', 'DER_CI DER_LIK', 'kitapçılık'],
    ['iş', 'DER_CI DER_LIK', 'işçilik'],
    ['iş', 'DER_SIZ', 'işsiz'],
    ['iş', 'DER_SIZ DER_LIK', 'işsizlik'],
    ['ev', 'DER_LI', 'evli'],
    ['ev', 'DER_LI DER_LIK', 'evlilik'],
    ['ev', 'DER_SIZ', 'evsiz'],
    ['tuz', 'DER_LI', 'tuzlu'],
    ['tuz', 'DER_LIK', 'tuzluk'],
    ['tuz', 'DER_SIZ', 'tuzsuz'],
    ['su', 'DER_LI', 'sulu'],
    ['su', 'DER_SIZ', 'susuz'],
    ['su', 'DER_SIZ DER_LIK', 'susuzluk'],
    ['yol', 'DER_CI', 'yolcu'],
    ['yol', 'DER_CI DER_LIK', 'yolculuk'],
    ['yol', 'DER_SIZ DER_LIK', 'yolsuzluk'],
    ['balık', 'DER_CI', 'balıkçı'],
    ['balık', 'DER_CI DER_LIK', 'balıkçılık'],
    ['süt', 'DER_CI', 'sütçü'],
    ['süt', 'DER_LI', 'sütlü'],
    ['süt', 'DER_SIZ', 'sütsüz'],
    ['şeker', 'DER_CI', 'şekerci'],
    ['şeker', 'DER_LI', 'şekerli'],
    ['şeker', 'DER_SIZ', 'şekersiz'],
    ['şeker', 'DER_LIK', 'şekerlik'],
    ['elma', 'DER_CI', 'elmacı'],
    ['elma', 'DER_LIK', 'elmalık'],
    ['elma', 'DER_LI', 'elmalı'],
    ['kömür', 'DER_CI', 'kömürcü'],
    ['kömür', 'DER_LIK', 'kömürlük'],
    ['akıl', 'DER_LI', 'akıllı'],
    ['akıl', 'DER_SIZ', 'akılsız'],
    ['dost', 'DER_LIK', 'dostluk'],
    ['arkadaş', 'DER_LIK', 'arkadaşlık'],
    ['çiçek', 'DER_CI', 'çiçekçi'],
    ['çiçek', 'DER_LI', 'çiçekli'],
    ['çiçek', 'DER_LIK', 'çiçeklik'],
    ['ay', 'DER_LIK', 'aylık'],
    ['gün', 'DER_LIK', 'günlük'],
    ['yıl', 'DER_LIK', 'yıllık'],
    ['hafta', 'DER_LIK', 'haftalık'],
    ['baş', 'DER_LIK', 'başlık'],
    ['renk', 'DER_LI', 'renkli'],
    ['renk', 'DER_SIZ', 'renksiz'],
    ['saat', 'DER_CI', 'saatçi'],
    ['kalp', 'DER_SIZ', 'kalpsiz'],
    ['hayal', 'DER_CI', 'hayalci'],
    ['gol', 'DER_CI', 'golcü'],
    ['güneş', 'DER_LI', 'güneşli'],
    ['güneş', 'DER_LIK', 'güneşlik'],
    ['bulut', 'DER_LI', 'bulutlu'],
    ['bulut', 'DER_SIZ', 'bulutsuz'],
    ['kar', 'DER_LI', 'karlı'],
    ['yağmur', 'DER_LI', 'yağmurlu'],
    ['yağmur', 'DER_LIK', 'yağmurluk'],
    ['demir', 'DER_CI', 'demirci'],
    ['ağaç', 'DER_LI', 'ağaçlı'],
    ['ağaç', 'DER_LIK', 'ağaçlık'],
    ['taş', 'DER_CI', 'taşçı'],
    ['taş', 'DER_LI', 'taşlı'],
    ['taş', 'DER_LIK', 'taşlık'],
    ['kapı', 'DER_CI', 'kapıcı'],
    ['kapı', 'DER_CI DER_LIK', 'kapıcılık'],
    ['göz', 'DER_LI', 'gözlü'],
    ['göz', 'DER_CI', 'gözcü'],
  ])('%s + %s → %s', (root, chain, expected) => {
    expect(surfaceOf(root, chain)).toBe(expected);
  });

  it.each([
    ['alem', 'DER_CI', 'alemci'],
    ['masa', 'DER_CI', 'masacı'],
    ['kedi', 'DER_SIZ', 'kedisiz'],
    ['dert', 'DER_CI', 'dertçi'],
    ['fikir', 'DER_LIK', 'fikirlik'],
    ['uç', 'DER_CI', 'uççu'],
    ['gözlük', 'DER_SIZ', 'gözlüksüz'],
  ])('%s + %s ✗ NOT_LEXICAL (*%s)', (root, chain, surface) => {
    const r = derive(root, ids(chain));
    expect(r).toMatchObject({ ok: false, reason: 'NOT_LEXICAL' });
    if (!r.ok) expect(r.explanation).toContain(surface);
  });
});

// ---------------------------------------------------------------------------
// D. Chains mixing derivation and inflection
// ---------------------------------------------------------------------------
describe('chains', () => {
  it.each([
    ['kitap', 'DER_LIK PLURAL', 'kitaplıklar'],
    ['kitap', 'DER_LIK POSS_3SG', 'kitaplığı'],
    ['kitap', 'PLURAL POSS_1SG CASE_ABL', 'kitaplarımdan'],
    ['çocuk', 'PLURAL POSS_1PL CASE_DAT', 'çocuklarımıza'],
    ['göz', 'DER_LIK PLURAL POSS_1PL', 'gözlüklerimiz'],
    ['göz', 'DER_LIK DER_CI PLURAL', 'gözlükçüler'],
    ['göz', 'DER_LIK POSS_3SG', 'gözlüğü'],
    ['göz', 'DER_LIK POSS_1SG', 'gözlüğüm'],
    ['göz', 'DER_LIK DER_CI DER_LIK PLURAL POSS_1PL CASE_ABL', 'gözlükçülüklerimizden'],
    ['tuz', 'DER_LIK POSS_3SG CASE_LOC', 'tuzluğunda'],
    ['iş', 'DER_CI PLURAL', 'işçiler'],
    ['iş', 'DER_CI DER_LIK CASE_ACC', 'işçiliği'],
    ['iş', 'DER_SIZ DER_LIK POSS_3SG', 'işsizliği'],
    ['ev', 'DER_SIZ PLURAL', 'evsizler'],
    ['ev', 'PLURAL POSS_3SG CASE_LOC', 'evlerinde'],
    ['ev', 'PLURAL POSS_1SG CASE_LOC', 'evlerimde'],
    ['ev', 'PLURAL POSS_1PL', 'evlerimiz'],
    ['saat', 'PLURAL POSS_1PL', 'saatlerimiz'],
    ['saat', 'POSS_3SG CASE_LOC', 'saatinde'],
    ['ağız', 'POSS_1SG CASE_ABL', 'ağzımdan'],
    ['burun', 'POSS_3SG CASE_ABL', 'burnundan'],
    ['su', 'POSS_3SG CASE_LOC', 'suyunda'],
    ['kalp', 'POSS_1SG CASE_LOC', 'kalbimde'],
    ['hak', 'POSS_1PL CASE_LOC', 'hakkımızda'],
    ['renk', 'POSS_3SG CASE_DAT', 'rengine'],
    ['balık', 'POSS_3SG', 'balığı'],
    ['akıl', 'POSS_3SG', 'aklı'],
    ['dost', 'DER_LIK POSS_3SG', 'dostluğu'],
    ['baş', 'DER_LIK POSS_3SG', 'başlığı'],
    ['yol', 'DER_CI PLURAL', 'yolcular'],
    ['kalem', 'DER_LIK PLURAL', 'kalemlikler'],
  ])('%s + %s → %s', (root, chain, expected) => {
    expect(surfaceOf(root, chain)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// E. Pronominal n (3SG possessive / -ki + case) and -ki
// ---------------------------------------------------------------------------
describe('pronominal n and -ki', () => {
  it.each([
    ['ev', 'POSS_3SG CASE_LOC', 'evinde'],
    ['ev', 'POSS_3SG CASE_DAT', 'evine'],
    ['ev', 'POSS_3SG CASE_ACC', 'evini'],
    ['ev', 'POSS_3SG CASE_GEN', 'evinin'],
    ['ev', 'POSS_3SG CASE_ABL', 'evinden'],
    ['ev', 'POSS_3SG WITH_LA', 'eviyle'],
    ['kapı', 'POSS_3SG CASE_LOC', 'kapısında'],
    ['kapı', 'POSS_3SG CASE_DAT', 'kapısına'],
    ['kapı', 'POSS_3SG CASE_ACC', 'kapısını'],
    ['kitap', 'POSS_3SG CASE_ABL', 'kitabından'],
    ['ev', 'CASE_LOC REL_KI', 'evdeki'],
    ['ev', 'CASE_LOC REL_KI PLURAL', 'evdekiler'],
    ['ev', 'CASE_LOC REL_KI PLURAL CASE_ABL', 'evdekilerden'],
    ['ev', 'CASE_LOC REL_KI CASE_ACC', 'evdekini'],
    ['ev', 'CASE_LOC REL_KI CASE_DAT', 'evdekine'],
    ['ev', 'CASE_LOC REL_KI CASE_LOC', 'evdekinde'],
    ['ev', 'CASE_LOC REL_KI CASE_GEN', 'evdekinin'],
    ['ev', 'CASE_LOC REL_KI WITH_LA', 'evdekiyle'],
    ['ev', 'CASE_LOC REL_KI CASE_LOC REL_KI', 'evdekindeki'],
    ['ev', 'POSS_1SG CASE_LOC REL_KI', 'evimdeki'],
    ['kalem', 'CASE_GEN REL_KI', 'kaleminki'],
    ['kalem', 'CASE_GEN REL_KI CASE_ACC', 'kaleminkini'],
    ['kalem', 'POSS_1SG CASE_GEN REL_KI', 'kalemiminki'],
    ['yol', 'CASE_LOC REL_KI PLURAL', 'yoldakiler'],
    ['kitap', 'CASE_LOC REL_KI', 'kitaptaki'],
    ['dün', 'REL_KI', 'dünkü'],
    ['bugün', 'REL_KI PLURAL', 'bugünküler'],
    ['yarın', 'REL_KI', 'yarınki'],
    ['akşam', 'REL_KI', 'akşamki'],
    ['sabah', 'REL_KI', 'sabahki'],
    ['önce', 'REL_KI', 'önceki'],
    ['sonra', 'REL_KI', 'sonraki'],
    ['öbür', 'REL_KI', 'öbürkü'],
  ])('%s + %s → %s', (root, chain, expected) => {
    expect(surfaceOf(root, chain)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// F. Morphotactic order errors
// ---------------------------------------------------------------------------
describe('ORDER errors', () => {
  it.each([
    ['kalem', 'CASE_ABL DER_LIK'],
    ['ev', 'PLURAL DER_LIK'],
    ['ev', 'POSS_1SG DER_LIK'],
    ['ev', 'POSS_1SG PLURAL'],
    ['ev', 'CASE_LOC PLURAL'],
    ['ev', 'CASE_LOC CASE_ABL'],
    ['ev', 'POSS_1SG POSS_3SG'],
    ['ev', 'PLURAL PLURAL'],
    ['ev', 'CASE_ABL REL_KI'],
    ['ev', 'CASE_DAT REL_KI'],
    ['kalem', 'REL_KI'],
    ['ev', 'REL_KI REL_KI'],
    ['ev', 'CASE_LOC REL_KI DER_LIK'],
    ['ev', 'CASE_LOC REL_KI POSS_1SG'],
    ['ev', 'CASE_LOC REL_KI PLURAL POSS_1SG'],
    ['ev', 'CASE_LOC REL_KI PLURAL PLURAL'],
    ['ev', 'CASE_LOC WITH_LA'],
    ['ev', 'WITH_LA REL_KI'],
    ['ev', 'CASE_LOC REL_KI REL_KI'],
  ])('%s + %s ✗ ORDER', (root, chain) => {
    const r = derive(root, ids(chain));
    expect(r).toMatchObject({ ok: false, reason: 'ORDER' });
  });

  it('explains which category cannot follow which', () => {
    const r = derive('kalem', ['CASE_ABL', 'DER_LIK']);
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.explanation).toBe('Bu ek buraya gelemez: hâl ekinden sonra yapım eki gelmez.');
  });

  it('explains the -ki rule', () => {
    const r = derive('kalem', ['REL_KI']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.explanation).toContain('-ki');
  });
});

// ---------------------------------------------------------------------------
// G. strictVariant: the concrete card the player dropped must be the correct allomorph
// ---------------------------------------------------------------------------
describe('strictVariant', () => {
  const strict = { strictVariant: true };

  it.each([
    ['göz', 'DER_LIK', 'lük', 'gözlük'],
    ['kalem', 'DER_LIK', 'lik', 'kalemlik'],
    ['kitap', 'CASE_LOC', 'ta', 'kitapta'],
    ['ev', 'CASE_LOC', 'de', 'evde'],
    ['iş', 'DER_CI', 'çi', 'işçi'],
    ['kapı', 'CASE_DAT', 'ya', 'kapıya'],
    ['saat', 'CASE_ACC', 'i', 'saati'],
    ['kapı', 'POSS_3SG', 'sı', 'kapısı'],
    ['gözlük', 'DER_CI', 'çü', 'gözlükçü'],
    ['kalem', 'PLURAL', 'ler', 'kalemler'],
    ['kitap', 'POSS_3SG', 'ı', 'kitabı'],
  ])('%s + %s "-%s" ✓ → %s', (root, id, form, expected) => {
    const r = applySuffix(makeWord(root), { id: id as SuffixId, form }, strict);
    expect(r).toMatchObject({ ok: true, surface: expected });
  });

  it.each([
    ['göz', 'DER_LIK', 'lık', 'VOWEL_HARMONY'],
    ['göz', 'DER_LIK', 'lik', 'VOWEL_HARMONY'],
    ['göz', 'DER_LIK', 'luk', 'VOWEL_HARMONY'],
    ['kalem', 'DER_LIK', 'lık', 'VOWEL_HARMONY'],
    ['kalem', 'PLURAL', 'lar', 'VOWEL_HARMONY'],
    ['kitap', 'CASE_LOC', 'te', 'VOWEL_HARMONY'],
    ['saat', 'CASE_ACC', 'ı', 'VOWEL_HARMONY'],
    ['gözlük', 'DER_CI', 'çu', 'VOWEL_HARMONY'],
    ['kalem', 'POSS_1PL', 'imız', 'VOWEL_HARMONY'],
    ['kitap', 'CASE_LOC', 'da', 'CONSONANT'],
    ['ev', 'CASE_LOC', 'te', 'CONSONANT'],
    ['iş', 'DER_CI', 'ci', 'CONSONANT'],
    ['gözlük', 'DER_CI', 'cü', 'CONSONANT'],
    ['kapı', 'CASE_DAT', 'a', 'CONSONANT'],
    ['kalem', 'CASE_DAT', 'ye', 'CONSONANT'],
    ['kapı', 'POSS_3SG', 'ı', 'CONSONANT'],
    ['kapı', 'POSS_1SG', 'ım', 'CONSONANT'],
    ['kitap', 'CASE_ABL', 'dan', 'CONSONANT'],
  ])('%s + %s "-%s" ✗ %s', (root, id, form, reason) => {
    const r = applySuffix(makeWord(root), { id: id as SuffixId, form }, strict);
    expect(r).toMatchObject({ ok: false, reason });
  });

  it('uses the spec wording for front/back mismatches', () => {
    const r = applySuffix(makeWord('kalem'), { id: 'DER_LIK', form: 'lık' }, strict);
    expect(r).toEqual({
      ok: false,
      reason: 'VOWEL_HARMONY',
      explanation: 'Ünlü uyumu bozuldu: son ünlü e (ince), ek -lık (kalın).',
    });
  });

  it('explains rounding mismatches', () => {
    const r = applySuffix(makeWord('göz'), { id: 'DER_LIK', form: 'lik' }, strict);
    expect(r).toMatchObject({
      explanation: 'Ünlü uyumu bozuldu: son ünlü ö (yuvarlak), ek -lik (düz).',
    });
  });

  it('explains the governing vowel inside the suffix', () => {
    const r = applySuffix(makeWord('kalem'), { id: 'POSS_1PL', form: 'imız' }, strict);
    expect(r).toMatchObject({
      explanation: 'Ünlü uyumu bozuldu: son ünlü i (ince), ek -imız (kalın).',
    });
  });

  it('explains foreign-origin exceptions', () => {
    const r = applySuffix(makeWord('saat'), { id: 'CASE_ACC', form: 'ı' }, strict);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.explanation).toContain('istisna');
  });

  it.each([
    [
      'kitap',
      'CASE_LOC',
      'da',
      'Ünsüz benzeşmesi: "kitap" sert ünsüzle (p) bitiyor, ek -ta olmalı.',
    ],
    ['ev', 'CASE_LOC', 'te', 'Ünsüz benzeşmesi: "ev" sert ünsüzle bitmiyor, ek -de olmalı.'],
    ['kapı', 'CASE_DAT', 'a', '"kapı" ünlüyle bittiği için ek -ya olmalı.'],
    ['kalem', 'CASE_DAT', 'ye', '"kalem" ünsüzle bittiği için ek -e olmalı.'],
  ])('%s + %s "-%s" explanation', (root, id, form, explanation) => {
    const r = applySuffix(makeWord(root), { id: id as SuffixId, form }, strict);
    expect(r).toMatchObject({ ok: false, explanation });
  });

  it('explains the pronominal n', () => {
    const evi = derive('ev', ['POSS_3SG']);
    if (!evi.ok) throw new Error('setup');
    const r = applySuffix(evi.word, { id: 'CASE_LOC', form: 'de' }, strict);
    expect(r).toMatchObject({ ok: false, reason: 'CONSONANT' });
    if (!r.ok) expect(r.explanation).toContain('-nde');
  });

  it('falls back to a generic consonant explanation', () => {
    const r = applySuffix(makeWord('ev'), { id: 'PLURAL', form: 'rel' }, strict);
    expect(r).toEqual({
      ok: false,
      reason: 'CONSONANT',
      explanation: 'Bu ek burada -ler biçimini alır.',
    });
  });

  it('ignores the card form when strictVariant is off', () => {
    const r = applySuffix(makeWord('göz'), { id: 'DER_LIK', form: 'lık' });
    expect(r).toMatchObject({ ok: true, surface: 'gözlük' });
  });

  it('accepts archiphoneme cards (no concrete form) in strict mode', () => {
    const r = applySuffix(makeWord('göz'), { id: 'DER_LIK' }, strict);
    expect(r).toMatchObject({ ok: true, surface: 'gözlük' });
  });

  it('reports harmony before lexical errors', () => {
    const r = applySuffix(makeWord('alem'), { id: 'DER_CI', form: 'cı' }, strict);
    expect(r).toMatchObject({ ok: false, reason: 'VOWEL_HARMONY' });
  });
});

// ---------------------------------------------------------------------------
// H. Structural invariants
// ---------------------------------------------------------------------------
describe('morphemes', () => {
  it.each([
    ['kitap', 'POSS_3SG', ['kitab', 'ı']],
    ['göz', 'DER_LIK DER_CI DER_LIK CASE_ABL', ['göz', 'lük', 'çü', 'lük', 'ten']],
    ['kalem', 'DER_LIK POSS_3SG', ['kalem', 'liğ', 'i']],
    ['ağız', 'POSS_3SG', ['ağz', 'ı']],
    ['hak', 'POSS_1SG', ['hakk', 'ım']],
    ['ev', 'POSS_3SG CASE_LOC', ['ev', 'i', 'nde']],
    ['su', 'POSS_3SG', ['su', 'yu']],
  ])('%s + %s → %j', (root, chain, morphemes) => {
    const r = derive(root, ids(chain));
    expect(r).toMatchObject({ ok: true, morphemes });
    if (r.ok) expect(r.morphemes.join('')).toBe(r.surface);
  });

  it('derive with no suffixes returns the root', () => {
    expect(derive('göz', [])).toMatchObject({ ok: true, surface: 'göz', morphemes: ['göz'] });
  });
});
