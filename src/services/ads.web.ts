/** Web build: no ad SDK. With the no-ads pack rewards still pay (same rule as on phones). */
import type { RewardPlacement } from '../../config/monetization';
import { gameStore } from '../store';

export type RewardOutcome = 'rewarded' | 'skipped' | 'limit' | 'unavailable' | 'nothing';

export const initAds = async () => null;

/**
 * `grant` lets the caller pay the reward itself (e.g. to animate a free hint); it defaults to the
 * store's grantReward(placement).
 */
export async function watchForReward(
  placement: RewardPlacement,
  grant: () => boolean = () => gameStore.getState().grantReward(placement),
): Promise<RewardOutcome> {
  const store = gameStore.getState();
  if (store.rewardsLeft() <= 0) return 'limit';
  if (!store.save.noAds) return 'unavailable';
  return grant() ? 'rewarded' : 'nothing';
}
