/**
 * Runs the morphology fixtures against the lexicon generated from Zemberek (assets/dict), so a
 * dictionary rebuild can never silently break §6.6 or the paradigms.
 */
import derivations from '../../assets/dict/derivations.json';
import rootFlags from '../../assets/dict/root_flags.json';
import { COLUMNS, PARADIGMS, SPEC_CASES } from '../morph/cases.fixture';
import { createEngine, type RootInfo, type SuffixId } from '../morph';
import { collectDerived, lexiconFromAssets, type DerivationTree } from './lexicon';

const trees = derivations as unknown as Record<string, DerivationTree>;
const engine = createEngine(lexiconFromAssets(rootFlags as Record<string, RootInfo>, trees));
const surface = (root: string, chain: SuffixId[]) => {
  const r = engine.derive(root, chain);
  return r.ok ? r.surface : `${r.reason}: ${r.explanation}`;
};

describe('generated lexicon: §6.6', () => {
  it.each(SPEC_CASES)('%s + %s → %s', (root, chain, expected) => {
    expect(surface(root, chain.split(' ') as SuffixId[])).toBe(expected);
  });
});

describe.each(PARADIGMS)('generated lexicon paradigm: %s (%s)', (root, _rule, forms) => {
  it.each(COLUMNS.map((id, i) => [id, forms[i] as string]))(`${root} + %s → %s`, (id, expected) => {
    expect(surface(root, [id as SuffixId])).toBe(expected);
  });
});

describe('generated lexicon: Ek Turu', () => {
  it('rejects unattested derivations', () => {
    expect(engine.derive('alem', ['DER_CI'])).toMatchObject({ ok: false, reason: 'NOT_LEXICAL' });
  });

  it('collects every surface in the derivation trees', () => {
    const all = collectDerived(trees);
    expect(all.has('gözlükçülük')).toBe(true);
    expect(all.size).toBeGreaterThan(1000);
  });
});
