import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sha256Hex } from '../utils/sha256';
import type { LevelManifest } from './level';
import { decodePack, levelFromPack, PackError } from './packs';

const DIR = join(__dirname, '..', '..', 'assets', 'levels');
const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as LevelManifest;
const pack1 = new Uint8Array(readFileSync(join(DIR, 'pack_0001.json.gz')));

describe('sha256', () => {
  it('matches node:crypto', () => {
    for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(200)]) {
      const bytes = new TextEncoder().encode(s);
      expect(sha256Hex(bytes)).toBe(createHash('sha256').update(bytes).digest('hex'));
    }
  });
});

describe('packs', () => {
  it('decodes and verifies pack 1', () => {
    const p = decodePack(pack1, manifest, 1);
    expect(p.levels).toHaveLength(50);
    expect(levelFromPack(p, 1).id).toBe(1);
    expect(() => levelFromPack(p, 51)).toThrow(PackError);
  });
  it('rejects tampered or unknown packs', () => {
    const bad = pack1.slice();
    bad[bad.length - 1] = (bad[bad.length - 1] as number) ^ 1;
    expect(() => decodePack(bad, manifest, 1)).toThrow(/checksum/);
    expect(() => decodePack(pack1, manifest, 2)).toThrow(/checksum/);
    expect(() => decodePack(pack1, manifest, 999)).toThrow(/manifest/);
  });
});
