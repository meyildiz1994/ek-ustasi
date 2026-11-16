/** report.html and review.html (spec §8.9). Self-contained static pages, inline SVG, no scripts. */
import type { Level } from '../../src/game/level';
import { trCompare, trUpper } from '../../src/utils/tr';
import { TIERS } from './curve';
import { renderGrid } from './grid';
import type { Rng } from './prng';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAGE = (title: string, body: string) => `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#1E2A5A;background:#FFF4E0}
h1,h2{margin:.6em 0 .3em} table{border-collapse:collapse} td,th{padding:3px 8px;border-bottom:1px solid #e5d8bf;text-align:left}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{background:#fff;border-radius:10px;padding:10px;box-shadow:0 1px 3px #0002}
.grid{display:inline-grid;gap:2px;margin:6px 0}.cell{width:18px;height:18px;font:600 11px/18px system-ui;text-align:center;border-radius:3px}
.on{background:#1FA6A0;color:#fff}.off{background:transparent}.muted{color:#6b6f86}.ek{color:#C8323C}
svg text{font:11px system-ui;fill:#1E2A5A}
</style></head><body>${body}</body></html>
`;

function lineChart(levels: readonly Level[], targets: readonly number[]): string {
  const W = 1000;
  const Hh = 320;
  const n = levels.length;
  const x = (i: number) => 40 + (i / Math.max(1, n - 1)) * (W - 60);
  const y = (d: number) => Hh - 30 - (d / 100) * (Hh - 50);
  const bands = TIERS.filter((t) => t.from <= n)
    .map((t) => {
      const x1 = x(t.from - 1);
      const x2 = x(Math.min(n, t.to) - 1);
      return `<rect x="${x1.toFixed(1)}" y="${y(t.band[1]).toFixed(1)}" width="${Math.max(1, x2 - x1).toFixed(1)}" height="${(y(t.band[0]) - y(t.band[1])).toFixed(1)}" fill="#1FA6A0" opacity=".12"/>`;
    })
    .join('');
  const pts = levels.map((l, i) => `${x(i).toFixed(1)},${y(l.difficulty).toFixed(1)}`).join(' ');
  const tpts = targets.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');
  const axis = [0, 25, 50, 75, 100]
    .map(
      (v) =>
        `<text x="4" y="${y(v) + 4}">${v}</text><line x1="36" x2="${W - 20}" y1="${y(v)}" y2="${y(v)}" stroke="#0001"/>`,
    )
    .join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%">${axis}${bands}
<polyline points="${tpts}" fill="none" stroke="#F2A93B" stroke-width="1.5"/>
<polyline points="${pts}" fill="none" stroke="#2753A6" stroke-width="1" opacity=".8"/>
<text x="${W - 260}" y="16" style="fill:#2753A6">— gerçek zorluk</text><text x="${W - 140}" y="16" style="fill:#F2A93B">— hedef</text></svg>`;
}

function bars(data: [string, number][], height = 220): string {
  const W = 1000;
  const max = Math.max(1, ...data.map((d) => d[1]));
  const bw = (W - 60) / Math.max(1, data.length);
  const rects = data
    .map(([label, v], i) => {
      const h = (v / max) * (height - 40);
      const xx = 40 + i * bw;
      return (
        `<rect x="${xx.toFixed(1)}" y="${(height - 20 - h).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="#2753A6"><title>${esc(label)}: ${v}</title></rect>` +
        (data.length <= 40
          ? `<text x="${(xx + bw / 2 - 4).toFixed(1)}" y="${height - 6}">${esc(label)}</text>`
          : '')
      );
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${height}" width="100%"><text x="4" y="14">${max}</text>${rects}</svg>`;
}

export interface ReportInput {
  levels: readonly Level[];
  targets: readonly number[];
  rejections: Record<string, number>;
  seed: number;
  elapsedSec: number;
  failures: number;
}

export function reportHtml(r: ReportInput): string {
  const uses = new Map<string, number>();
  const letters = new Map<string, number>();
  for (const l of r.levels) {
    for (const p of l.words) uses.set(p.w, (uses.get(p.w) ?? 0) + 1);
    for (const ch of l.letters) letters.set(ch, (letters.get(ch) ?? 0) + 1);
  }
  const hist = new Map<number, number>();
  for (const n of uses.values()) hist.set(n, (hist.get(n) ?? 0) + 1);
  const histData = [...hist.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, v]) => [`${k}×`, v] as [string, number]);
  const letterData = [...letters.entries()]
    .sort((a, b) => trCompare(a[0], b[0]))
    .map(([k, v]) => [trUpper(k), v] as [string, number]);
  const tierRows = TIERS.filter((t) => t.from <= r.levels.length)
    .map((t) => {
      const ls = r.levels.filter((l) => l.id >= t.from && l.id <= t.to);
      const ds = ls.map((l) => l.difficulty);
      const avg = (a: number[]) =>
        (a.reduce((s, v) => s + v, 0) / Math.max(1, a.length)).toFixed(1);
      return `<tr><td>${t.from}–${t.to}</td><td>${t.band.join('–')}</td><td>${Math.min(...ds)}</td><td>${avg(ds)}</td><td>${Math.max(...ds)}</td><td>${avg(ls.map((l) => l.words.length))}</td><td>${avg(ls.map((l) => l.bonus.length))}</td></tr>`;
    })
    .join('');
  const top = [...uses.entries()].sort((a, b) => b[1] - a[1] || trCompare(a[0], b[0])).slice(0, 30);
  const rej = Object.entries(r.rejections)
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`)
    .join('');
  return PAGE(
    'Ek Ustası — bölüm raporu',
    `<h1>Bölüm raporu</h1>
<p>${r.levels.length} bölüm · seed ${r.seed} · ${r.elapsedSec.toFixed(0)} sn · doğrulama hatası: <b>${r.failures}</b> · farklı hedef kelime: ${uses.size}</p>
<h2>Zorluk eğrisi</h2>${lineChart(r.levels, r.targets)}
<table><tr><th>Aralık</th><th>Bant</th><th>Min</th><th>Ort.</th><th>Maks</th><th>Ort. kelime</th><th>Ort. bonus</th></tr>${tierRows}</table>
<h2>Kelime tekrar histogramı</h2><p class="muted">Bir hedef kelime kaç bölümde geçiyor (üst sınır 12; 3–4 harfli kelimelerde 24, D-019).</p>${bars(histData)}
<p class="muted">En sık: ${top.map(([w, n]) => `${esc(w)} ${n}`).join(', ')}</p>
<h2>Harf frekansı (çark)</h2>${bars(letterData)}
<h2>Reddedilen adaylar</h2><p class="muted">Üretim sırasında elenen ana kelime denemeleri (bölüm atılmadı; yerine başka aday seçildi).</p>
<table><tr><th>Neden</th><th>Sayı</th></tr>${rej}</table>`,
  );
}

function gridHtml(l: Level): string {
  const g = renderGrid(l.words);
  const cols = g[0]?.length ?? 0;
  const cells = g
    .flatMap((row) =>
      [...row].map((ch) =>
        ch === '.'
          ? '<div class="cell off"></div>'
          : `<div class="cell on">${esc(trUpper(ch))}</div>`,
      ),
    )
    .join('');
  return `<div class="grid" style="grid-template-columns:repeat(${cols},18px)">${cells}</div>`;
}

export function reviewHtml(levels: readonly Level[], rng: Rng, sample = 200): string {
  const picked = rng
    .shuffle(levels)
    .slice(0, Math.min(sample, levels.length))
    .sort((a, b) => a.id - b.id);
  const cards = picked
    .map((l) => {
      const ek = l.ekTuru
        ? `<div class="ek">Ek Turu${l.ekTuru.big ? ' (büyük)' : ''}: ${esc(l.ekTuru.root)} + ${esc(l.ekTuru.bestChain.join(' + '))} · hedef ${l.ekTuru.targetScore}<br>kartlar: ${l.ekTuru.cards.map((c) => esc(c.form)).join(', ')}</div>`
        : '';
      return `<div class="card"><b>#${l.id}</b> <span class="muted">${esc(l.stopId)} · zorluk ${l.difficulty}</span><br>
çark: <b>${esc(trUpper(l.letters.join(' ')))}</b><br>${gridHtml(l)}<br>
<span>${l.words.map((p) => esc(p.w)).join(', ')}</span><br><span class="muted">bonus (${l.bonus.length}): ${esc(l.bonus.slice(0, 20).join(', '))}${l.bonus.length > 20 ? '…' : ''}</span>${ek}</div>`;
    })
    .join('\n');
  return PAGE(
    'Ek Ustası — bölüm gözden geçirme',
    `<h1>Gözden geçirme: ${picked.length} rastgele bölüm</h1><p class="muted">Garip kelime, kötü ızgara ya da yanlış Ek Turu görürsen bölüm numarasıyla yaz.</p><div class="cards">${cards}</div>`,
  );
}
