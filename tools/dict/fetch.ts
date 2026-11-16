/**
 * Downloads the raw dictionary sources into tools/dict/sources/ and records their SHA-256.
 * Run once (`pnpm dict:fetch`); the sources are committed so `pnpm dict` is reproducible offline.
 *
 *  - Zemberek NLP lexicon files (Apache-2.0)            github.com/ahmetaa/zemberek-nlp
 *  - wordfreq 3.1.1 Turkish frequency list (CC BY-SA 4.0) pypi.org/project/wordfreq
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { unzipSync } from 'fflate';

const ROOT = join(__dirname, 'sources');
const ZEMBEREK_BASE =
  'https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/morphology/src/main/resources/tr/';
const ZEMBEREK_FILES = [
  'master-dictionary.dict',
  'non-tdk.dict',
  'proper.dict',
  'abbreviations.dict',
];
const ZEMBEREK_LICENSE = 'https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/LICENSE';
const WORDFREQ_WHEEL =
  'https://files.pythonhosted.org/packages/py3/w/wordfreq/wordfreq-3.1.1-py3-none-any.whl';

async function get(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

async function main() {
  const manifest: Record<string, { url: string; sha256: string }> = {};
  mkdirSync(join(ROOT, 'zemberek'), { recursive: true });
  mkdirSync(join(ROOT, 'wordfreq'), { recursive: true });

  for (const f of ZEMBEREK_FILES) {
    const url = ZEMBEREK_BASE + f;
    const data = await get(url);
    writeFileSync(join(ROOT, 'zemberek', f), data);
    manifest[`zemberek/${f}`] = { url, sha256: sha(data) };
  }
  const lic = await get(ZEMBEREK_LICENSE);
  writeFileSync(join(ROOT, 'zemberek', 'LICENSE'), lic);

  const wheel = await get(WORDFREQ_WHEEL);
  const files = unzipSync(wheel, {
    filter: (f) => f.name === 'wordfreq/data/small_tr.msgpack.gz' || f.name.endsWith('LICENSE.txt'),
  });
  for (const [name, data] of Object.entries(files)) {
    const out = name.endsWith('LICENSE.txt') ? 'LICENSE.txt' : 'small_tr.msgpack.gz';
    writeFileSync(join(ROOT, 'wordfreq', out), data);
    manifest[`wordfreq/${out}`] = { url: `${WORDFREQ_WHEEL}#${name}`, sha256: sha(data) };
  }

  manifest['fetchedAt'] = { url: new Date().toISOString().slice(0, 10), sha256: '' };
  writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('fetched', Object.keys(manifest).length - 1, 'files');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
