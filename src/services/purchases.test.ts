jest.mock('@/store', () => {
  const state = { grantPurchase: jest.fn(() => true), setNoAds: jest.fn() };
  return { gameStore: { getState: () => state } };
});

type Mod = typeof import('./purchases');
const load = (key: string) => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_RC_IOS_KEY = key;
  process.env.EXPO_PUBLIC_RC_ANDROID_KEY = key;
  /* eslint-disable @typescript-eslint/no-require-imports */
  const mod = require('./purchases') as Mod;
  const rc = require('react-native-purchases').default as Record<string, jest.Mock>;
  const store = require('@/store').gameStore.getState() as Record<string, jest.Mock>;
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { mod, rc, store };
};

describe('purchases', () => {
  it('is unavailable without an SDK key', async () => {
    const { mod } = load('');
    expect(await mod.loadProducts()).toEqual([]);
    expect(await mod.purchase('coinsSmall')).toBe('unavailable');
    expect(await mod.restorePurchases()).toBe('unavailable');
  });

  it('loads prices, pays a completed purchase once and syncs no-ads', async () => {
    const { mod, rc, store } = load('appl_test');
    const product = { identifier: 'ek_ustasi_coins_small', priceString: '₺49,99' };
    rc.getProducts!.mockResolvedValueOnce([product, { identifier: 'other', priceString: 'x' }]);
    expect(await mod.loadProducts()).toEqual([{ key: 'coinsSmall', price: '₺49,99' }]);

    rc.purchaseStoreProduct!.mockResolvedValueOnce({
      productIdentifier: product.identifier,
      transaction: { transactionIdentifier: 'T1' },
      customerInfo: { entitlements: { active: {} } },
    });
    expect(await mod.purchase('coinsSmall')).toBe('done');
    expect(store.grantPurchase).toHaveBeenCalledWith('coinsSmall', 'T1');
    expect(store.setNoAds).toHaveBeenLastCalledWith(false);

    rc.purchaseStoreProduct!.mockRejectedValueOnce({ userCancelled: true });
    expect(await mod.purchase('coinsSmall')).toBe('cancelled');
    rc.purchaseStoreProduct!.mockRejectedValueOnce(new Error('network'));
    expect(await mod.purchase('coinsSmall')).toBe('failed');
    expect(await mod.purchase('noAds')).toBe('unavailable'); // price never loaded

    rc.restorePurchases!.mockResolvedValueOnce({ entitlements: { active: { no_ads: {} } } });
    expect(await mod.restorePurchases()).toBe('restored');
    expect(store.setNoAds).toHaveBeenLastCalledWith(true);
    rc.restorePurchases!.mockRejectedValueOnce(new Error('x'));
    expect(await mod.restorePurchases()).toBe('failed');
  });
});
