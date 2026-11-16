/**
 * Save data (spec §14): versioned schema with migrations. Storage itself is behind SaveProvider so
 * cloud saves (iCloud / Play Games) can be added later without touching the game.
 */
import type { Session } from '../game/session';
import { COINS } from '../game/scoring';

export const SAVE_VERSION = 1;

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  colorBlind: boolean;
  largeText: boolean;
  ekTuruExplanations: boolean;
  analytics: boolean;
}

export interface SaveData {
  saveVersion: typeof SAVE_VERSION;
  /** Next level to play (1-based). */
  currentLevel: number;
  /** Best stars per completed level id. */
  stars: Record<number, 1 | 2 | 3>;
  coins: number;
  /** Lifetime bonus words (every 10 → coins). */
  bonusCounter: number;
  /** Half-finished level, restored on launch. */
  session: Session | null;
  /** Level whose Ek Turu is owed (level solved, round not finished) — reopened on launch. */
  pendingEkTuru: number | null;
  /** Ek Turu tutorial cards already shown (spec §5.4). */
  tipsSeen: string[];
  settings: Settings;
}

export const defaultSettings = (): Settings => ({
  sound: true,
  music: true,
  haptics: true,
  colorBlind: false,
  largeText: false,
  ekTuruExplanations: true,
  analytics: true,
});

export const defaultSave = (): SaveData => ({
  saveVersion: SAVE_VERSION,
  currentLevel: 1,
  stars: {},
  coins: COINS.start,
  bonusCounter: 0,
  session: null,
  pendingEkTuru: null,
  tipsSeen: [],
  settings: defaultSettings(),
});

/** Brings any stored object up to the current schema. Unknown / broken data → fresh save. */
export function migrate(raw: unknown): SaveData {
  if (raw === null || typeof raw !== 'object') return defaultSave();
  const r = raw as Partial<SaveData> & { saveVersion?: number };
  if (r.saveVersion !== SAVE_VERSION) return defaultSave(); // v1 is the first schema
  const base = defaultSave();
  return {
    ...base,
    ...r,
    saveVersion: SAVE_VERSION,
    settings: { ...base.settings, ...(r.settings ?? {}) },
  };
}

export interface SaveProvider {
  load(): string | undefined;
  save(json: string): void;
}

export const memorySaveProvider = (initial?: string): SaveProvider => {
  let data = initial;
  return {
    load: () => data,
    save: (json) => {
      data = json;
    },
  };
};

export function readSave(p: SaveProvider): SaveData {
  const json = p.load();
  if (json === undefined) return defaultSave();
  try {
    return migrate(JSON.parse(json));
  } catch {
    return defaultSave();
  }
}

export const writeSave = (p: SaveProvider, data: SaveData): void => p.save(JSON.stringify(data));
