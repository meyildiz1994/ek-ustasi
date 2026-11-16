/**
 * Builds the engine Lexicon from the generated dictionary assets (tools/dict/build.ts):
 *   root_flags.json   { word: RootInfo }
 *   derivations.json  { root: { SUFFIX_ID: [surface, subtree?] } }
 */
import { createLexicon, type Lexicon, type RootInfo } from '../morph';

export type DerivationTree = { [suffixId: string]: [string, DerivationTree?] };

export function collectDerived(trees: Readonly<Record<string, DerivationTree>>): Set<string> {
  const out = new Set<string>();
  const walk = (t: DerivationTree) => {
    for (const [surface, sub] of Object.values(t)) {
      out.add(surface);
      if (sub) walk(sub);
    }
  };
  for (const t of Object.values(trees)) walk(t);
  return out;
}

export function lexiconFromAssets(
  rootFlags: Readonly<Record<string, RootInfo>>,
  derivations: Readonly<Record<string, DerivationTree>>,
): Lexicon {
  return createLexicon({ roots: rootFlags, derived: collectDerived(derivations) });
}
