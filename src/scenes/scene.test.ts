import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildScene, sceneSvg, type SceneRecipe } from './scene';

const stops = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'assets', 'levels', 'stops.json'), 'utf8'),
) as (SceneRecipe & { id: string })[];

const PATH = /^(?:[MLHVQACZhvalq]|-?\d+(?:\.\d+)?|\s)+$/;

describe('procedural scenes', () => {
  it('builds every one of the 100 stops with well-formed shapes', () => {
    expect(stops).toHaveLength(100);
    for (const s of stops) {
      const ops = buildScene(s, 270, 400);
      expect(ops[0]).toEqual({ kind: 'sky', colors: s.palette.sky });
      expect(ops.length).toBeGreaterThan(5);
      for (const op of ops) {
        if (op.kind === 'sky') continue;
        expect(op.d).toMatch(PATH);
        expect(op.d).not.toContain('NaN');
        expect(op.color).toMatch(/^#(?:[0-9A-Fa-f]{3}){1,2}$/);
      }
    }
  });

  it('is deterministic and scales with the canvas', () => {
    const s = stops[0] as SceneRecipe;
    expect(buildScene(s, 270, 400)).toEqual(buildScene(s, 270, 400));
    expect(sceneSvg(s, 270, 400)).toContain('<svg');
    expect(buildScene(s, 540, 800)).toHaveLength(buildScene(s, 270, 400).length);
  });

  it('gives neighbouring stops different scenes', () => {
    const sig = (s: SceneRecipe) => sceneSvg(s, 90, 130);
    const seen = new Set(stops.map(sig));
    expect(seen.size).toBe(100);
  });
});
