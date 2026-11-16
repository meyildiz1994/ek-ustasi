/**
 * Synthesises every sound effect and the ambient loop (spec §12) as WAV files in assets/sounds.
 * All sounds are generated here from sine/triangle partials and seeded noise, so they are original
 * and need no licence (LICENSES.md). Deterministic: `pnpm sounds` always writes the same bytes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createRng } from '../../src/utils/rng';

const SR = 44100;

/** C major pentatonic from C5 upward: the letter ticks climb this scale (spec §12). */
export const PENTATONIC = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
];

type Buf = Float32Array;
const len = (sec: number, sr = SR) => Math.round(sec * sr);

interface Voice {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  attack?: number;
  /** Exponential decay time constant in seconds (smaller = more percussive). */
  decay?: number;
  /** Relative amplitudes of harmonics 1, 2, 3… */
  partials?: number[];
  /** Pitch glide: frequency multiplier reached at the end of the note. */
  glide?: number;
}

function render(total: number, voices: Voice[], sr = SR): Buf {
  const out = new Float32Array(len(total, sr));
  for (const v of voices) {
    const n = len(v.dur, sr);
    const s0 = len(v.start, sr);
    const attack = Math.max(1, len(v.attack ?? 0.004, sr));
    const decay = v.decay ?? v.dur / 3;
    const partials = v.partials ?? [1];
    const gain = v.gain ?? 0.3;
    const glide = v.glide ?? 1;
    let phase = 0;
    for (let i = 0; i < n && s0 + i < out.length; i++) {
      const t = i / sr;
      const f = v.freq * glide ** (i / n);
      phase += (2 * Math.PI * f) / sr;
      const env =
        Math.min(1, i / attack) * Math.exp(-t / decay) * Math.min(1, (n - i) / (sr * 0.01));
      let s = 0;
      partials.forEach((a, k) => {
        s += a * Math.sin(phase * (k + 1));
      });
      out[s0 + i]! += s * env * gain;
    }
  }
  return out;
}

function noise(
  total: number,
  start: number,
  dur: number,
  gain: number,
  seed: number,
  decay = 0.02,
): Buf {
  const out = new Float32Array(len(total));
  const r = createRng(seed);
  const s0 = len(start);
  for (let i = 0; i < len(dur) && s0 + i < out.length; i++)
    out[s0 + i] = (r.next() * 2 - 1) * gain * Math.exp(-i / SR / decay);
  return out;
}

const mix = (...bufs: Buf[]): Buf => {
  const out = new Float32Array(Math.max(...bufs.map((b) => b.length)));
  for (const b of bufs) b.forEach((v, i) => (out[i]! += v));
  return out;
};

/** 16-bit PCM mono WAV, peak-normalised to `peak`. */
export function wav(samples: Buf, sr = SR, peak = 0.85): Uint8Array {
  let max = 0;
  for (const v of samples) max = Math.max(max, Math.abs(v));
  const k = max > 0 ? peak / max : 1;
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o: number, s: string) =>
    [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  data.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, 1, true);
  data.setUint32(24, sr, true);
  data.setUint32(28, sr * 2, true);
  data.setUint16(32, 2, true);
  data.setUint16(34, 16, true);
  str(36, 'data');
  data.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) =>
    data.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, v * k)) * 32767), true),
  );
  return new Uint8Array(data.buffer);
}

const MARIMBA = [1, 0, 0.25, 0, 0.08];
const BELL = [1, 0.4, 0.25, 0.15, 0.1, 0.05];

/** name → samples (+ sample rate). */
export function buildSounds(): Record<string, { samples: Buf; sr: number; peak: number }> {
  const out: Record<string, { samples: Buf; sr: number; peak: number }> = {};
  const add = (name: string, samples: Buf, peak = 0.8, sr = SR) =>
    (out[name] = { samples, sr, peak });

  // Letter ticks, one per wheel step (pentatonic, rising).
  PENTATONIC.forEach((f, i) =>
    add(
      `tick_${i}`,
      render(0.16, [{ freq: f, start: 0, dur: 0.16, decay: 0.05, partials: MARIMBA }]),
      0.55,
    ),
  );
  // Correct word: bright major arpeggio ending in a chord.
  const C = [523.25, 659.25, 783.99, 1046.5];
  add(
    'word',
    render(0.7, [
      ...C.map((f, i) => ({
        freq: f,
        start: i * 0.06,
        dur: 0.6 - i * 0.06,
        decay: 0.25,
        partials: MARIMBA,
        gain: 0.22,
      })),
    ]),
  );
  // Error "bonk": low, short, falling.
  add(
    'bonk',
    mix(
      render(0.22, [
        {
          freq: 150,
          start: 0,
          dur: 0.22,
          decay: 0.07,
          partials: [1, 0.5, 0.2],
          glide: 0.6,
          gain: 0.5,
        },
      ]),
      noise(0.22, 0, 0.03, 0.15, 7, 0.008),
    ),
    0.7,
  );
  // Already found: soft double tap.
  add(
    'already',
    render(0.25, [
      { freq: 659.25, start: 0, dur: 0.1, decay: 0.04, partials: MARIMBA },
      { freq: 659.25, start: 0.11, dur: 0.12, decay: 0.04, partials: MARIMBA },
    ]),
    0.45,
  );
  // Bonus word: sparkle.
  add(
    'bonus',
    render(
      0.6,
      [1318.51, 1567.98, 2093, 2637].map((f, i) => ({
        freq: f,
        start: i * 0.05,
        dur: 0.45,
        decay: 0.15,
        partials: BELL,
        gain: 0.18,
      })),
    ),
    0.6,
  );
  // Coin.
  add(
    'coin',
    render(0.35, [
      { freq: 1975.53, start: 0, dur: 0.1, decay: 0.05, partials: BELL, gain: 0.25 },
      { freq: 2637.02, start: 0.07, dur: 0.28, decay: 0.12, partials: BELL, gain: 0.25 },
    ]),
    0.5,
  );
  // Star landing on the level-end card.
  add(
    'star',
    render(0.5, [{ freq: 1046.5, start: 0, dur: 0.5, decay: 0.18, partials: BELL }]),
    0.55,
  );
  // Level end fanfare.
  add(
    'levelEnd',
    render(1.6, [
      { freq: 523.25, start: 0, dur: 0.18, decay: 0.1, partials: MARIMBA, gain: 0.3 },
      { freq: 659.25, start: 0.14, dur: 0.18, decay: 0.1, partials: MARIMBA, gain: 0.3 },
      { freq: 783.99, start: 0.28, dur: 0.18, decay: 0.1, partials: MARIMBA, gain: 0.3 },
      ...[523.25, 659.25, 783.99, 1046.5].map((f) => ({
        freq: f,
        start: 0.44,
        dur: 1.1,
        decay: 0.5,
        attack: 0.01,
        partials: [1, 0.3, 0.1],
        gain: 0.18,
      })),
    ]),
  );
  // Ek Turu: each correct suffix "clicks" in, a little higher each step.
  PENTATONIC.slice(0, 8).forEach((f, i) =>
    add(
      `ek_${i}`,
      mix(
        render(0.4, [
          {
            freq: f / 2,
            start: 0,
            dur: 0.35,
            decay: 0.12,
            partials: [1, 0.6, 0.3, 0.15],
            gain: 0.35,
          },
          { freq: f, start: 0.03, dur: 0.35, decay: 0.15, partials: BELL, gain: 0.2 },
        ]),
        noise(0.4, 0, 0.02, 0.2, 11 + i, 0.004),
      ),
      0.7,
    ),
  );
  // Ek Turu chain breaks: two falling notes.
  add(
    'ekBreak',
    render(0.6, [
      { freq: 392, start: 0, dur: 0.25, decay: 0.1, partials: [1, 0.5, 0.25], gain: 0.35 },
      {
        freq: 277.18,
        start: 0.18,
        dur: 0.4,
        decay: 0.15,
        partials: [1, 0.5, 0.25],
        gain: 0.35,
        glide: 0.9,
      },
    ]),
    0.7,
  );
  // Topla: coins cascade.
  add(
    'collect',
    render(
      0.9,
      [1567.98, 1760, 2093, 2349.32, 2637.02].map((f, i) => ({
        freq: f,
        start: i * 0.07,
        dur: 0.4,
        decay: 0.12,
        partials: BELL,
        gain: 0.2,
      })),
    ),
    0.6,
  );
  // UI tap.
  add(
    'tap',
    render(0.06, [{ freq: 880, start: 0, dur: 0.06, decay: 0.015, partials: [1, 0.3] }]),
    0.35,
  );

  // Ambient loop: 32 s at 22.05 kHz, soft pads (Am – F – C – G) and a slow pentatonic melody.
  const MSR = 22050;
  const bar = 4;
  const chords = [
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [196, 261.63, 329.63],
    [196, 246.94, 293.66],
  ];
  const voices: Voice[] = [];
  for (let b = 0; b < 8; b++) {
    for (const f of chords[b % 4]!)
      voices.push({
        freq: f,
        start: b * bar,
        dur: bar + 0.6,
        attack: 0.9,
        decay: 6,
        partials: [1, 0.2, 0.05],
        gain: 0.07,
      });
  }
  const r = createRng(2026);
  const MEL = [440, 523.25, 587.33, 659.25, 783.99, 880];
  for (let beat = 0; beat < 31; beat += r.int(2) + 1) {
    voices.push({
      freq: r.pick(MEL),
      start: beat + 0.5,
      dur: 1.4,
      decay: 0.45,
      partials: MARIMBA,
      gain: 0.08,
    });
  }
  const music = render(32, voices, MSR);
  // Cross-fade the tail into the head so the loop is seamless.
  const fade = len(0.6, MSR);
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    music[i] = music[i]! * a + music[music.length - fade + i]! * (1 - a);
  }
  add('music', music.slice(0, music.length - fade), 0.5, MSR);
  return out;
}

export function writeSounds(dir = join(__dirname, '..', '..', 'assets', 'sounds')): string[] {
  mkdirSync(dir, { recursive: true });
  const sounds = buildSounds();
  for (const [name, s] of Object.entries(sounds))
    writeFileSync(join(dir, `${name}.wav`), wav(s.samples, s.sr, s.peak));
  return Object.keys(sounds);
}

if (require.main === module) console.log(writeSounds().join(' '));
