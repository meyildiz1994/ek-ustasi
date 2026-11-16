/**
 * Letter wheel model (spec §4.1): letters evenly spaced on a circle, the first at 12 o'clock.
 * The player drags across letters; returning to the previous letter removes the last one. Fast
 * drags are sub-sampled along the segment between two touch points so no letter is skipped.
 */
import type { Rng } from '../utils/rng';

export interface Point {
  x: number;
  y: number;
}

/** Hit radius = 110 % of the letter circle radius. */
export const HIT_FACTOR = 1.1;

/** Letter centres around (cx, cy) on a circle of radius `r`. */
export function wheelPositions(n: number, cx: number, cy: number, r: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/** Index of the letter under `p` (closest centre within `hitRadius`), or -1. */
export function hitTest(positions: readonly Point[], p: Point, hitRadius: number): number {
  let best = -1;
  let bestD = hitRadius * hitRadius;
  positions.forEach((q, i) => {
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/** Applies one touched letter to the selection path. */
export function stepPath(path: readonly number[], hit: number): number[] {
  if (hit === -1 || path[path.length - 1] === hit) return path as number[];
  if (path.length >= 2 && path[path.length - 2] === hit) return path.slice(0, -1);
  if (path.includes(hit)) return path as number[];
  return [...path, hit];
}

/**
 * Extends the path with every letter crossed on the segment from → to, sampled every
 * hitRadius / 2 so a fast swipe cannot jump over a letter.
 */
export function dragPath(
  path: readonly number[],
  positions: readonly Point[],
  from: Point,
  to: Point,
  hitRadius: number,
): number[] {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(dist / (hitRadius / 2)));
  let out = path as number[];
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    out = stepPath(out, hitTest(positions, p, hitRadius));
  }
  return out;
}

export const pathWord = (letters: readonly string[], path: readonly number[]): string =>
  path.map((i) => letters[i] ?? '').join('');

/** A new letter order (indices) that differs from the current one when possible. */
export function shuffleOrder(order: readonly number[], rng: Rng): number[] {
  if (order.length < 2) return order.slice();
  for (let i = 0; i < 10; i++) {
    const next = rng.shuffle(order);
    if (next.some((v, j) => v !== order[j])) return next;
  }
  return [...order.slice(1), order[0] as number];
}
