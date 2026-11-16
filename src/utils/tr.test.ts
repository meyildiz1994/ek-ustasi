import {
  TR_ALPHABET,
  isTrWord,
  trCapitalize,
  trCompare,
  trLetters,
  trLower,
  trNormalize,
  trUpper,
} from './tr';

describe('trUpper', () => {
  it.each([
    ['i', 'İ'],
    ['ı', 'I'],
    ['istanbul', 'İSTANBUL'],
    ['ırmak', 'IRMAK'],
    ['kapadokya', 'KAPADOKYA'],
    ['çğıöşü', 'ÇĞIÖŞÜ'],
    ['ek ustası', 'EK USTASI'],
    ['İzmir', 'İZMİR'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(trUpper(input)).toBe(expected);
  });
});

describe('trLower', () => {
  it.each([
    ['İ', 'i'],
    ['I', 'ı'],
    ['İSTANBUL', 'istanbul'],
    ['IRMAK', 'ırmak'],
    ['ÇĞIÖŞÜ', 'çğıöşü'],
    ['DİYARBAKIR', 'diyarbakır'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(trLower(input)).toBe(expected);
  });

  it('never leaves a combining dot (U+0307) behind', () => {
    expect(trLower('İ')).toHaveLength(1);
    expect(trLower('İSTANBUL')).not.toContain('̇');
  });

  it('round-trips every letter of the alphabet', () => {
    for (const ch of TR_ALPHABET) {
      expect(trLower(trUpper(ch))).toBe(ch);
    }
  });

  it('maps all 29 letters to 29 distinct upper-case letters', () => {
    const upper = new Set(TR_ALPHABET.map((c) => trUpper(c)));
    expect(upper.size).toBe(29);
  });
});

describe('trCapitalize', () => {
  it.each([
    ['istanbul', 'İstanbul'],
    ['ığdır', 'Iğdır'],
    ['İZMİR', 'İzmir'],
    [' şanlıurfa', ' şanlıurfa'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(trCapitalize(input)).toBe(expected);
  });
});

describe('trCompare', () => {
  it('sorts in Turkish alphabet order', () => {
    const words = [
      'üzüm',
      'şeker',
      'ılık',
      'çay',
      'ceviz',
      'ince',
      'ördek',
      'göz',
      'ğ',
      'zil',
      'armut',
    ];
    expect([...words].sort(trCompare)).toEqual([
      'armut',
      'ceviz',
      'çay',
      'göz',
      'ğ',
      'ılık',
      'ince',
      'ördek',
      'şeker',
      'üzüm',
      'zil',
    ]);
  });

  it('is case-insensitive with Turkish rules', () => {
    expect(trCompare('IRMAK', 'ırmak')).toBe(0);
    expect(trCompare('İNCE', 'ince')).toBe(0);
    expect(trCompare('I', 'i')).toBeLessThan(0);
  });

  it('orders prefixes first', () => {
    expect(trCompare('göz', 'gözlük')).toBeLessThan(0);
    expect(trCompare('gözlük', 'göz')).toBeGreaterThan(0);
  });

  it('puts non-alphabet characters after letters, by code point', () => {
    expect(trCompare('a', 'q')).toBeLessThan(0);
    expect(trCompare('q', 'a')).toBeGreaterThan(0);
    expect(trCompare('q', 'x')).toBeLessThan(0);
  });
});

describe('trNormalize', () => {
  it.each([
    ['  Kâğıt ', 'kağıt'],
    ['hâlâ', 'hala'],
    ['İKTİSÂDÎ', 'iktisadi'],
    ['Ûmran', 'umran'],
    ['MİLLÎ', 'milli'],
  ])('%s → %s', (input, expected) => {
    expect(trNormalize(input)).toBe(expected);
  });

  it('composes decomposed input (NFD → NFC)', () => {
    expect(trNormalize('göz')).toBe('göz');
  });
});

describe('isTrWord', () => {
  it.each(['göz', 'ağaç', 'ışık', 'şükür'])('accepts %s', (w) => expect(isTrWord(w)).toBe(true));
  it.each(['', 'Göz', 'quiz', 'wifi', 'kâğıt', 'iki kelime', 'abc1'])('rejects %p', (w) =>
    expect(isTrWord(w)).toBe(false),
  );
});

describe('trLetters', () => {
  it('splits by code point', () => {
    expect(trLetters('ağaç')).toEqual(['a', 'ğ', 'a', 'ç']);
  });
});
