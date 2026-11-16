/** Shown when a helper costs more than the player has: a free hint or coins from a rewarded ad. */
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { REWARDED } from '../../config/monetization';
import { t } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';

interface Props {
  noAds: boolean;
  /** Rewarded ads left today. */
  left: number;
  busy: boolean;
  onFreeHint: () => void;
  onCoins: () => void;
  onShop: () => void;
  onClose: () => void;
}

export function OutOfCoins({ noAds, left, busy, onFreeHint, onCoins, onShop, onClose }: Props) {
  const can = left > 0 && !busy;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title} accessibilityRole="header">
            {t('outOfCoins.title')}
          </Text>
          <Pressable
            onPress={onFreeHint}
            disabled={!can}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.btn,
              styles.gold,
              !can && styles.off,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.btnText}>
              {t(noAds ? 'outOfCoins.freeHintNoAds' : 'outOfCoins.freeHint')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onCoins}
            disabled={!can}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, !can && styles.off, pressed && styles.pressed]}
          >
            <Text style={styles.btnText}>
              {t(noAds ? 'outOfCoins.coinsNoAds' : 'outOfCoins.coins', { n: REWARDED.coins })}
            </Text>
          </Pressable>
          {left > 0 ? null : <Text style={styles.small}>{t('shop.adsLimit')}</Text>}
          <Pressable
            onPress={onShop}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.navy, pressed && styles.pressed]}
          >
            <Text style={styles.btnText}>{t('outOfCoins.shop')}</Text>
          </Pressable>
          <Pressable onPress={onClose} accessibilityRole="button">
            <Text style={styles.close}>{t('outOfCoins.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19,27,75,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 310,
    padding: 20,
    borderRadius: 28,
    backgroundColor: palette.cream,
    borderWidth: 4,
    borderColor: palette.turquoise,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: palette.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  btn: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
    paddingHorizontal: 12,
  },
  gold: { backgroundColor: palette.saffron, borderBottomColor: '#B9781E' },
  navy: { backgroundColor: palette.cobalt, borderBottomColor: palette.navy },
  off: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.96 }] },
  btnText: { color: '#fff', fontSize: 18, fontFamily: fonts.extraBold },
  small: { fontSize: 14, fontFamily: fonts.medium, color: palette.cobalt, textAlign: 'center' },
  close: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: palette.cobalt,
    textAlign: 'center',
    marginTop: 4,
  },
});
