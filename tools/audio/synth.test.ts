import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildSounds, PENTATONIC, wav } from './synth';

const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const sounds = buildSounds();

describe('sound synthesiser', () => {
  it('builds every effect the app loads', () => {
    const src = readFileSync(join(__dirname, '../../src/services/sound.ts'), 'utf8');
    const used = [...src.matchAll(/assets\/sounds\/(\w+)\.wav/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(20);
    for (const name of used) expect(sounds[name as string], name).toBeDefined();
  });

  it('is deterministic and matches the committed files', () => {
    const again = buildSounds();
    for (const [name, s] of Object.entries(sounds)) {
      const bytes = wav(s.samples, s.sr, s.peak);
      const b = again[name]!;
      expect(sha(wav(b.samples, b.sr, b.peak))).toBe(sha(bytes));
      const file = readFileSync(join(__dirname, '../../assets/sounds', `${name}.wav`));
      expect(sha(file), `${name}.wav is stale: run pnpm sounds`).toBe(sha(bytes));
    }
  });

  it('writes valid, unclipped 16-bit mono WAVs', () => {
    for (const s of Object.values(sounds)) {
      const b = Buffer.from(wav(s.samples, s.sr, s.peak));
      expect(b.toString('ascii', 0, 4)).toBe('RIFF');
      expect(b.toString('ascii', 8, 12)).toBe('WAVE');
      expect(b.readUInt16LE(22)).toBe(1);
      expect(b.readUInt32LE(24)).toBe(s.sr);
      expect(b.readUInt16LE(34)).toBe(16);
      let peak = 0;
      for (let i = 44; i < b.length; i += 2) peak = Math.max(peak, Math.abs(b.readInt16LE(i)));
      expect(peak).toBeLessThan(32767);
      expect(peak).toBeGreaterThan(1000);
    }
  });

  it('ticks climb the pentatonic scale', () => {
    for (let i = 1; i < PENTATONIC.length; i++)
      expect(PENTATONIC[i]!).toBeGreaterThan(PENTATONIC[i - 1]!);
  });
});
