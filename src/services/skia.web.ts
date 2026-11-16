/** Web: Skia runs on CanvasKit (WASM), which must load before any Canvas renders. */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export const loadSkia = (): Promise<void> => LoadSkiaWeb({ locateFile: (f: string) => `/${f}` });
