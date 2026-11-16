/**
 * Daily login reward (spec §13.1): one claim per local calendar day; consecutive days walk the
 * 7-day cycle, a missed day starts it again. Days are 'YYYY-MM-DD' strings in the player's time zone.
 */
import { DAILY_REWARDS } from '../../config/monetization';

export interface DailyState {
  /** Local day of the last claim. */
  lastClaim: string | null;
  /** Position in the cycle of the last claim (0-based). */
  step: number;
}

export const emptyDaily = (): DailyState => ({ lastClaim: null, step: -1 });

/** Local calendar day of a timestamp. */
export function localDay(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole days from a to b (both 'YYYY-MM-DD'). */
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

export interface DailyOffer {
  /** Cycle position offered today (0-based). */
  step: number;
  coins: number;
}

/** What today's claim would pay, or null when today was already claimed. */
export function dailyOffer(state: DailyState, today: string): DailyOffer | null {
  if (state.lastClaim !== null) {
    const gap = daysBetween(state.lastClaim, today);
    if (gap <= 0) return null; // claimed today (or the clock went back)
    if (gap === 1) {
      const step = (state.step + 1) % DAILY_REWARDS.length;
      return { step, coins: DAILY_REWARDS[step] as number };
    }
  }
  return { step: 0, coins: DAILY_REWARDS[0] };
}

export function claimDaily(
  state: DailyState,
  today: string,
): { state: DailyState; coins: number } | null {
  const offer = dailyOffer(state, today);
  if (!offer) return null;
  return { state: { lastClaim: today, step: offer.step }, coins: offer.coins };
}

/** Rewarded-ad counter that resets every local day. */
export interface AdQuota {
  day: string | null;
  used: number;
}

export const emptyQuota = (): AdQuota => ({ day: null, used: 0 });

export const quotaLeft = (q: AdQuota, today: string, limit: number): number =>
  q.day === today ? Math.max(0, limit - q.used) : limit;

export const spendQuota = (q: AdQuota, today: string): AdQuota => ({
  day: today,
  used: q.day === today ? q.used + 1 : 1,
});
