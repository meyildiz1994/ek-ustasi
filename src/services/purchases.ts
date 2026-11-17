/**
 * In-app purchases through RevenueCat (spec §13.2): receipts are validated on RevenueCat's servers;
 * the game only pays out what the SDK reports as a completed transaction, once per transaction id.
 * Without an SDK key (local builds, Expo Go) the shop shows that purchases are unavailable.
 */
import { Platform } from 'react-native';
import Purchases, { PRODUCT_CATEGORY, type PurchasesStoreProduct } from 'react-native-purchases';

import {
  NO_ADS_ENTITLEMENT,
  PRODUCTS,
  REVENUECAT_KEYS,
  type ProductKey,
} from '../../config/monetization';
import { gameStore } from '../store';

export interface ShopProduct {
  key: ProductKey;
  /** Localised store price, e.g. "₺49,99". */
  price: string;
}

export type PurchaseOutcome = 'done' | 'cancelled' | 'failed' | 'unavailable';

let configured: Promise<boolean> | null = null;
const products = new Map<ProductKey, PurchasesStoreProduct>();

const keyFor = () => (Platform.OS === 'ios' ? REVENUECAT_KEYS.ios : REVENUECAT_KEYS.android);
const keyOf = (id: string) =>
  (Object.keys(PRODUCTS) as ProductKey[]).find((k) => PRODUCTS[k].id === id);

function syncEntitlement(info: { entitlements: { active: Record<string, unknown> } }) {
  gameStore.getState().setNoAds(NO_ADS_ENTITLEMENT in info.entitlements.active);
}

/** Configures the SDK once. Resolves false when purchases cannot work on this build. */
export function initPurchases(): Promise<boolean> {
  configured ??= (async () => {
    const apiKey = keyFor();
    if (!apiKey) return false;
    try {
      Purchases.configure({ apiKey });
      Purchases.addCustomerInfoUpdateListener(syncEntitlement);
      return true;
    } catch {
      return false;
    }
  })();
  return configured;
}

export async function loadProducts(): Promise<ShopProduct[]> {
  if (!(await initPurchases())) return [];
  try {
    const ids = Object.values(PRODUCTS).map((p) => p.id);
    const list = await Purchases.getProducts(ids, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    const out: ShopProduct[] = [];
    for (const p of list) {
      const key = keyOf(p.identifier);
      if (!key) continue;
      products.set(key, p);
      out.push({ key, price: p.priceString });
    }
    return out;
  } catch {
    return [];
  }
}

export async function purchase(key: ProductKey): Promise<PurchaseOutcome> {
  if (!(await initPurchases())) return 'unavailable';
  const product = products.get(key);
  if (!product) return 'unavailable';
  try {
    const res = await Purchases.purchaseStoreProduct(product);
    const tx = res.transaction?.transactionIdentifier ?? `${res.productIdentifier}:${Date.now()}`;
    gameStore.getState().grantPurchase(key, tx);
    syncEntitlement(res.customerInfo);
    return 'done';
  } catch (e) {
    return (e as { userCancelled?: boolean | null }).userCancelled ? 'cancelled' : 'failed';
  }
}

/** "Satın alımları geri yükle" (required by the stores): re-reads entitlements. */
export async function restorePurchases(): Promise<
  'restored' | 'nothing' | 'failed' | 'unavailable'
> {
  if (!(await initPurchases())) return 'unavailable';
  try {
    const info = await Purchases.restorePurchases();
    syncEntitlement(info);
    return NO_ADS_ENTITLEMENT in info.entitlements.active ? 'restored' : 'nothing';
  } catch {
    return 'failed';
  }
}
