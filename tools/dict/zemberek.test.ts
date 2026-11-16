import { describe, expect, it } from 'vitest';

import { parseDictionary, parseLine } from './zemberek';

describe('parseLine', () => {
  it('parses a bare noun', () => {
    expect(parseLine('kitap')).toEqual({
      lemma: 'kitap',
      pos: 'Noun',
      secondaryPos: [],
      attributes: [],
      index: 0,
    });
  });
  it('infers verbs from -mak/-mek', () => {
    expect(parseLine('gelmek')?.pos).toBe('Verb');
    expect(parseLine('abanmak')?.pos).toBe('Verb');
    expect(parseLine('mak')?.pos).toBe('Noun');
  });
  it('parses attributes, secondary POS and index', () => {
    expect(parseLine('saat [A:InverseHarmony, NoVoicing]')).toMatchObject({
      attributes: ['InverseHarmony', 'NoVoicing'],
    });
    expect(parseLine('bugün [P:Noun, Time]')).toMatchObject({
      pos: 'Noun',
      secondaryPos: ['Time'],
    });
    expect(parseLine('ben [P:Pron,Pers]')).toMatchObject({ pos: 'Pron', secondaryPos: ['Pers'] });
    expect(parseLine('hak [P:Noun; A:Doubling, InverseHarmony ; Index:1]')).toMatchObject({
      attributes: ['Doubling', 'InverseHarmony'],
      index: 1,
    });
    expect(parseLine('acemborusu [A:CompoundP3sg; Roots:acem-boru]')).toMatchObject({
      attributes: ['CompoundP3sg'],
    });
  });
  it('skips blanks and comments', () => {
    expect(parseLine('')).toBeNull();
    expect(parseLine('## comment [P:Abbrv]')).toBeNull();
    expect(parseLine('[P:Noun]')).toBeNull();
    expect(parseLine('x [weird]')).toMatchObject({ lemma: 'x', attributes: [] });
  });
  it('parses a file', () => {
    expect(parseDictionary('a\n\nb [P:Adj]\n').map((e) => e.lemma)).toEqual(['a', 'b']);
  });
});
