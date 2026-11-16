/**
 * Monetisation config (spec §13.2). Everything a release might tune lives here: product ids, coin
 * amounts, rewarded-ad payouts and limits, ad unit ids. Store prices come from the stores (tiers),
 * never from this file.
 */
export type ProductKind = 'consumable' | 'nonConsumable';

export interface ProductConfig {
  /** Same id in App Store Connect, Google Play and RevenueCat. */
  id: string;
  kind: ProductKind;
  /** Coins granted by a consumable pack. */
  coins?: number;
}

export const PRODUCTS = {
  coinsSmall: { id: 'ek_ustasi_coins_small', kind: 'consumable', coins: 500 },
  coinsMedium: { id: 'ek_ustasi_coins_medium', kind: 'consumable', coins: 1200 },
  coinsLarge: { id: 'ek_ustasi_coins_large', kind: 'consumable', coins: 3000 },
  /** "Reklamsız Paket": rewarded placements pay out without an ad, plus a one-off coin gift. */
  noAds: { id: 'ek_ustasi_no_ads', kind: 'nonConsumable', coins: 500 },
} as const satisfies Record<string, ProductConfig>;

export type ProductKey = keyof typeof PRODUCTS;

/** RevenueCat entitlement unlocked by the no-ads product. */
export const NO_ADS_ENTITLEMENT = 'no_ads';

/** RevenueCat public SDK keys come from the environment (EAS secrets), never from the repo. */
export const REVENUECAT_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};

export type RewardPlacement = 'coins' | 'freeHint';

export const REWARDED = {
  /** Coins for watching one rewarded ad (spec §13.2). */
  coins: 25,
  /** Rewarded ads a player can watch per local day, all placements together. */
  dailyLimit: 10,
};

/**
 * Rewarded ad unit ids. Empty → the SDK's public test ids are used (development and until real ids
 * are set via EXPO_PUBLIC_ADMOB_REWARDED_IOS / _ANDROID).
 */
export const AD_UNITS = {
  rewardedIos: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? '',
  rewardedAndroid: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ?? '',
};

/** Daily login reward, a 7-day cycle (spec §13.1). */
export const DAILY_REWARDS = [25, 25, 50, 50, 75, 75, 150] as const;

/** Links shown in Settings. Placeholders until the pages exist. */
export const LINKS = {
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
  contact: process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? '',
};
