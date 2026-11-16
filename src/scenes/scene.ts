/**
 * Procedural stop scenes (spec §10, D-014): a stop's recipe (layers + time of day + palette + seed)
 * becomes a list of flat "paper-cut" shapes as SVG path strings. The same list is drawn by Skia in
 * the app (src/components/Scene.tsx) and as SVG in tools/scenes/preview.html, so what is reviewed
 * is what ships. Shapes are generic forms only (dome, minaret, tower…); no real building is copied.
 */
import { createRng, type Rng } from '../utils/rng';

export type Layer =
  | 'mountains'
  | 'snowPeaks'
  | 'hills'
  | 'plateau'
  | 'sea'
  | 'lake'
  | 'river'
  | 'waterfall'
  | 'city'
  | 'domes'
  | 'minarets'
  | 'tower'
  | 'bridge'
  | 'castle'
  | 'ruins'
  | 'columns'
  | 'rockSpires'
  | 'balloons'
  | 'trees'
  | 'pines'
  | 'terraces'
  | 'vineyards'
  | 'fields'
  | 'palms'
  | 'desert'
  | 'boats'
  | 'lighthouse'
  | 'windmills'
  | 'houses'
  | 'skyscrapers'
  | 'birds'
  | 'clouds'
  | 'stars'
  | 'moon'
  | 'snow';

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export interface SceneRecipe {
  palette: { sky: readonly string[]; ground: readonly string[]; accent: string };
  scene: { layers: readonly Layer[]; time: TimeOfDay; seed: number };
}

/** One shape. `shadow` marks a paper layer that casts a soft drop shadow. */
export type SceneOp =
  | { kind: 'sky'; colors: string[] }
  | { kind: 'fill'; d: string; color: string; opacity?: number; shadow?: boolean }
  | { kind: 'stroke'; d: string; color: string; width: number; opacity?: number };

export const PAPER = '#FFF4E0';
const WOOD = '#5A3E2B';
const LEAF = '#2E7D4F';
const PINE = '#1E4D3A';
const ROOF = '#C8323C';
const STONE = '#EDE3CF';
const BALLOON = ['#C8323C', '#F2A93B', '#1FA6A0', '#2753A6'];

const f = (n: number) => Math.round(n * 10) / 10;
const circle = (x: number, y: number, r: number) =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const rect = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const poly = (pts: readonly (readonly [number, number])[]) =>
  `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;

class Builder {
  readonly ops: SceneOp[] = [];
  constructor(
    readonly W: number,
    readonly H: number,
    readonly R: Rng,
  ) {}
  fill(d: string, color: string, extra: { opacity?: number; shadow?: boolean } = {}) {
    this.ops.push({ kind: 'fill', d, color, ...extra });
  }
  stroke(d: string, color: string, width: number, opacity?: number) {
    this.ops.push(
      opacity === undefined
        ? { kind: 'stroke', d, color, width }
        : { kind: 'stroke', d, color, width, opacity },
    );
  }
  /** Ridge line from left to right, closed down to the bottom edge. */
  ridge(color: string, base: number, amp: number, n: number, sharp: boolean, shadow = true) {
    const { W, H, R } = this;
    let d = `M0 ${f(H)}L0 ${f(base)}`;
    for (let i = 1; i <= n; i++) {
      const x = (i / n) * W;
      if (sharp) {
        const peak = i % 2 === 1;
        const y = base - (peak ? amp * (0.6 + R.next() * 0.4) : amp * (0.05 + R.next() * 0.15));
        d += `L${f(x - (W / n) * 0.1 * R.next())} ${f(y)}`;
      } else {
        const y = base - amp * (0.35 + 0.65 * R.next());
        const cx = x - W / n / 2;
        d += `Q${f(cx)} ${f(y - amp * 0.4)} ${f(x)} ${f(base - amp * 0.3 * R.next())}`;
      }
    }
    d += `L${f(W)} ${f(H)}Z`;
    this.fill(d, color, { shadow });
  }
}

/** Builds the shapes of a scene at W×H. Deterministic: same recipe → same shapes. */
export function buildScene(stop: SceneRecipe, W: number, H: number): SceneOp[] {
  const R = createRng(stop.scene.seed);
  const b = new Builder(W, H, R);
  const L = new Set<Layer>(stop.scene.layers);
  const P = stop.palette;
  const t = stop.scene.time;
  const g0 = P.ground[0] as string;
  const g1 = P.ground[1] as string;
  const g2 = P.ground[2] as string;
  const s = Math.min(W / 270, H / 400); // shapes were designed on a 270×400 card

  b.ops.push({ kind: 'sky', colors: [...P.sky] });
  const hor = H * 0.62;

  // Sky: stars, sun / moon, clouds.
  if (L.has('stars') || t === 'night') {
    for (let i = 0; i < 60; i++)
      b.fill(circle(R.next() * W, R.next() * hor * 0.8, 0.9 * s), '#fff', {
        opacity: 0.3 + R.next() * 0.7,
      });
  }
  if (t === 'night' || L.has('moon')) {
    b.fill(circle(W * 0.8, H * 0.14, 14 * s), PAPER, { shadow: true });
    b.fill(circle(W * 0.8 + 6 * s, H * 0.14 - 3 * s, 11 * s), P.sky[1] as string);
  } else {
    const sunset = t === 'sunset';
    b.fill(
      circle(W * 0.75, sunset ? hor - 30 * s : H * 0.16, (sunset ? 26 : 18) * s),
      sunset ? '#FFB35C' : '#FFE7A3',
      { opacity: 0.95 },
    );
  }
  if (L.has('clouds')) {
    for (let i = 0; i < 3; i++) {
      const x = R.next() * W * 0.8;
      const y = (20 + R.next() * 60) * s;
      const d = [0, 1, 2, 3]
        .map((j) => circle(x + j * 14 * s, y + (j % 2) * 4 * s, 12 * s))
        .join('');
      b.fill(d, '#fff', { opacity: 0.88, shadow: true });
    }
  }
  if (L.has('balloons')) {
    for (let i = 0; i < 7; i++) {
      const x = R.next() * W;
      const y = 30 * s + R.next() * hor * 0.55;
      const r = (8 + R.next() * 8) * s;
      b.fill(
        `${circle(x, y, r)}${poly([
          [x - r * 0.8, y + r * 0.55],
          [x, y + r * 1.5],
          [x + r * 0.8, y + r * 0.55],
        ])}`,
        BALLOON[i % 4] as string,
        { shadow: true },
      );
      b.fill(rect(x - 2.5 * s, y + r * 1.55, 5 * s, 4 * s), WOOD);
    }
  }
  if (L.has('birds')) {
    for (let i = 0; i < 6; i++) {
      const x = R.next() * W;
      const y = (20 + R.next() * 80) * s;
      const w = 6 * s;
      b.stroke(
        `M${f(x - w)} ${f(y)}Q${f(x - w / 2)} ${f(y - w * 0.7)} ${f(x)} ${f(y)}Q${f(x + w / 2)} ${f(y - w * 0.7)} ${f(x + w)} ${f(y)}`,
        '#1E2A5A',
        1.4 * s,
      );
    }
  }

  // Land: far ridges.
  if (L.has('snowPeaks')) {
    b.ridge(g0, hor, 110 * s, 8, true);
    b.ridge('#FFFFFF', hor - 60 * s, 45 * s, 8, true, false);
    b.ridge(g0, hor + 10 * s, 70 * s, 9, true);
  } else if (L.has('mountains')) b.ridge(g0, hor, 90 * s, 8, true);
  if (L.has('hills')) b.ridge(g1, hor + 20 * s, 40 * s, 6, false);
  if (L.has('plateau')) b.fill(rect(0, hor - 14 * s, W, H - hor + 14 * s), g0, { shadow: true });
  if (L.has('rockSpires')) {
    for (let i = 0; i < 9; i++) {
      const x = R.next() * W;
      const h = (40 + R.next() * 60) * s;
      const w = (14 + R.next() * 10) * s;
      const base = hor + 20 * s;
      b.fill(
        `M${f(x - w)} ${f(base)}Q${f(x - w * 0.4)} ${f(base - h * 0.7)} ${f(x)} ${f(base - h)}Q${f(x + w * 0.4)} ${f(base - h * 0.7)} ${f(x + w)} ${f(base)}Z`,
        g0,
        { shadow: true },
      );
      b.fill(circle(x, base - h, 4 * s), PAPER);
    }
  }
  if (L.has('waterfall'))
    b.fill(rect(W * 0.15, hor - 50 * s, 10 * s, 90 * s), '#fff', { opacity: 0.85 });

  // Water and ground.
  const wide = L.has('sea') || L.has('lake');
  if (wide) {
    b.fill(rect(0, hor + 20 * s, W, H * 0.15), P.accent, { shadow: true });
    for (let i = 0; i < 12; i++) {
      const x = R.next() * W;
      const y = hor + 26 * s + R.next() * H * 0.12;
      b.stroke(`M${f(x)} ${f(y)}h${f(12 * s)}`, '#fff', 1.2 * s, 0.55);
    }
  }
  if (L.has('desert')) b.ridge('#E8C27A', hor + 30 * s, 22 * s, 5, false);
  const ground = wide ? hor + 20 * s + H * 0.15 : hor + 20 * s;
  b.fill(rect(0, ground, W, H - ground), g2, { shadow: true });
  if (L.has('river')) {
    b.fill(
      `M${f(W * 0.45)} ${f(ground)}Q${f(W * 0.3)} ${f(H * 0.85)} ${f(W * 0.5)} ${f(H)}L${f(W * 0.7)} ${f(H)}Q${f(W * 0.5)} ${f(H * 0.85)} ${f(W * 0.55)} ${f(ground)}Z`,
      P.accent,
    );
  }
  if (L.has('terraces')) {
    for (let i = 0; i < 5; i++)
      b.fill(
        rect(0, ground - 60 * s + i * 12 * s, W * 0.5 - i * 20 * s, 10 * s),
        i % 2 ? g1 : '#7FBF6A',
        {
          shadow: true,
        },
      );
  }
  if (L.has('fields') || L.has('vineyards')) {
    for (let i = 0; i < 6; i++) {
      const color = L.has('vineyards') ? '#6E8B3D' : i % 2 ? '#D9B55A' : '#A9C46C';
      b.fill(rect((i * W) / 6, ground + 4 * s, W / 6 - 2 * s, 14 * s), color);
    }
  }

  // Built forms, standing on the ground line.
  const base = ground - 2 * s;
  if (L.has('city') || L.has('houses') || L.has('skyscrapers')) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x = (i * W) / n;
      const w = W / n - 2 * s;
      const h = (L.has('skyscrapers') && i % 3 === 0 ? 60 + R.next() * 70 : 14 + R.next() * 26) * s;
      b.fill(rect(x, base - h, w, h), i % 2 ? g1 : g0, { shadow: true });
      if (L.has('houses'))
        b.fill(
          poly([
            [x - s, base - h],
            [x + w / 2, base - h - 8 * s],
            [x + w + s, base - h],
          ]),
          ROOF,
        );
      if (t === 'night' || t === 'sunset')
        b.fill(rect(x + 3 * s, base - h + 5 * s, 3 * s, 3 * s), '#F2A93B');
    }
  }
  if (L.has('domes')) {
    const x = W * 0.38;
    const r = 24 * s;
    b.fill(
      `${rect(x - 30 * s, base - 30 * s, 60 * s, 30 * s)}M${f(x - r)} ${f(base - 30 * s)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(base - 30 * s)}Z`,
      g1,
      { shadow: true },
    );
    b.fill(rect(x - s, base - 30 * s - r - 8 * s, 2 * s, 8 * s), '#F2A93B');
  }
  if (L.has('minarets')) {
    for (const x of [W * 0.38 - 42 * s, W * 0.38 + 40 * s]) {
      b.fill(
        `${rect(x - 3 * s, base - 80 * s, 6 * s, 80 * s)}${poly([
          [x - 4 * s, base - 80 * s],
          [x, base - 98 * s],
          [x + 4 * s, base - 80 * s],
        ])}${rect(x - 5 * s, base - 60 * s, 10 * s, 3 * s)}`,
        g1,
        { shadow: true },
      );
    }
  }
  if (L.has('tower')) {
    const x = W * 0.68;
    b.fill(
      `${rect(x - 6 * s, base - 90 * s, 12 * s, 90 * s)}${poly([
        [x - 9 * s, base - 90 * s],
        [x, base - 112 * s],
        [x + 9 * s, base - 90 * s],
      ])}`,
      g0,
      { shadow: true },
    );
  }
  if (L.has('castle')) {
    const x = W * 0.2;
    let d = rect(x - 28 * s, base - 40 * s, 56 * s, 40 * s);
    for (let i = 0; i < 5; i++) d += rect(x - 28 * s + i * 12 * s, base - 48 * s, 7 * s, 8 * s);
    b.fill(d, g0, { shadow: true });
    b.fill(
      `M${f(x - 6 * s)} ${f(base)}v${f(-12 * s)}a${f(6 * s)} ${f(6 * s)} 0 0 1 ${f(12 * s)} 0v${f(12 * s)}Z`,
      g2,
    );
  }
  if (L.has('bridge')) {
    b.stroke(
      `M0 ${f(ground - 14 * s)}Q${f(W / 2)} ${f(ground - 44 * s)} ${f(W)} ${f(ground - 14 * s)}`,
      g0,
      4 * s,
    );
    for (let i = 1; i < 8; i++) {
      const x = (i * W) / 8;
      const y = ground - 14 * s - 30 * s * (1 - ((2 * x) / W - 1) ** 2) * 1;
      b.stroke(`M${f(x)} ${f(y)}V${f(ground - 4 * s)}`, g0, 1.5 * s);
    }
  }
  if (L.has('columns') || L.has('ruins')) {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const h = (L.has('ruins') && i % 2 ? 18 : 36) * s;
      d += rect(W * 0.55 + i * 12 * s, base - h, 6 * s, h);
    }
    if (L.has('columns')) d += rect(W * 0.55 - 3 * s, base - 40 * s, 60 * s, 4 * s);
    b.fill(d, STONE, { shadow: true });
  }
  if (L.has('lighthouse')) {
    const x = W * 0.9;
    b.fill(rect(x - 5 * s, base - 50 * s, 10 * s, 50 * s), '#fff', { shadow: true });
    b.fill(
      `${rect(x - 5 * s, base - 40 * s, 10 * s, 8 * s)}${rect(x - 5 * s, base - 20 * s, 10 * s, 8 * s)}`,
      ROOF,
    );
    b.fill(circle(x, base - 54 * s, 4 * s), '#F2A93B');
  }
  if (L.has('windmills')) {
    for (const x of [W * 0.82, W * 0.92]) {
      b.fill(
        poly([
          [x - 5 * s, base],
          [x - 3 * s, base - 40 * s],
          [x + 3 * s, base - 40 * s],
          [x + 5 * s, base],
        ]),
        PAPER,
        { shadow: true },
      );
      let d = '';
      for (let k = 0; k < 4; k++) {
        const a = k * 1.5708 + 0.4;
        d += `M${f(x)} ${f(base - 40 * s)}L${f(x + 18 * s * Math.cos(a))} ${f(base - 40 * s + 18 * s * Math.sin(a))}`;
      }
      b.stroke(d, PAPER, 2.2 * s);
    }
  }

  // Foreground: trees, palms, boats, snow.
  const tree = (x: number, y: number, pine: boolean) =>
    pine
      ? b.fill(
          poly([
            [x - 8 * s, y],
            [x, y - 26 * s],
            [x + 8 * s, y],
          ]),
          PINE,
          { shadow: true },
        )
      : (b.fill(rect(x - 1.5 * s, y - 6 * s, 3 * s, 6 * s), WOOD),
        b.fill(circle(x, y - 12 * s, 10 * s), LEAF, { shadow: true }));
  if (L.has('trees') || L.has('pines')) {
    for (let i = 0; i < 10; i++)
      tree(
        R.next() * W,
        ground + (18 + R.next() * 30) * s,
        L.has('pines') && (i % 2 === 0 || !L.has('trees')),
      );
  }
  if (L.has('palms')) {
    for (const x of [W * 0.1, W * 0.9]) {
      b.stroke(
        `M${f(x)} ${f(ground + 30 * s)}Q${f(x + 6 * s)} ${f(ground)} ${f(x + 2 * s)} ${f(ground - 30 * s)}`,
        WOOD,
        3 * s,
      );
      let d = '';
      for (let k = 0; k < 5; k++) {
        const a = k * 1.25;
        const cx = x + 2 * s + Math.cos(a) * 12 * s;
        const cy = ground - 30 * s + Math.sin(a) * 5 * s;
        d += `M${f(x + 2 * s)} ${f(ground - 30 * s)}Q${f(cx)} ${f(cy - 8 * s)} ${f(cx + Math.cos(a) * 10 * s)} ${f(cy + 4 * s)}Q${f(cx)} ${f(cy)} ${f(x + 2 * s)} ${f(ground - 30 * s)}Z`;
      }
      b.fill(d, LEAF, { shadow: true });
    }
  }
  if (L.has('boats') && (wide || L.has('river'))) {
    for (let i = 0; i < 3; i++) {
      const x = R.next() * W * 0.8 + 20 * s;
      const y = wide ? hor + 30 * s + R.next() * H * 0.08 : ground + 20 * s + R.next() * 40 * s;
      b.fill(
        poly([
          [x, y],
          [x + 24 * s, y],
          [x + 18 * s, y + 6 * s],
          [x + 6 * s, y + 6 * s],
        ]),
        PAPER,
        { shadow: true },
      );
      b.fill(
        poly([
          [x + 12 * s, y - 2 * s],
          [x + 12 * s, y - 18 * s],
          [x + 22 * s, y - 2 * s],
        ]),
        '#fff',
      );
    }
  }
  // Paper-cut foreground band: a soft lighter hill along the bottom edge for depth.
  b.ridge(g1, H - 26 * s, 18 * s, 4, false);
  if (L.has('snow')) {
    for (let i = 0; i < 70; i++)
      b.fill(circle(R.next() * W, R.next() * H, 1.6 * s), '#fff', { opacity: 0.6 });
  }
  return b.ops;
}

/** SVG markup for a scene (preview page, tests). */
export function sceneSvg(stop: SceneRecipe, W: number, H: number, id = 'sc'): string {
  const ops = buildScene(stop, W, H);
  const out: string[] = [];
  for (const op of ops) {
    if (op.kind === 'sky') {
      const stops = op.colors
        .map((c, i) => `<stop offset="${(i / (op.colors.length - 1)) * 0.7}" stop-color="${c}"/>`)
        .join('');
      out.push(
        `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient><filter id="${id}s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="${f(W / 180)}" stdDeviation="${f(W / 160)}" flood-color="#000" flood-opacity="0.28"/></filter></defs><rect width="${W}" height="${H}" fill="url(#${id}g)"/>`,
      );
    } else if (op.kind === 'fill') {
      out.push(
        `<path d="${op.d}" fill="${op.color}"${op.opacity !== undefined ? ` opacity="${op.opacity.toFixed(2)}"` : ''}${op.shadow ? ` filter="url(#${id}s)"` : ''}/>`,
      );
    } else {
      out.push(
        `<path d="${op.d}" fill="none" stroke="${op.color}" stroke-width="${f(op.width)}" stroke-linecap="round"${op.opacity !== undefined ? ` opacity="${op.opacity.toFixed(2)}"` : ''}/>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out.join('')}</svg>`;
}
