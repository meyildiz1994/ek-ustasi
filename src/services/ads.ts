/**
 * Rewarded ads only (spec §13.2): the player chooses to watch one for coins or a free hint. No
 * interstitial or banner ads exist anywhere in the game.
 *
 * Consent order on first use: UMP (GDPR/EU consent form when required) → ATT on iOS → SDK init.
 * Ads are non-personalised unless both allow tracking. With the no-ads pack, rewards pay at once.
 */
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

import { AD_UNITS, type RewardPlacement } from '../../config/monetization';
import { gameStore } from '../store';

export type RewardOutcome = 'rewarded' | 'skipped' | 'limit' | 'unavailable' | 'nothing';

let ready: Promise<{ personalised: boolean } | null> | null = null;

function unitId(): string {
  const real = Platform.OS === 'ios' ? AD_UNITS.rewardedIos : AD_UNITS.rewardedAndroid;
  return __DEV__ || !real ? TestIds.REWARDED : real;
}

/** Runs the consent flow and starts the SDK once. */
export function initAds(): Promise<{ personalised: boolean } | null> {
  ready ??= (async () => {
    try {
      const consent = await AdsConsent.gatherConsent();
      if (!consent.canRequestAds) return null;
      let tracking = true;
      if (Platform.OS === 'ios') tracking = (await requestTrackingPermissionsAsync()).granted;
      const choices = await AdsConsent.getUserChoices().catch(() => null);
      await mobileAds().initialize();
      return { personalised: tracking && (choices?.selectPersonalisedAds ?? false) };
    } catch {
      ready = null; // try again next time (offline, SDK not ready)
      return null;
    }
  })();
  return ready;
}

function showRewarded(personalised: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(unitId(), {
      requestNonPersonalizedAdsOnly: !personalised,
    });
    let earned = false;
    const offs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => void ad.show()),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true)),
      ad.addAdEventListener(AdEventType.CLOSED, () => done(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => done(false)),
    ];
    const done = (ok: boolean) => {
      offs.forEach((off) => off());
      resolve(ok);
    };
    ad.load();
  });
}

/** Shows a rewarded ad (or skips it with the no-ads pack) and pays the placement. */
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
  if (!store.save.noAds) {
    const consent = await initAds();
    if (!consent) return 'unavailable';
    if (!(await showRewarded(consent.personalised))) return 'skipped';
  }
  return grant() ? 'rewarded' : 'nothing';
}
