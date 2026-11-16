/** MMKV-backed SaveProvider (spec §3, §14). */
import { createMMKV } from 'react-native-mmkv';

import type { SaveProvider } from '../store/save';

const KEY = 'save';

export function mmkvSaveProvider(): SaveProvider {
  const mmkv = createMMKV({ id: 'ek-ustasi' });
  return {
    load: () => mmkv.getString(KEY),
    save: (json) => mmkv.set(KEY, json),
  };
}
