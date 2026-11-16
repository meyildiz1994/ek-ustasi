import {
  BACK,
  FRONT,
  HARD_CONS,
  ROUNDED,
  UNROUNDED,
  VOWELS,
  assimilateC,
  assimilateD,
  dropLastVowel,
  endsWithVowel,
  frontOf,
  geminate,
  harmonizeA,
  harmonizeI,
  isFront,
  isHard,
  isRounded,
  isVowel,
  lastChar,
  lastVowel,
  soften,
  syllableCount,
  vowelsOf,
} from './phonology';

describe('sound classes (§6.1)', () => {
  it('has 8 vowels split 4/4 by frontness and by rounding', () => {
    expect(VOWELS).toHaveLength(8);
    expect([...FRONT, ...BACK].sort()).toEqual([...VOWELS].sort());
    expect([...ROUNDED, ...UNROUNDED].sort()).toEqual([...VOWELS].sort());
  });

  it.each(VOWELS)('%s is a vowel', (v) => expect(isVowel(v)).toBe(true));
  it.each(['b', 'ç', 'ğ', 'ş', 'y', ''])('%p is not a vowel', (c) =>
    expect(isVowel(c)).toBe(false),
  );
  it.each(FRONT)('%s is front', (v) => expect(isFront(v)).toBe(true));
  it.each(BACK)('%s is back', (v) => expect(isFront(v)).toBe(false));
  it.each(ROUNDED)('%s is rounded', (v) => expect(isRounded(v)).toBe(true));
  it.each(UNROUNDED)('%s is unrounded', (v) => expect(isRounded(v)).toBe(false));
  it.each(HARD_CONS)('%s is hard (FıSTıKÇı ŞaHaP)', (c) => expect(isHard(c)).toBe(true));
  it.each(['b', 'c', 'd', 'g', 'ğ', 'j', 'l', 'm', 'n', 'r', 'v', 'y', 'z', 'a'])(
    '%s is not hard',
    (c) => expect(isHard(c)).toBe(false),
  );
});

describe('vowel helpers', () => {
  it.each([
    ['kitap', 'a'],
    ['göz', 'ö'],
    ['kapı', 'ı'],
    ['otobüs', 'ü'],
  ])('lastVowel(%s) = %s', (w, v) => expect(lastVowel(w)).toBe(v));

  it('lastVowel of a vowelless string is undefined', () =>
    expect(lastVowel('krt')).toBeUndefined());

  it.each([
    ['gözlükçülük', 4],
    ['ev', 1],
    ['saat', 2],
    ['kalemliklerimizden', 7],
  ])('syllableCount(%s) = %d', (w, n) => expect(syllableCount(w)).toBe(n));

  it('vowelsOf', () => expect(vowelsOf('kalemlik')).toEqual(['a', 'e', 'i']));
  it('endsWithVowel', () => {
    expect(endsWithVowel('kapı')).toBe(true);
    expect(endsWithVowel('kalem')).toBe(false);
    expect(endsWithVowel('')).toBe(false);
  });
  it('lastChar', () => {
    expect(lastChar('göz')).toBe('z');
    expect(lastChar('')).toBe('');
  });
});

describe('harmony (§6.3 rules 1–2)', () => {
  it.each([
    ['a', 'a'],
    ['ı', 'a'],
    ['o', 'a'],
    ['u', 'a'],
    ['e', 'e'],
    ['i', 'e'],
    ['ö', 'e'],
    ['ü', 'e'],
  ] as const)('A after %s → %s', (v, out) => expect(harmonizeA(v)).toBe(out));

  it.each([
    ['a', 'ı'],
    ['ı', 'ı'],
    ['e', 'i'],
    ['i', 'i'],
    ['o', 'u'],
    ['u', 'u'],
    ['ö', 'ü'],
    ['ü', 'ü'],
  ] as const)('I after %s → %s', (v, out) => expect(harmonizeI(v)).toBe(out));

  it.each([
    ['a', 'e'],
    ['ı', 'i'],
    ['o', 'ö'],
    ['u', 'ü'],
    ['e', 'e'],
    ['ü', 'ü'],
  ] as const)('frontOf(%s) = %s', (v, out) => expect(frontOf(v)).toBe(out));
});

describe('consonants (§6.3 rules 3–4)', () => {
  it.each(HARD_CONS)('D/C after %s → t/ç', (c) => {
    expect(assimilateD(c)).toBe('t');
    expect(assimilateC(c)).toBe('ç');
  });
  it.each(['z', 'l', 'a', 'n'])('D/C after %s → d/c', (c) => {
    expect(assimilateD(c)).toBe('d');
    expect(assimilateC(c)).toBe('c');
  });

  it.each([
    ['kitap', 'kitab'],
    ['ağaç', 'ağac'],
    ['kanat', 'kanad'],
    ['çocuk', 'çocuğ'],
    ['renk', 'reng'],
    ['k', 'ğ'],
    ['göz', 'göz'],
    ['kalem', 'kalem'],
  ])('soften(%s) = %s', (w, out) => expect(soften(w)).toBe(out));

  it.each([
    ['ağız', 'ağz'],
    ['burun', 'burn'],
    ['oğul', 'oğl'],
    ['krt', 'krt'],
  ])('dropLastVowel(%s) = %s', (w, out) => expect(dropLastVowel(w)).toBe(out));

  it('geminate', () => expect(geminate('hak')).toBe('hakk'));
});
