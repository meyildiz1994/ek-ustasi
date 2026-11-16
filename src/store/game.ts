/**
 * Game store (zustand + immer). Created with injected dependencies so tests run without native
 * modules; src/store/index.ts wires the real ones.
 */
import { castDraft } from 'immer';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';

import {
  applyCards,
  collect,
  ekReward,
  hintCard,
  newEkSession,
  type EkSession,
  type EkTip,
} from '../game/ekturu';
import {
  PRODUCTS,
  REWARDED,
  type ProductConfig,
  type ProductKey,
  type RewardPlacement,
} from '../../config/monetization';
import {
  claimDaily,
  dailyOffer,
  localDay,
  quotaLeft,
  spendQuota,
  type DailyOffer,
} from '../game/daily';
import type { CellKey } from '../game/grid';
import { HINT_COST } from '../game/hints';
import { isStopFinale } from '../game/stops';
import type { Level } from '../game/level';
import type { Engine } from '../morph/engine';
import { bonusCoins, levelEndCoins } from '../game/scoring';
import {
  newSession,
  sessionStars,
  shuffleSession,
  submitWord,
  applyHint,
  type HintRequest,
  type Session,
  type SubmitOutcome,
} from '../game/session';
import { createRng, hashSeed } from '../utils/rng';
import { readSave, writeSave, type SaveData, type SaveProvider, type Settings } from './save';

export interface GameDeps {
  provider: SaveProvider;
  loadLevel: (id: number) => Promise<Level>;
  engine: Engine;
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
  /** Ek Turu round in progress (after the level's result card). */
  ek: EkSession | null;
  /** Coins paid out when the Ek Turu round ended; null while playing. */
  ekPaid: number | null;
  /** Tutorial card to show now (spec §5.4). */
  tip: EkTip | null;
  /** Stop id whose postcard was just won; shown before the next level. */
  newPostcard: string | null;

  openLevel(id?: number): Promise<void>;
  submit(word: string): SubmitOutcome | null;
  hint(req: HintRequest): { cost: number; opened: CellKey[]; completed: string[] } | null;
  shuffle(): void;
  nextLevel(): Promise<void>;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;

  startEkTuru(): void;
  /** Applies wheel cards in order; returns how many stuck and whether the chain broke. */
  ekApply(indices: number[]): { added: number; failed: boolean } | null;
  /** Ek hint (40 coins): highlights a card that continues the word. false if unaffordable/none. */
  ekHint(): boolean;
  ekCollect(): void;
  dismissTip(): void;
  dismissPostcard(): void;

  /** Today's login reward if not yet claimed. */
  dailyOffer(): DailyOffer | null;
  /** Claims today's login reward; returns the coins paid, or null if already claimed. */
  claimDaily(): number | null;
  /** Rewarded ads left today (Infinity with the no-ads pack, which pays without an ad). */
  rewardsLeft(): number;
  /**
   * Pays a rewarded placement after the ad finished (or straight away with the no-ads pack).
   * 'coins' adds REWARDED.coins; 'freeHint' opens a letter like the 💡 hint, for free.
   * Returns false when today's limit is reached or a free hint has nothing to open.
   */
  grantReward(placement: RewardPlacement): boolean;
  /** Pays a verified store purchase once per transaction id. */
  grantPurchase(product: ProductKey, transactionId: string): boolean;
  /** Sets the no-ads flag from the store's entitlements (purchase or restore). */
  setNoAds(owned: boolean): void;
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
          if (level.ekTuru) st.save.pendingEkTuru = level.id;
          if (isStopFinale(level.id) && !st.save.postcards.includes(level.stopId)) {
            st.save.postcards.push(level.stopId);
            st.newPostcard = level.stopId;
          }
        });
        persist();
      };

      const queueTips = (tips: readonly EkTip[]) => {
        const { save, tip } = get();
        if (!save.settings.ekTuruExplanations || tip) return;
        const next = tips.find((t) => !save.tipsSeen.includes(t));
        if (next) set((st) => void (st.tip = next));
      };

      /** Ends the round: pays out once and clears the pending flag. */
      const payEk = () => {
        const { ek } = get();
        if (!ek || ek.status === 'playing' || get().ekPaid !== null) return;
        const coins = ekReward(ek);
        set((st) => {
          st.ekPaid = coins;
          st.save.coins += coins;
          st.save.pendingEkTuru = null;
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
        ek: null,
        ekPaid: null,
        tip: null,
        newPostcard: null,

        async openLevel(id) {
          const pending = get().save.pendingEkTuru;
          const target = id ?? pending ?? get().save.currentLevel;
          set((st) => {
            st.loading = true;
            st.error = null;
          });
          try {
            const level = await deps.loadLevel(target);
            if (pending === level.id && level.ekTuru) {
              // Level already solved; only its Ek Turu round is owed.
              const done = newSession(level);
              set((st) => {
                st.level = level;
                st.session = {
                  ...done,
                  progress: { found: level.words.map((w) => w.w), revealed: [] },
                };
                st.result = null;
                st.loading = false;
                st.ekPaid = null;
              });
              get().startEkTuru();
              return;
            }
            const saved = get().save.session;
            const session = saved && saved.levelId === level.id ? saved : newSession(level);
            set((st) => {
              st.level = level;
              st.session = session;
              st.result = null;
              st.ek = null;
              st.ekPaid = null;
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
          const out = applyHint(level, session, req, save.coins, rngFor(level));
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
          set((st) => {
            st.ek = null;
            st.ekPaid = null;
          });
          await get().openLevel(get().save.currentLevel);
        },

        startEkTuru() {
          const { level } = get();
          if (!level?.ekTuru) return;
          const ek = newEkSession(deps.engine, level.id, level.ekTuru);
          set((st) => {
            st.ek = castDraft(ek);
            st.ekPaid = null;
            st.result = null;
          });
          queueTips(['intro']);
        },

        ekApply(indices) {
          const { ek } = get();
          if (!ek) return null;
          const out = applyCards(deps.engine, ek, indices);
          set((st) => void (st.ek = castDraft(out.session)));
          queueTips(out.tips);
          if (out.failed) payEk();
          return { added: out.added, failed: out.failed };
        },

        ekHint() {
          const { ek, save } = get();
          if (!ek || save.coins < HINT_COST.suffix) return false;
          const i = hintCard(deps.engine, ek);
          if (i === null) return false;
          set((st) => {
            if (st.ek) st.ek.hinted = i;
            st.save.coins -= HINT_COST.suffix;
          });
          persist();
          return true;
        },

        ekCollect() {
          const { ek } = get();
          if (!ek) return;
          set((st) => void (st.ek = castDraft(collect(ek))));
          payEk();
        },

        dismissTip() {
          const { tip } = get();
          if (!tip) return;
          set((st) => {
            st.tip = null;
            if (!st.save.tipsSeen.includes(tip)) st.save.tipsSeen.push(tip);
          });
          persist();
        },

        dismissPostcard() {
          set((st) => void (st.newPostcard = null));
        },

        dailyOffer() {
          return dailyOffer(get().save.daily, localDay(now()));
        },

        claimDaily() {
          const out = claimDaily(get().save.daily, localDay(now()));
          if (!out) return null;
          set((st) => {
            st.save.daily = out.state;
            st.save.coins += out.coins;
          });
          persist();
          return out.coins;
        },

        rewardsLeft() {
          const { save } = get();
          if (save.noAds) return Infinity;
          return quotaLeft(save.adQuota, localDay(now()), REWARDED.dailyLimit);
        },

        grantReward(placement) {
          if (get().rewardsLeft() <= 0) return false;
          const today = localDay(now());
          if (placement === 'freeHint') {
            const { level, session } = get();
            if (!level || !session) return false;
            // Paid as if the player had the coins; nothing is deducted.
            const out = applyHint(level, session, { kind: 'letter' }, Infinity, rngFor(level));
            if (!out) return false;
            set((st) => {
              st.session = out.session;
              st.save.session = out.session;
              if (!st.save.noAds) st.save.adQuota = spendQuota(st.save.adQuota, today);
            });
            persist();
            if (out.solved) finish();
            return true;
          }
          set((st) => {
            st.save.coins += REWARDED.coins;
            if (!st.save.noAds) st.save.adQuota = spendQuota(st.save.adQuota, today);
          });
          persist();
          return true;
        },

        grantPurchase(product, transactionId) {
          if (get().save.grantedTransactions.includes(transactionId)) return false;
          const p: ProductConfig = PRODUCTS[product];
          set((st) => {
            st.save.grantedTransactions.push(transactionId);
            st.save.coins += p.coins ?? 0;
            if (product === 'noAds') st.save.noAds = true;
          });
          persist();
          return true;
        },

        setNoAds(owned) {
          if (get().save.noAds === owned) return;
          set((st) => void (st.save.noAds = owned));
          persist();
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
