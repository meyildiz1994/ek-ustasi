/* global jest */
/* Native audio has no Jest implementation: a recording fake keeps sound code testable. */
jest.mock('expo-audio', () => {
  const players = [];
  return {
    __players: players,
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    createAudioPlayer: jest.fn((source) => {
      const p = {
        source,
        volume: 1,
        loop: false,
        play: jest.fn(),
        pause: jest.fn(),
        seekTo: jest.fn(() => Promise.resolve()),
      };
      players.push(p);
      return p;
    }),
  };
});
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    getProducts: jest.fn(() => Promise.resolve([])),
    purchaseStoreProduct: jest.fn(),
    restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
  },
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'NON_SUBSCRIPTION' },
}));
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({ initialize: jest.fn(() => Promise.resolve()) }),
  AdsConsent: {
    gatherConsent: jest.fn(() => Promise.resolve({ canRequestAds: true })),
    getUserChoices: jest.fn(() => Promise.resolve({ selectPersonalisedAds: false })),
  },
  RewardedAd: { createForAdRequest: jest.fn() },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned' },
  AdEventType: { CLOSED: 'closed', ERROR: 'error' },
  TestIds: { REWARDED: 'test-rewarded' },
}));
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
}));
