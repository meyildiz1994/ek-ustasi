import { createRng } from '../utils/rng';
import {
  buildGrid,
  cellKey,
  emptyProgress,
  fillDelays,
  isSolved,
  markFound,
  settle,
  unfoundWords,
  visibleCells,
  type CellKey,
} from './grid';
import { HINT_COST, hintCell, hintLetter, hintWord } from './hints';
import type { PlacedWord } from './level';
import { isBigEkTuruLevel, isEkTuruLevel, packFileName, packOf } from './level';
import {
  bonusCoins,
  chainScore,
  ekTuruCoins,
  initialCombo,
  levelEndCoins,
  nextCombo,
  stars,
  wordScore,
} from './scoring';
import { classifyWord } from './validate';
import { dragPath, hitTest, pathWord, shuffleOrder, stepPath, wheelPositions } from './wheel';

// k a l e m / a l e m (V from the a) / m a l (V from the m)
const WORDS: PlacedWord[] = [
  { w: 'kalem', r: 0, c: 0, d: 'H' },
  { w: 'alem', r: 0, c: 1, d: 'V' },
  { w: 'mal', r: 0, c: 4, d: 'V' },
];

describe('grid', () => {
  const g = buildGrid(WORDS);

  it('builds cells and words', () => {
    expect(g.rows).toBe(4);
    expect(g.cols).toBe(5);
    expect(g.cells.size).toBe(5 + 3 + 2);
    expect(g.cells.get(cellKey(0, 1))?.words).toEqual([0, 1]);
    expect(g.words[1]?.cells).toEqual(['0,1', '1,1', '2,1', '3,1']);
    expect(() => buildGrid([...WORDS, { w: 'zz', r: 0, c: 0, d: 'V' }])).toThrow(/conflict/);
  });

  it('tracks found words and visibility', () => {
    let p = emptyProgress();
    p = markFound(g, p, 'alem');
    expect(visibleCells(g, p).has(cellKey(3, 1))).toBe(true);
    expect(visibleCells(g, p).has(cellKey(0, 0))).toBe(false);
    expect(markFound(g, p, 'alem')).toBe(p);
    expect(markFound(g, p, 'yok')).toBe(p);
    expect(unfoundWords(g, p).map((w) => w.w)).toEqual(['kalem', 'mal']);
    p = markFound(g, markFound(g, p, 'kalem'), 'mal');
    expect(isSolved(g, p)).toBe(true);
  });

  it('settles words completed by revealed cells', () => {
    const p = { found: ['kalem'], revealed: [cellKey(1, 4), cellKey(2, 4)] };
    const r = settle(g, p);
    expect(r.completed).toEqual(['mal']);
    expect(settle(g, r.progress).completed).toEqual([]);
  });
});

describe('hints', () => {
  const g = buildGrid(WORDS);
  it('opens one letter of an unfound word', () => {
    const r = hintLetter(g, emptyProgress(), createRng(1));
    expect(r.opened).toHaveLength(1);
    expect(r.progress.revealed).toEqual(r.opened);
  });
  it('opens a chosen cell and can complete a word', () => {
    let p = markFound(g, emptyProgress(), 'kalem');
    p = hintCell(g, p, cellKey(1, 4)).progress;
    const r = hintCell(g, p, cellKey(2, 4));
    expect(r.completed).toEqual(['mal']);
    expect(hintCell(g, p, cellKey(9, 9)).opened).toEqual([]);
    expect(hintCell(g, p, cellKey(0, 0)).opened).toEqual([]);
  });
  it('opens a whole word', () => {
    const r = hintWord(g, emptyProgress(), createRng(2), 'alem');
    expect(r.completed).toEqual(['alem']);
    expect(r.opened).toHaveLength(4);
    const solved = { found: ['kalem', 'alem', 'mal'], revealed: [] };
    expect(hintWord(g, solved, createRng(2)).opened).toEqual([]);
    expect(hintLetter(g, solved, createRng(2)).opened).toEqual([]);
    expect(hintWord(g, emptyProgress(), createRng(3)).completed).toHaveLength(1);
  });
  it('has the spec costs', () => {
    expect(HINT_COST).toMatchObject({
      shuffle: 0,
      letter: 25,
      targeted: 50,
      word: 100,
      suffix: 40,
    });
  });
});

describe('wheel', () => {
  const pos = wheelPositions(4, 100, 100, 50);
  it('puts the first letter at 12 o’clock', () => {
    expect(pos[0]?.x).toBeCloseTo(100);
    expect(pos[0]?.y).toBeCloseTo(50);
    expect(pos[1]?.x).toBeCloseTo(150);
  });
  it('hit-tests within the radius', () => {
    expect(hitTest(pos, { x: 100, y: 55 }, 20)).toBe(0);
    expect(hitTest(pos, { x: 100, y: 100 }, 20)).toBe(-1);
  });
  it('builds and backtracks the path', () => {
    let p = stepPath([], 0);
    p = stepPath(p, 1);
    expect(stepPath(p, 1)).toBe(p);
    expect(stepPath(p, -1)).toBe(p);
    p = stepPath(p, 2);
    expect(stepPath(p, 1)).toEqual([0, 1]);
    expect(stepPath(p, 0)).toBe(p);
  });
  it('samples fast drags so no letter is skipped', () => {
    // From the top letter straight down to the bottom one passes no letter; top → right → bottom does.
    const fast = dragPath(
      [0],
      pos,
      pos[0] as { x: number; y: number },
      pos[2] as { x: number; y: number },
      20,
    );
    expect(fast).toEqual([0, 2]);
    const viaRight = dragPath([0], pos, { x: 150, y: 50 }, { x: 150, y: 150 }, 20);
    expect(viaRight).toEqual([0, 1]);
    expect(pathWord(['k', 'a', 'l', 'e'], [0, 1, 2])).toBe('kal');
  });
  it('shuffles to a different order', () => {
    const o = [0, 1, 2, 3];
    expect(shuffleOrder(o, createRng(5))).not.toEqual(o);
    expect(shuffleOrder([0], createRng(5))).toEqual([0]);
    expect([...shuffleOrder(o, createRng(9))].sort()).toEqual(o);
  });
});

describe('validate', () => {
  const ctx = {
    targets: new Set(['kalem', 'alem']),
    bonus: new Set(['lam']),
    found: ['alem'],
    bonusFound: [] as string[],
  };
  it('classifies words', () => {
    expect(classifyWord('ka', ctx)).toBe('tooShort');
    expect(classifyWord('kalem', ctx)).toBe('target');
    expect(classifyWord('alem', ctx)).toBe('alreadyFound');
    expect(classifyWord('lam', ctx)).toBe('bonus');
    expect(classifyWord('lam', { ...ctx, bonusFound: ['lam'] })).toBe('alreadyFound');
    expect(classifyWord('mak', ctx)).toBe('invalid');
  });
});

describe('scoring', () => {
  it('applies the combo window', () => {
    let c = initialCombo();
    const m = [0, 1000, 2000, 3000, 20000].map((t) => {
      const r = nextCombo(c, t);
      c = r.state;
      return r.multiplier;
    });
    expect(m).toEqual([1, 1.2, 1.5, 2, 1]);
    expect(wordScore('kalem')).toBe(50);
    expect(wordScore('kalem', 1.5)).toBe(75);
  });
  it('gives stars and coins', () => {
    expect([0, 1, 2, 3, 9].map(stars)).toEqual([3, 2, 2, 1, 1]);
    expect(levelEndCoins(3)).toBe(20);
    expect(levelEndCoins(2)).toBe(10);
    expect(bonusCoins(9, 10)).toBe(25);
    expect(bonusCoins(3, 4)).toBe(0);
    expect(chainScore('kalemliklerimizden', 4)).toBe(576);
    expect(ekTuruCoins(576)).toBe(144);
  });
});

describe('level helpers', () => {
  it('knows packs and Ek Turu levels', () => {
    expect(packOf(1)).toBe(1);
    expect(packOf(50)).toBe(1);
    expect(packOf(51)).toBe(2);
    expect(packFileName(7)).toBe('pack_0007.json.gz');
    expect(isEkTuruLevel(10)).toBe(true);
    expect(isEkTuruLevel(11)).toBe(false);
    expect(isBigEkTuruLevel(100)).toBe(true);
  });
});

describe('fillDelays', () => {
  it('orders the found word first, then other new cells in reading order', () => {
    const before = new Set<CellKey>(['0,0']);
    const after = new Set<CellKey>(['0,0', '2,1', '0,1', '0,2', '1,5']);
    const d = fillDelays(before, after, ['0,0', '0,1', '0,2'], 80);
    expect([...d.entries()]).toEqual([
      ['0,1', 0],
      ['0,2', 80],
      ['1,5', 160],
      ['2,1', 240],
    ]);
  });
});
