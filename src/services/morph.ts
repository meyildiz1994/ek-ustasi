/** The app's morphology engine, backed by the generated dictionary (tools/dict). */
import derivations from '../../assets/dict/derivations.json';
import rootFlags from '../../assets/dict/root_flags.json';
import { lexiconFromAssets, type DerivationTree } from '../dict/lexicon';
import { createEngine, type RootInfo } from '../morph';

export const engine = createEngine(
  lexiconFromAssets(
    rootFlags as Record<string, RootInfo>,
    derivations as unknown as Record<string, DerivationTree>,
  ),
);
