/**
 * Level pack decoding and verification (spec §9). Platform-free: the app reads the bytes (see
 * services/levels.ts), this module checks the SHA-256 from manifest.json and parses the pack.
 */
import { gunzipSync, strFromU8 } from 'fflate';

import { sha256Hex } from '../utils/sha256';
import type { Level, LevelManifest, LevelPack } from './level';

export class PackError extends Error {}

export function decodePack(bytes: Uint8Array, manifest: LevelManifest, pack: number): LevelPack {
  const entry = manifest.packs[pack - 1];
  if (!entry) throw new PackError(`Pack ${pack} is not in the manifest`);
  if (sha256Hex(bytes) !== entry.sha256) throw new PackError(`Pack ${pack} failed its checksum`);
  const data = JSON.parse(strFromU8(gunzipSync(bytes))) as LevelPack;
  if (data.version !== 1 || data.pack !== pack || data.levels.length === 0) {
    throw new PackError(`Pack ${pack} has an unexpected format`);
  }
  return data;
}

export function levelFromPack(pack: LevelPack, id: number): Level {
  const level = pack.levels.find((l) => l.id === id);
  if (!level) throw new PackError(`Level ${id} is not in pack ${pack.pack}`);
  return level;
}
