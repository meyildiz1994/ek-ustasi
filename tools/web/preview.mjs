/**
 * Builds a browser preview that runs from any URL path (e.g. a static host that serves the app
 * under /some/prefix/), with purchases and ads simulated by the *.web.ts services.
 *
 *   pnpm preview:web   →  dist-preview/
 *
 * Steps: export with a placeholder base path, then make the base a runtime value
 * (window.__EKBASE__, worked out from location.pathname), drop content hashes and `_` prefixes
 * from file names, and ship level packs as JSON ({"gz": base64}) decoded by a small fetch shim,
 * so the output only uses common static file types.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'dist-preview');
const PH = '/__EKBASE__';

fs.rmSync(OUT, { recursive: true, force: true });
execSync(`pnpm web:setup && expo export -p web --output-dir ${JSON.stringify(OUT)}`, {
  stdio: 'inherit',
  env: { ...process.env, EK_WEB_BASE: PH, EXPO_OFFLINE: '1' },
});
fs.rmSync(path.join(OUT, 'metadata.json'), { force: true });

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(OUT);

// 1. Rename: no content hashes, no leading underscores, _expo → ex.
const renames = [];
for (const p of files) {
  const b = path.basename(p);
  const nb = b.replace(/[.-][0-9a-f]{32}(?=\.)/, '').replace(/^_+/, '');
  if (nb !== b) renames.push([b, nb]);
}
fs.renameSync(path.join(OUT, '_expo'), path.join(OUT, 'ex'));
const jsDir = path.join(OUT, 'ex/static/js/web');
const texts = [
  path.join(OUT, 'index.html'),
  ...fs.readdirSync(jsDir).map((f) => path.join(jsDir, f)),
];
const renamed = new Set();
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else {
      const hit = renames.find(([b]) => b === f);
      if (hit) {
        fs.renameSync(p, path.join(d, hit[1]));
        renamed.add(hit[1]);
      }
    }
  }
})(OUT);

// 2. Level packs → JSON.
const lv = path.join(OUT, 'assets/assets/levels');
for (const f of fs.readdirSync(lv)) {
  if (!f.endsWith('.json.gz')) continue;
  const gz = fs.readFileSync(path.join(lv, f));
  fs.writeFileSync(
    path.join(lv, f.replace(/\.json\.gz$/, '.json')),
    JSON.stringify({ gz: gz.toString('base64') }),
  );
  fs.rmSync(path.join(lv, f));
}

// 3. Rewrite references.
const scripts = [];
for (const t of texts) {
  const file = fs.existsSync(t)
    ? t
    : path.join(path.dirname(t), renames.find(([b]) => b === path.basename(t))?.[1] ?? '');
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of renames) s = s.split(a).join(b);
  s = s.split(`${PH}/_expo/`).join(`${PH}/ex/`);
  s = s.replace(/(levels\/pack_\d+)\.json\.gz"/g, '$1.json"');
  if (file.endsWith('.html')) {
    for (const m of s.matchAll(new RegExp(`<script src="${PH}([^"]+)" defer></script>`, 'g')))
      scripts.push(m[1]);
    s = s.replace(new RegExp(`<script src="${PH}[^"]+" defer></script>`, 'g'), '');
    s = s.replace(new RegExp(`<link rel="icon" href="${PH}/favicon.ico"/>`), '');
    s = s.replace('</body>', `${boot(scripts)}\n</body>`);
  } else {
    // Base inside the embedded JSON manifest string, then string literals, then template literals.
    s = s.split(String.raw`\"${PH}\"`).join(String.raw`\""+window.__EKBASE__+"\"`);
    s = s.replace(new RegExp(`"${PH}([^"]*)"`, 'g'), '(window.__EKBASE__+"$1")');
    s = s.split(`\`${PH}`).join('`${window.__EKBASE__}');
  }
  if (s.includes(PH)) throw new Error(`base placeholder left in ${file}`);
  fs.writeFileSync(file, s);
}
console.log(
  `preview ready: ${OUT} (${renamed.size} files renamed, ${scripts.length} entry scripts)`,
);

function boot(entry) {
  return `<script>
(function () {
  // Level packs are shipped as {"gz": base64}; hand the app the raw bytes it expects.
  var f = window.fetch;
  window.fetch = function (u, o) {
    var s = String((u && u.url) || u);
    if (!/\\/levels\\/pack_\\d+\\.json$/.test(s)) return f.apply(this, arguments);
    return f(u, o).then(function (r) { return r.json(); }).then(function (j) {
      var t = atob(j.gz), a = new Uint8Array(t.length);
      for (var i = 0; i < t.length; i++) a[i] = t.charCodeAt(i);
      return new Response(a, { headers: { 'content-type': 'application/octet-stream' } });
    });
  };
  var p = location.pathname.replace(/index\\.html$/, '').replace(/\\/+$/, '');
  window.__EKBASE__ = p;
  try { history.replaceState(null, '', p + '/' + location.search + location.hash); } catch (e) {}
  ${JSON.stringify(entry)}.forEach(function (src) {
    var e = document.createElement('script'); e.src = p + src; e.async = false; document.body.appendChild(e);
  });
})();
</script>`;
}
