import { completeTimeline, EK_STEP_MS, ekTimeline, STAR_AT, STAR_GAP } from './feel';

describe('completeTimeline', () => {
  it('plays the fanfare, each earned star in turn, then the coins', () => {
    expect(completeTimeline(3, 25)).toEqual([
      [0, 'levelEnd'],
      [STAR_AT, 'star'],
      [STAR_AT + STAR_GAP, 'star'],
      [STAR_AT + 2 * STAR_GAP, 'star'],
      [STAR_AT + 3 * STAR_GAP, 'coin'],
    ]);
  });
  it('skips the coin chime when nothing was earned', () => {
    expect(completeTimeline(1, 0)).toEqual([
      [0, 'levelEnd'],
      [STAR_AT, 'star'],
    ]);
    expect(completeTimeline(0, 5)).toEqual([
      [0, 'levelEnd'],
      [STAR_AT + STAR_GAP, 'coin'],
    ]);
  });
});

describe('ekTimeline', () => {
  it('rises one note per suffix from the current chain length', () => {
    expect(ekTimeline(2, 2, false)).toEqual([
      [0, { kind: 'step', n: 2 }],
      [EK_STEP_MS, { kind: 'step', n: 3 }],
    ]);
  });
  it('ends with the break', () => {
    expect(ekTimeline(0, 1, true)).toEqual([
      [0, { kind: 'step', n: 0 }],
      [EK_STEP_MS, { kind: 'break' }],
    ]);
    expect(ekTimeline(3, 0, true)).toEqual([[0, { kind: 'break' }]]);
  });
});
