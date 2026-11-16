/**
 * pnpm levelgen --count 5000 --seed 20261116 --out assets/levels   (spec §8.1)
 * Writes the packs + manifest, stops.json, and tools/levelgen/{report,review}.html.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { loadDictionary } from './data';
import { generateLevels } from './generate';
import { writePacks } from './pack';
import { createRng, hashSeed } from './prng';
import { reportHtml, reviewHtml } from './report';
import { writePreview } from '../scenes/preview';
import { buildStops } from './stops';
import { validateLevel, validateRepetition } from './validate';

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '5000' },
    seed: { type: 'string', default: '20261116' },
    out: { type: 'string', default: 'assets/levels' },
  },
});
const count = Number(values.count);
const seed = Number(values.seed);
const out = resolve(values.out);

const t0 = Date.now();
const dict = loadDictionary();
const result = generateLevels(dict, {
  count,
  seed,
  onProgress: (id) => {
    if (id % 250 === 0)
      console.log(`  ${id}/${count} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  },
});
const failures = [
  ...result.levels.flatMap((l) => validateLevel(l, dict)),
  ...validateRepetition(result.levels),
];
const elapsedSec = (Date.now() - t0) / 1000;

mkdirSync(out, { recursive: true });
const manifest = writePacks(out, result.levels, seed);
const stops = buildStops();
writeFileSync(join(out, 'stops.json'), JSON.stringify(stops, null, 2) + '\n');
writePreview(stops);
const here = __dirname;
writeFileSync(
  join(here, 'report.html'),
  reportHtml({ ...result, seed, elapsedSec, failures: failures.length }),
);
writeFileSync(
  join(here, 'review.html'),
  reviewHtml(result.levels, createRng(hashSeed(seed, 'review'))),
);

console.log(
  `${result.levels.length} levels, ${manifest.packs.length} packs, ${failures.length} validation failures, ${elapsedSec.toFixed(0)} s`,
);
if (failures.length > 0) {
  for (const f of failures.slice(0, 30)) console.error(`  #${f.level} ${f.check}: ${f.detail}`);
  process.exitCode = 1;
}
