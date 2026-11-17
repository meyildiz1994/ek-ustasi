import { DAILY_REWARDS } from '../../config/monetization';
import {
  claimDaily,
  dailyOffer,
  daysBetween,
  emptyDaily,
  emptyQuota,
  localDay,
  quotaLeft,
  spendQuota,
} from './daily';

describe('daily reward', () => {
  it('walks the 7-day cycle on consecutive days and wraps', () => {
    let s = emptyDaily();
    const paid: number[] = [];
    for (let d = 1; d <= 9; d++) {
      const out = claimDaily(s, `2026-11-${String(d).padStart(2, '0')}`)!;
      paid.push(out.coins);
      s = out.state;
    }
    expect(paid).toEqual([...DAILY_REWARDS, 25, 25]);
  });

  it('pays once per day', () => {
    const s = claimDaily(emptyDaily(), '2026-11-16')!.state;
    expect(dailyOffer(s, '2026-11-16')).toBeNull();
    expect(claimDaily(s, '2026-11-16')).toBeNull();
    expect(dailyOffer(s, '2026-11-15')).toBeNull(); // clock moved back
  });

  it('restarts the cycle after a missed day', () => {
    let s = claimDaily(emptyDaily(), '2026-11-01')!.state;
    s = claimDaily(s, '2026-11-02')!.state;
    s = claimDaily(s, '2026-11-03')!.state;
    expect(dailyOffer(s, '2026-11-05')).toEqual({ step: 0, coins: 25 });
  });

  it('counts calendar days across months and years', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(localDay(new Date(2026, 10, 7, 23, 59).getTime())).toBe('2026-11-07');
  });
});

describe('rewarded ad quota', () => {
  it('counts per day and resets the next day', () => {
    let q = emptyQuota();
    expect(quotaLeft(q, 'd1', 2)).toBe(2);
    q = spendQuota(q, 'd1');
    q = spendQuota(q, 'd1');
    expect(quotaLeft(q, 'd1', 2)).toBe(0);
    expect(quotaLeft(q, 'd2', 2)).toBe(2);
    expect(spendQuota(q, 'd2')).toEqual({ day: 'd2', used: 1 });
  });
});
