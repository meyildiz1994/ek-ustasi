/**
 * Loads level packs bundled with the app (spec §9): only the pack that holds the requested level is
 * read and verified; decoded packs are cached in memory (a few at most).
 */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import manifestJson from '../../assets/levels/manifest.json';
import stopsJson from '../../assets/levels/stops.json';
import { packOf, type Level, type LevelManifest, type LevelPack } from '../game/level';
import { decodePack, levelFromPack } from '../game/packs';
import { PACK_ASSETS } from './pack-assets.generated';

export const manifest = manifestJson as LevelManifest;

export interface StopInfo {
  index: number;
  id: string;
  name: string;
  region: string;
  intro: string;
  firstLevel: number;
  lastLevel: number;
  palette: { sky: string[]; ground: string[]; accent: string };
}

export const stops = stopsJson as StopInfo[];

export const stopForLevel = (id: number): StopInfo =>
  stops[Math.min(stops.length - 1, Math.floor((id - 1) / manifest.levelsPerPack))] as StopInfo;

const CACHE_SIZE = 3;
const cache = new Map<number, LevelPack>();

/** Reads a bundled asset's bytes. Swappable in tests. */
export let readAsset = async (moduleId: number): Promise<Uint8Array> => {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') return new Uint8Array(await (await fetch(uri)).arrayBuffer());
  return new File(uri).bytes();
};

export function setAssetReader(reader: typeof readAsset): void {
  readAsset = reader;
  cache.clear();
}

export async function loadPack(pack: number): Promise<LevelPack> {
  const hit = cache.get(pack);
  if (hit) return hit;
  const moduleId = PACK_ASSETS[pack - 1];
  if (moduleId === undefined) throw new Error(`No bundled pack ${pack}`);
  const data = decodePack(await readAsset(moduleId), manifest, pack);
  cache.set(pack, data);
  while (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as number);
  return data;
}

export async function loadLevel(id: number): Promise<Level> {
  if (id < 1 || id > manifest.levelCount) throw new Error(`No level ${id}`);
  return levelFromPack(await loadPack(packOf(id)), id);
}
