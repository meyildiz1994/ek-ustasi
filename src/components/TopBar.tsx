/** Coins · stop + level · bonus counter (spec §2). */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { ui } from '@/theme/images';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

interface Props {
  coins: number;
  stopName: string;
  level: number;
  bonus: number;
  onBack: () => void;
  /** Coin pill → shop. */
  onCoins?: () => void;
}

export function TopBar({ coins, stopName, level, bonus, onBack, onCoins }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('play.back')}
          style={[styles.pill, styles.backPill]}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Pressable
          onPress={onCoins}
          disabled={!onCoins}
          accessibilityRole="button"
          accessibilityLabel={`${t('play.coins', { n: coins })}, ${t('play.shop')}`}
          style={styles.pill}
        >
          <Image source={ui.coin} style={styles.icon} />
          <Text style={styles.value}>{coins}</Text>
          {onCoins ? <Text style={styles.plus}>+</Text> : null}
        </Pressable>
      </View>
      <View style={styles.center}>
        <Text style={styles.stop}>{trUpper(stopName)}</Text>
        <Text style={styles.level}>{t('play.level', { n: level })}</Text>
      </View>
      <View style={styles.pill} accessibilityLabel={t('play.bonus', { n: bonus })}>
        <Image source={ui.bonusStar} style={styles.icon} />
        <Text style={styles.value}>{bonus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
  },
  left: { flexDirection: 'row', gap: 6 },
  backPill: { width: 44, justifyContent: 'center', paddingHorizontal: 0 },
  back: { color: '#fff', fontSize: 26, marginTop: -3 },
  plus: {
    color: palette.navy,
    backgroundColor: palette.saffron,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 6,
    overflow: 'hidden',
    fontFamily: fonts.extraBold,
  },
  icon: { width: 28, height: 28, marginRight: 4 },
  value: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
  center: { alignItems: 'center' },
  stop: {
    color: '#fff',
    fontSize: 21,
    fontFamily: fonts.extraBold,
    letterSpacing: 1.5,
    textShadowColor: palette.navy,
    textShadowRadius: 6,
  },
  level: { color: palette.cream, fontSize: 15, fontFamily: fonts.bold },
});
