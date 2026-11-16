/** App-wide game store with the real dependencies (MMKV + bundled level packs). */
import { useStore } from 'zustand';

import { loadLevel } from '../services/levels';
import { engine } from '../services/morph';
import { mmkvSaveProvider } from '../services/storage';
import { createGameStore, type GameState } from './game';

export const gameStore = createGameStore({ provider: mmkvSaveProvider(), loadLevel, engine });

export function useGame<T>(selector: (s: GameState) => T): T {
  return useStore(gameStore, selector);
}
