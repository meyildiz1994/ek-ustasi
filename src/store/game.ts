/**
 * Game store (zustand + immer). Created with injected dependencies so tests run without native
 * modules; src/store/index.ts wires the real ones.
 */
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';

import type { CellKey } from '../game/grid';
import type { Level } from '../game/level';
import { bonusCoins, levelEndCoins } from '../game/scoring';
import {
  newSession,
  sessionStars,
  shuffleSession,
  submitWord,
  useHint,
  type HintRequest,
  type Session,
  type SubmitOutcome,
} from '../game/session';
import { createRng, hashSeed } from '../utils/rng';
import { readSave, writeSave, type SaveData, type SaveProvider, type Settings } from './save';

export interface GameDeps {
  provider: SaveProvider;
  loadLevel: (id: number) => Promise<Level>;
  now?: () => number;
}

export interface LevelResult {
  stars: 1 | 2 | 3;
  coins: number;
  score: number;
}

export interface GameState {
  save: SaveData;
  level: Level | null;
  session: Session | null;
  /** Set when the level is solved; cleared by nextLevel(). */
  result: LevelResult | null;
  loading: boolean;
  error: string | null;

  openLevel(id?: number): Promise<void>;
  submit(word: string): SubmitOutcome | null;
  hint(req: HintRequest): { cost: number; opened: CellKey[]; completed: string[] } | null;
  shuffle(): void;
  nextLevel(): Promise<void>;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
}

export function createGameStore(deps: GameDeps) {
  const now = deps.now ?? (() => Date.now());
  let rngCounter = 0;
  const rngFor = (level: Level) => createRng(hashSeed(level.seed, Date.now(), rngCounter++));

  return createStore<GameState>()(
    immer((set, get) => {
      const persist = () => writeSave(deps.provider, get().save);

      const finish = () => {
        const { session, level } = get();
        if (!session || !level) return;
        const stars = sessionStars(session);
        const coins = levelEndCoins(stars);
        set((st) => {
          st.result = { stars, coins, score: session.score };
          st.save.coins += coins;
          st.save.stars[level.id] = Math.max(st.save.stars[level.id] ?? 0, stars) as 1 | 2 | 3;
          st.save.currentLevel = Math.max(st.save.currentLevel, level.id + 1);
          st.save.session = null;
        });
        persist();
      };

      return {
        save: readSave(deps.provider),
        level: null,
        session: null,
        result: null,
        loading: false,
        error: null,

        async openLevel(id) {
          const target = id ?? get().save.currentLevel;
          set((st) => {
            st.loading = true;
            st.error = null;
          });
          try {
            const level = await deps.loadLevel(target);
            const saved = get().save.session;
            const session = saved && saved.levelId === level.id ? saved : newSession(level);
            set((st) => {
              st.level = level;
              st.session = session;
              st.result = null;
              st.loading = false;
              st.save.session = session;
            });
            persist();
          } catch (e) {
            set((st) => {
              st.loading = false;
              st.error = e instanceof Error ? e.message : String(e);
            });
          }
        },

        submit(word) {
          const { level, session, result } = get();
          if (!level || !session || result) return null;
          const out = submitWord(level, session, word, now());
          if (out.result === 'target' || out.result === 'bonus') {
            set((st) => {
              st.session = out.session;
              st.save.session = out.session;
              st.save.coins += out.coins;
              if (out.result === 'bonus') {
                const before = st.save.bonusCounter;
                st.save.bonusCounter += 1;
                st.save.coins += bonusCoins(before, st.save.bonusCounter);
              }
            });
            persist();
            if (out.solved) finish();
          }
          return out;
        },

        hint(req) {
          const { level, session, save } = get();
          if (!level || !session) return null;
          const out = useHint(level, session, req, save.coins, rngFor(level));
          if (!out) return null;
          set((st) => {
            st.session = out.session;
            st.save.session = out.session;
            st.save.coins -= out.cost;
          });
          persist();
          if (out.solved) finish();
          return { cost: out.cost, opened: out.opened, completed: out.completed };
        },

        shuffle() {
          const { level, session } = get();
          if (!level || !session) return;
          const next = shuffleSession(session, rngFor(level));
          set((st) => {
            st.session = next;
            st.save.session = next;
          });
          persist();
        },

        async nextLevel() {
          await get().openLevel(get().save.currentLevel);
        },

        setSetting(key, value) {
          set((st) => {
            st.save.settings[key] = value;
          });
          persist();
        },
      };
    }),
  );
}

export type GameStore = ReturnType<typeof createGameStore>;
