/**
 * Web build = browser preview only (no ad SDK). A rewarded ad is simulated by a short pause, then
 * the reward is paid exactly as on phones (same daily limit, same no-ads rule).
 */
import type { RewardPlacement } from '../../config/monetization';
import { gameStore } from '../store';

export type RewardOutcome = 'rewarded' | 'skipped' | 'limit' | 'unavailable' | 'nothing';

export const initAds = async () => ({ personalised: false });

/** Length of the simulated ad. */
export const DEMO_AD_MS = 1500;

export async function watchForReward(
  placement: RewardPlacement,
  grant: () => boolean = () => gameStore.getState().grantReward(placement),
): Promise<RewardOutcome> {
  const store = gameStore.getState();
  if (store.rewardsLeft() <= 0) return 'limit';
  if (!store.save.noAds) await new Promise((r) => setTimeout(r, DEMO_AD_MS));
  return grant() ? 'rewarded' : 'nothing';
}
