/**
 * Web build = browser preview only (no store). Purchases are simulated so the shop can be tried:
 * prices are fixed sample prices marked "deneme", and a purchase pays at once with a fake
 * transaction id. Nothing is charged; real builds use purchases.ts (RevenueCat).
 */
import type { ProductKey } from '../../config/monetization';
import { gameStore } from '../store';

export interface ShopProduct {
  key: ProductKey;
  price: string;
}
export type PurchaseOutcome = 'done' | 'cancelled' | 'failed' | 'unavailable';

const SAMPLE: Record<ProductKey, string> = {
  coinsSmall: '₺49,99',
  coinsMedium: '₺99,99',
  coinsLarge: '₺199,99',
  noAds: '₺149,99',
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const initPurchases = async (): Promise<boolean> => true;

export const loadProducts = async (): Promise<ShopProduct[]> =>
  (Object.keys(SAMPLE) as ProductKey[]).map((key) => ({ key, price: `${SAMPLE[key]} (deneme)` }));

export async function purchase(key: ProductKey): Promise<PurchaseOutcome> {
  await wait(600);
  gameStore.getState().grantPurchase(key, `web-demo-${key}-${Date.now()}`);
  return 'done';
}

export async function restorePurchases(): Promise<
  'restored' | 'nothing' | 'failed' | 'unavailable'
> {
  await wait(400);
  return gameStore.getState().save.noAds ? 'restored' : 'nothing';
}
