/** Coins · stop + level · bonus counter (spec §2). */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { ui } from '@/theme/images';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

interface Props {
  coins: number;
  stopName: string;
  level: number;
  bonus: number;
  onBack: () => void;
}

export function TopBar({ coins, stopName, level, bonus, onBack }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('play.back')}
        style={styles.pill}
      >
        <Text style={styles.back}>‹</Text>
        <Image source={ui.coin} style={styles.icon} />
        <Text style={styles.value} accessibilityLabel={t('play.coins', { n: coins })}>
          {coins}
        </Text>
      </Pressable>
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
  back: { color: '#fff', fontSize: 26, marginRight: 4, marginTop: -3 },
  icon: { width: 28, height: 28, marginRight: 4 },
  value: { color: '#fff', fontSize: 17, fontWeight: '800' },
  center: { alignItems: 'center' },
  stop: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: palette.navy,
    textShadowRadius: 6,
  },
  level: { color: palette.cream, fontSize: 14, fontWeight: '700' },
});
