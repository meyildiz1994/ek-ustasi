/**
 * Packing (spec §9): 50 levels per gzip pack, SHA-256 of each pack in manifest.json.
 * fflate (pure JS) with a fixed header so the bytes are identical on every OS.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, strToU8 } from 'fflate';

import {
  LEVELS_PER_PACK,
  packFileName,
  type Level,
  type LevelManifest,
  type LevelPack,
} from '../../src/game/level';

export function encodePack(pack: LevelPack): Uint8Array {
  return gzipSync(strToU8(JSON.stringify(pack)), { level: 9, mtime: 0 });
}

export const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

export function buildPacks(levels: readonly Level[], seed: number) {
  const files: { file: string; bytes: Uint8Array }[] = [];
  const manifest: LevelManifest = {
    version: 1,
    seed,
    levelCount: levels.length,
    levelsPerPack: LEVELS_PER_PACK,
    packs: [],
  };
  for (let i = 0; i < levels.length; i += LEVELS_PER_PACK) {
    const chunk = levels.slice(i, i + LEVELS_PER_PACK);
    const pack = i / LEVELS_PER_PACK + 1;
    const bytes = encodePack({ version: 1, pack, levels: chunk });
    const file = packFileName(pack);
    files.push({ file, bytes });
    manifest.packs.push({
      file,
      first: (chunk[0] as Level).id,
      last: (chunk[chunk.length - 1] as Level).id,
      sha256: sha256(bytes),
      bytes: bytes.length,
    });
  }
  return { files, manifest };
}

export function writePacks(outDir: string, levels: readonly Level[], seed: number): LevelManifest {
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(outDir)) {
    if (/^pack_\d{4}\.json\.gz$/.test(f)) rmSync(join(outDir, f));
  }
  const { files, manifest } = buildPacks(levels, seed);
  for (const f of files) writeFileSync(join(outDir, f.file), f.bytes);
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
