/**
 * stops.json (spec §10): 100 stops with id, Turkish name, intro, palette (4 sky + 3 ground + 1
 * accent) and a procedural scene recipe. Palettes derive from a per-region base, shifted by the time
 * of day and nudged per stop so neighbours differ.
 */
import { LEVELS_PER_PACK } from '../../src/game/level';
import { trUpper } from '../../src/utils/tr';
import { hashSeed } from './prng';
import { STOP_CONTENT, type Layer, type TimeOfDay } from './stops-content';
import { STOP_SEEDS, stopIdOf, type Region } from './stops-list';

export interface Stop {
  index: number;
  id: string;
  name: string;
  region: Region;
  intro: string;
  firstLevel: number;
  lastLevel: number;
  palette: {
    sky: [string, string, string, string];
    ground: [string, string, string];
    accent: string;
  };
  scene: { layers: Layer[]; time: TimeOfDay; seed: number };
}

type Hsl = [number, number, number];

const SKY: Record<TimeOfDay, Hsl[]> = {
  dawn: [
    [215, 45, 38],
    [255, 30, 62],
    [340, 55, 78],
    [30, 85, 82],
  ],
  day: [
    [205, 70, 48],
    [200, 70, 62],
    [195, 65, 76],
    [45, 70, 88],
  ],
  sunset: [
    [235, 45, 30],
    [300, 35, 45],
    [10, 70, 60],
    [38, 90, 66],
  ],
  night: [
    [232, 50, 12],
    [228, 45, 20],
    [222, 40, 30],
    [210, 35, 42],
  ],
};

/** Ground hues per region (land, mid, near). */
const GROUND: Record<Region, Hsl[]> = {
  marmara: [
    [150, 30, 42],
    [140, 35, 32],
    [130, 30, 22],
  ],
  ege: [
    [80, 30, 52],
    [70, 35, 40],
    [60, 30, 30],
  ],
  akdeniz: [
    [30, 45, 55],
    [20, 45, 42],
    [15, 40, 30],
  ],
  icAnadolu: [
    [38, 50, 62],
    [32, 45, 48],
    [25, 40, 36],
  ],
  karadeniz: [
    [140, 45, 36],
    [135, 50, 26],
    [130, 45, 18],
  ],
  doguAnadolu: [
    [200, 12, 78],
    [210, 15, 58],
    [215, 18, 40],
  ],
  guneydogu: [
    [32, 55, 58],
    [25, 50, 45],
    [18, 45, 32],
  ],
  dunya: [
    [260, 20, 50],
    [250, 25, 38],
    [240, 25, 26],
  ],
};

const ACCENT: Record<Region, Hsl> = {
  marmara: [205, 70, 45],
  ege: [190, 75, 45],
  akdeniz: [15, 75, 55],
  icAnadolu: [5, 65, 50],
  karadeniz: [160, 60, 40],
  doguAnadolu: [210, 70, 55],
  guneydogu: [35, 85, 55],
  dunya: [280, 50, 55],
};

function hex([h, s, l]: Hsl): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.min(100, Math.max(0, s)) / 100;
  const ll = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .replace(/[a-f]/g, (ch) => trUpper(ch))
  );
}

const nudge = ([h, s, l]: Hsl, seed: number, i: number): Hsl => {
  const r = hashSeed(seed, i);
  return [h + ((r % 17) - 8), s + (((r >>> 8) % 11) - 5), l + (((r >>> 16) % 7) - 3)];
};

export function buildStops(): Stop[] {
  return STOP_SEEDS.map((s, i) => {
    const content = STOP_CONTENT[s.code];
    if (!content) throw new Error(`No content for stop ${s.code} ${s.name}`);
    const seed = hashSeed('stop', s.code);
    const sky = SKY[content.time].map((c, j) => hex(nudge(c, seed, j)));
    const ground = GROUND[s.region].map((c, j) => hex(nudge(c, seed, 10 + j)));
    const layers =
      content.time === 'night' && !content.layers.includes('stars')
        ? [...content.layers, 'stars' as const, 'moon' as const]
        : content.layers;
    return {
      index: i + 1,
      id: stopIdOf(s),
      name: s.name,
      region: s.region,
      intro: content.intro,
      firstLevel: i * LEVELS_PER_PACK + 1,
      lastLevel: (i + 1) * LEVELS_PER_PACK,
      palette: {
        sky: sky as Stop['palette']['sky'],
        ground: ground as Stop['palette']['ground'],
        accent: hex(nudge(ACCENT[s.region], seed, 20)),
      },
      scene: { layers, time: content.time, seed },
    };
  });
}
