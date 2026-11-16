import {
  MAX_SUFFIXES,
  SUFFIXES,
  SUFFIX_IDS,
  applySuffix,
  bestChain,
  createEngine,
  createLexicon,
  derive,
  enumerateChains,
  makeWord,
  treeHeight,
  treeSize,
  type ChainTree,
  type SuffixId,
} from './index';

describe('makeWord', () => {
  it('normalises the root (tr lower-case, circumflex)', () => {
    expect(makeWord('KİTAP').surface).toBe('kitap');
    expect(makeWord(' Kâğıt ').surface).toBe('kağıt');
  });

  it.each(['', 'quiz', 'krt', 'iki kelime'])('rejects %p', (root) => {
    expect(() => makeWord(root)).toThrow('Invalid root');
  });

  it('starts with no suffixes', () => {
    expect(makeWord('göz')).toMatchObject({
      suffixIds: [],
      morphemes: ['göz'],
      pronominalN: false,
    });
  });
});

describe('suffix catalogue', () => {
  it('has every id once and matches spec §6.2 templates', () => {
    expect(new Set(SUFFIX_IDS).size).toBe(SUFFIX_IDS.length);
    expect(SUFFIXES.PLURAL.template).toBe('lAr');
    expect(SUFFIXES.DER_LIK.template).toBe('lIk');
    expect(SUFFIXES.CASE_GEN.template).toBe('(n)In');
    expect(SUFFIXES.REL_KI.template).toBe('ki');
    expect(SUFFIXES.WITH_LA.template).toBe('(y)lA');
  });
});

describe('MAX_SUFFIXES', () => {
  it('rejects a 13th suffix', () => {
    // ev-de-ki-n-de-ki-n-de-ki-n-de-ki-n-de-ki-n-de-ki → 12 suffixes, then one more.
    const chain: SuffixId[] = [];
    while (chain.length < MAX_SUFFIXES) chain.push(chain.length % 2 === 0 ? 'CASE_LOC' : 'REL_KI');
    const twelve = derive('ev', chain);
    expect(twelve.ok).toBe(true);
    if (!twelve.ok) return;
    expect(twelve.word.suffixIds).toHaveLength(12);
    const r = applySuffix(twelve.word, { id: 'CASE_LOC' });
    expect(r).toMatchObject({
      ok: false,
      reason: 'ORDER',
      explanation: 'En fazla 12 ek takabilirsin.',
    });
  });
});

describe('strict consonant explanation inside the suffix', () => {
  it('explains D after the pronominal n', () => {
    const evi = derive('ev', ['POSS_3SG']);
    if (!evi.ok) throw new Error('setup');
    const r = applySuffix(evi.word, { id: 'CASE_LOC', form: 'nte' }, { strictVariant: true });
    expect(r).toMatchObject({
      ok: false,
      reason: 'CONSONANT',
      explanation: 'Ünsüz benzeşmesi: "evi" sert ünsüzle bitmiyor, ek -nde olmalı.',
    });
  });

  it('lower-cases card forms with Turkish rules', () => {
    const r = applySuffix(
      makeWord('kapı'),
      { id: 'CASE_ACC', form: 'YI' },
      { strictVariant: true },
    );
    expect(r).toMatchObject({ ok: true, surface: 'kapıyı' });
  });
});

describe('createEngine with a custom lexicon', () => {
  const engine = createEngine(
    createLexicon({
      roots: { mektep: { noSoften: true } },
      derived: ['saatçi', 'harfli', 'mektepli'],
    }),
  );

  it('uses the injected root flags (saat is unflagged here, so it harmonises and softens)', () => {
    expect(engine.derive('saat', ['POSS_3SG'])).toMatchObject({ surface: 'saadı' });
    expect(engine.derive('mektep', ['POSS_3SG'])).toMatchObject({ surface: 'mektepi' });
  });

  it('uses the injected derived-word list', () => {
    expect(engine.derive('mektep', ['DER_LI'])).toMatchObject({ ok: true, surface: 'mektepli' });
    expect(engine.derive('göz', ['DER_LIK'])).toMatchObject({ ok: false, reason: 'NOT_LEXICAL' });
  });

  it('applies lexical flags of a derived word', () => {
    const e = createEngine(
      createLexicon({ roots: { kalplı: { frontOverride: true } }, derived: ['kalplı'] }),
    );
    // Artificial flag: proves a derived word's own entry governs the next suffix.
    const r = e.derive('kalp', ['DER_LI']);
    expect(r.ok && r.word.harmonyOverride).toBe('i');
  });
});

describe('enumerateChains', () => {
  const tree = enumerateChains('göz', 3);

  const collect = (node: ChainTree, path: SuffixId[], out: [SuffixId[], string][]) => {
    out.push([path, node.surface]);
    for (const c of node.children) collect(c, [...path, c.suffixId as SuffixId], out);
    return out;
  };

  it('has the root at depth 0', () => {
    expect(tree.surface).toBe('göz');
    expect(tree.suffixId).toBeUndefined();
  });

  it('contains the gözlük → gözlükçü → gözlükçülük chain', () => {
    const gozluk = tree.children.find((c) => c.surface === 'gözlük');
    const gozlukcu = gozluk?.children.find((c) => c.surface === 'gözlükçü');
    expect(gozlukcu?.children.map((c) => c.surface)).toContain('gözlükçülük');
  });

  it('every node is reproducible with derive()', () => {
    const nodes = collect(tree, [], []);
    expect(nodes.length).toBe(treeSize(tree));
    for (const [path, surface] of nodes) {
      expect(derive('göz', path)).toMatchObject({ ok: true, surface });
    }
  });

  it('respects maxDepth', () => {
    expect(treeHeight(tree)).toBe(3);
    expect(enumerateChains('göz', 0).children).toEqual([]);
  });

  it('is deterministic', () => {
    expect(collect(enumerateChains('kalem', 3), [], [])).toEqual(
      collect(enumerateChains('kalem', 3), [], []),
    );
  });

  it('never contains NOT_LEXICAL derivations', () => {
    const surfaces = collect(enumerateChains('alem', 2), [], []).map(([, s]) => s);
    expect(surfaces).not.toContain('alemci');
  });
});

describe('bestChain', () => {
  it('returns a deepest, valid chain', () => {
    const tree = enumerateChains('göz', 4);
    const chain = bestChain(tree);
    expect(chain).toHaveLength(4);
    expect(derive('göz', chain).ok).toBe(true);
  });

  it('prefers the more branching subtree on equal depth', () => {
    const leaf = (s: string, id: SuffixId): ChainTree => ({
      word: makeWord('ev'),
      surface: s,
      suffixId: id,
      children: [],
    });
    const tree: ChainTree = {
      word: makeWord('ev'),
      surface: 'ev',
      children: [
        { ...leaf('evler', 'PLURAL'), children: [leaf('evlerde', 'CASE_LOC')] },
        {
          ...leaf('evli', 'DER_LI'),
          children: [leaf('evlilik', 'DER_LIK'), leaf('evliler', 'PLURAL')],
        },
      ],
    };
    expect(bestChain(tree)).toEqual(['DER_LI', 'DER_LIK']);
  });

  it('returns [] for a lone root', () => {
    expect(bestChain(enumerateChains('göz', 0))).toEqual([]);
  });
});
