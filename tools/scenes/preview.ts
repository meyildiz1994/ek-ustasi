/**
 * Writes tools/scenes/preview.html: every stop's scene, drawn as SVG by the same builder the app
 * renders with Skia (src/scenes/scene.ts). Run via `pnpm levelgen` (or `pnpm scenes`).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { sceneSvg } from '../../src/scenes/scene';
import { buildStops, type Stop } from '../levelgen/stops';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function previewHtml(stops: readonly Stop[]): string {
  const cards = stops
    .map(
      (s, i) =>
        `<figure>${sceneSvg(s, 270, 400, `s${i}`)}<figcaption><b>${s.index}. ${esc(s.name)}</b> <small>${s.id} · ${s.scene.time}</small><br>${esc(s.intro)}<br><small>${s.scene.layers.join(', ')}</small><br>${[...s.palette.sky, ...s.palette.ground, s.palette.accent].map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}</figcaption></figure>`,
    )
    .join('\n');
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Ek Ustası — durak sahneleri</title>
<style>body{font:13px/1.4 system-ui,sans-serif;background:#FFF4E0;color:#1E2A5A;margin:20px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
figure{margin:0;background:#fff;border-radius:10px;padding:6px;box-shadow:0 1px 3px #0002}svg{width:100%;height:auto;border-radius:6px;display:block}i{display:inline-block;width:14px;height:14px;margin:2px 2px 0 0;border-radius:3px}small{color:#6b6f86}</style></head>
<body><h1>Durak sahneleri (${stops.length})</h1><p>Uygulamadaki Skia sahneleriyle aynı şekil listesinden çizildi (src/scenes/scene.ts).</p>
<main>${cards}</main></body></html>
`;
}

export function writePreview(stops = buildStops()): void {
  writeFileSync(join(__dirname, 'preview.html'), previewHtml(stops));
}

if (require.main === module) writePreview();
