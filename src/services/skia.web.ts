/** Web: Skia runs on CanvasKit (WASM), which must load before any Canvas renders. */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Honours a hosting sub-path (experiments.baseUrl) so preview builds work outside the site root.
const base = process.env.EXPO_BASE_URL ?? '';

export const loadSkia = (): Promise<void> =>
  LoadSkiaWeb({ locateFile: (f: string) => `${base}/${f}` });
