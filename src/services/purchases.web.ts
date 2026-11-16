/** Web build (previews only): there is no store, so the shop shows purchases as unavailable. */
import type { ProductKey } from '../../config/monetization';

export interface ShopProduct {
  key: ProductKey;
  price: string;
}
export type PurchaseOutcome = 'done' | 'cancelled' | 'failed' | 'unavailable';

export const initPurchases = async (): Promise<boolean> => false;
export const loadProducts = async (): Promise<ShopProduct[]> => [];
export const purchase = async (_key: ProductKey): Promise<PurchaseOutcome> => 'unavailable';
export const restorePurchases = async (): Promise<
  'restored' | 'nothing' | 'failed' | 'unavailable'
> => 'unavailable';
