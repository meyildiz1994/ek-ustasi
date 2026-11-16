/** End-of-level card: stars, coins earned, score and the next-level button (spec §4.6). */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { LevelResult } from '@/store/game';
import { t } from '@/i18n';
import { mascot, ui } from '@/theme/images';
import { palette } from '@/theme/palette';

interface Props {
  result: LevelResult;
  onNext: () => void;
}

export function LevelComplete({ result, onNext }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.card}>
        <Image source={mascot.cheer} style={styles.mascot} resizeMode="contain" />
        <Text style={styles.title} accessibilityRole="header">
          {t('play.complete')}
        </Text>
        <Text style={styles.stars} accessibilityLabel={`${result.stars} yıldız`}>
          {'★'.repeat(result.stars)}
          <Text style={styles.starsOff}>{'★'.repeat(3 - result.stars)}</Text>
        </Text>
        <Text style={styles.score}>{t('play.score', { n: result.score })}</Text>
        <View style={styles.coins}>
          <Image source={ui.coin} style={styles.coin} />
          <Text style={styles.coinText}>{t('play.earned', { n: result.coins })}</Text>
        </View>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          style={({ pressed }) => [styles.next, pressed && styles.pressed]}
        >
          <Text style={styles.nextText}>{t('play.next')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19,27,75,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: palette.cream,
    borderWidth: 4,
    borderColor: palette.turquoise,
    alignItems: 'center',
  },
  mascot: { width: 120, height: 120, marginTop: -84 },
  title: { fontSize: 30, fontWeight: '900', color: palette.navy, marginTop: 4 },
  stars: { fontSize: 44, color: palette.saffron, letterSpacing: 6, marginVertical: 6 },
  starsOff: { color: 'rgba(30,42,90,0.18)' },
  score: { fontSize: 16, color: palette.navy, fontWeight: '700' },
  coins: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  coin: { width: 30, height: 30, marginRight: 6 },
  coinText: { fontSize: 22, fontWeight: '900', color: palette.navy },
  next: {
    marginTop: 18,
    minHeight: 52,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  nextText: { color: '#fff', fontSize: 20, fontWeight: '900' },
});
