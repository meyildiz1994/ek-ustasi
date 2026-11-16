import { AdsConsent, RewardedAd } from 'react-native-google-mobile-ads';

import { watchForReward } from './ads';

jest.mock('@/store', () => {
  const state = {
    left: 3,
    save: { noAds: false },
    rewardsLeft: () => state.left,
    grantReward: jest.fn(() => true),
  };
  return { gameStore: { getState: () => state } };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const state = require('@/store').gameStore.getState() as {
  left: number;
  save: { noAds: boolean };
  grantReward: jest.Mock;
};

type Listener = (payload?: unknown) => void;
function fakeAd(events: string[]) {
  const listeners = new Map<string, Listener>();
  return {
    addAdEventListener: (type: string, fn: Listener) => {
      listeners.set(type, fn);
      return () => listeners.delete(type);
    },
    load: () => events.forEach((e) => listeners.get(e)?.()),
    show: jest.fn(() => Promise.resolve()),
  };
}

beforeEach(() => {
  state.left = 3;
  state.save.noAds = false;
  state.grantReward.mockClear();
});

describe('rewarded ads', () => {
  it('pays only after the ad was watched to the end', async () => {
    (RewardedAd.createForAdRequest as jest.Mock).mockReturnValueOnce(
      fakeAd(['loaded', 'earned', 'closed']),
    );
    expect(await watchForReward('coins')).toBe('rewarded');
    expect(state.grantReward).toHaveBeenCalledWith('coins');
    // Non-personalised: ATT/UMP did not allow personalised ads.
    expect(RewardedAd.createForAdRequest).toHaveBeenLastCalledWith('test-rewarded', {
      requestNonPersonalizedAdsOnly: true,
    });

    (RewardedAd.createForAdRequest as jest.Mock).mockReturnValueOnce(fakeAd(['loaded', 'closed']));
    expect(await watchForReward('coins')).toBe('skipped');
    (RewardedAd.createForAdRequest as jest.Mock).mockReturnValueOnce(fakeAd(['error']));
    expect(await watchForReward('freeHint')).toBe('skipped');
    expect(state.grantReward).toHaveBeenCalledTimes(1);
  });

  it('respects the daily limit and lets the caller pay', async () => {
    state.left = 0;
    expect(await watchForReward('coins')).toBe('limit');
    state.left = 1;
    (RewardedAd.createForAdRequest as jest.Mock).mockReturnValueOnce(
      fakeAd(['loaded', 'earned', 'closed']),
    );
    expect(await watchForReward('freeHint', () => false)).toBe('nothing');
  });

  it('pays at once with the no-ads pack, without loading an ad', async () => {
    state.save.noAds = true;
    (RewardedAd.createForAdRequest as jest.Mock).mockClear();
    expect(await watchForReward('coins')).toBe('rewarded');
    expect(RewardedAd.createForAdRequest).not.toHaveBeenCalled();
  });
});

describe('consent', () => {
  it('shows no ad when consent does not allow requesting ads', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sdk = require('react-native-google-mobile-ads') as { AdsConsent: typeof AdsConsent };
    (sdk.AdsConsent.gatherConsent as jest.Mock).mockResolvedValueOnce({ canRequestAds: false });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fresh = require('./ads') as typeof import('./ads');
    expect(await fresh.watchForReward('coins')).toBe('unavailable');
  });
});
