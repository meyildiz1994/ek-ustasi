/** Shop (spec §13.2): free coins from a rewarded ad, coin packs, the no-ads pack and restore. */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PRODUCTS, REWARDED, type ProductKey } from '../config/monetization';
import { t } from '@/i18n';
import { watchForReward } from '@/services/ads';
import { feedback } from '@/services/feedback';
import { loadProducts, purchase, restorePurchases, type ShopProduct } from '@/services/purchases';
import { useGame } from '@/store';
import { fonts } from '@/theme/fonts';
import { backgrounds, ui } from '@/theme/images';
import { palette } from '@/theme/palette';

const PACKS: { key: ProductKey; label: string }[] = [
  { key: 'coinsSmall', label: 'shop.small' },
  { key: 'coinsMedium', label: 'shop.medium' },
  { key: 'coinsLarge', label: 'shop.large' },
];

export default function ShopScreen() {
  const coins = useGame((s) => s.save.coins);
  const noAds = useGame((s) => s.save.noAds);
  // Recomputed on every store change (a reward updates the quota).
  const left = useGame((s) => s.rewardsLeft());
  const [products, setProducts] = useState<ShopProduct[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void loadProducts().then((p) => live && setProducts(p));
    return () => {
      live = false;
    };
  }, []);

  const price = (key: ProductKey) => products?.find((p) => p.key === key)?.price;
  const run = async (fn: () => Promise<string | null>) => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      setNote(await fn());
    } finally {
      setBusy(false);
    }
  };

  const watch = () =>
    run(async () => {
      const out = await watchForReward('coins');
      if (out === 'rewarded') {
        feedback.coin();
        return t('shop.rewarded', { n: REWARDED.coins });
      }
      if (out === 'limit') return t('shop.adsLimit');
      if (out === 'unavailable') return t('shop.adUnavailable');
      return null;
    });

  const buy = (key: ProductKey) =>
    run(async () => {
      const out = await purchase(key);
      if (out === 'done') {
        feedback.collect();
        return t('shop.thanks');
      }
      if (out === 'cancelled') return null;
      return t(out === 'unavailable' ? 'shop.unavailable' : 'shop.failed');
    });

  const restore = () =>
    run(async () => {
      const out = await restorePurchases();
      if (out === 'restored') return t('shop.restored');
      if (out === 'nothing') return t('shop.nothingToRestore');
      return t(out === 'unavailable' ? 'shop.unavailable' : 'shop.failed');
    });

  const storeOpen = (products?.length ?? 0) > 0;

  return (
    <ImageBackground source={backgrounds.home} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel={t('play.back')}
            style={styles.round}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t('shop.title')}
          </Text>
          <View style={styles.pill} accessibilityLabel={t('play.coins', { n: coins })}>
            <Image source={ui.coin} style={styles.coin} />
            <Text style={styles.pillText}>{coins}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('shop.freeTitle')}</Text>
            <Pressable
              onPress={watch}
              disabled={busy || left <= 0}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.btn,
                styles.btnFree,
                (busy || left <= 0) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnText}>
                {t(noAds ? 'shop.getFree' : 'shop.watchAd', { n: REWARDED.coins })}
              </Text>
            </Pressable>
            {noAds ? null : (
              <Text style={styles.small}>
                {left > 0 ? t('shop.adsLeft', { n: left }) : t('shop.adsLimit')}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('shop.packsTitle')}</Text>
            {products === null ? <ActivityIndicator color={palette.cobalt} /> : null}
            {PACKS.map(({ key, label }) => (
              <View key={key} style={styles.row}>
                <Image source={ui.coin} style={styles.packCoin} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{t(label)}</Text>
                  <Text style={styles.small}>
                    {t('shop.coinsAmount', { n: PRODUCTS[key].coins })}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void buy(key)}
                  disabled={busy || !price(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t(label)} ${price(key) ?? ''}`}
                  style={({ pressed }) => [
                    styles.btn,
                    (busy || !price(key)) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnText}>{price(key) ?? '—'}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={[styles.card, styles.noAds]}>
            <Text style={styles.cardTitle}>{t('shop.noAdsTitle')}</Text>
            {noAds ? (
              <Text style={styles.owned}>{t('shop.noAdsOwned')}</Text>
            ) : (
              <>
                <Text style={styles.body}>{t('shop.noAdsBody', { n: PRODUCTS.noAds.coins })}</Text>
                <Pressable
                  onPress={() => void buy('noAds')}
                  disabled={busy || !price('noAds')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnWide,
                    (busy || !price('noAds')) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnText}>
                    {t('shop.buy')}
                    {price('noAds') ? ` · ${price('noAds')}` : ''}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {products !== null && !storeOpen ? (
            <Text style={styles.warn}>{t('shop.unavailable')}</Text>
          ) : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}

          <Pressable onPress={() => void restore()} disabled={busy} accessibilityRole="button">
            <Text style={styles.link}>{t('shop.restore')}</Text>
          </Pressable>
          <Text style={styles.legal}>{t('shop.note')}</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  safe: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 28, marginTop: -3 },
  title: { color: '#fff', fontSize: 28, fontFamily: fonts.extraBold },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
  },
  coin: { width: 26, height: 26, marginRight: 6 },
  pillText: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.cream,
    borderWidth: 3,
    borderColor: palette.turquoise,
    gap: 10,
  },
  noAds: { borderColor: palette.saffron },
  cardTitle: { fontSize: 22, fontFamily: fonts.extraBold, color: palette.navy },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  packCoin: { width: 40, height: 40 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 18, fontFamily: fonts.bold, color: palette.navy },
  small: { fontSize: 14, fontFamily: fonts.medium, color: palette.cobalt },
  body: { fontSize: 16, fontFamily: fonts.medium, color: palette.navy },
  owned: { fontSize: 18, fontFamily: fonts.bold, color: palette.turquoise },
  btn: {
    minHeight: 46,
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: 23,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
  },
  btnFree: { backgroundColor: palette.saffron, borderBottomColor: '#B9781E' },
  btnWide: { alignSelf: 'stretch' },
  btnText: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.96 }] },
  warn: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.bold,
    textAlign: 'center',
    backgroundColor: 'rgba(200,50,60,0.85)',
    padding: 10,
    borderRadius: 14,
  },
  note: {
    color: palette.navy,
    fontSize: 16,
    fontFamily: fonts.bold,
    textAlign: 'center',
    backgroundColor: palette.cream,
    padding: 10,
    borderRadius: 14,
  },
  link: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
    textAlign: 'center',
    textDecorationLine: 'underline',
    padding: 8,
  },
  legal: { color: palette.cream, fontSize: 12, fontFamily: fonts.medium, textAlign: 'center' },
});
