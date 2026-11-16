/** End-of-level card: stars, coins earned, score and the next-level button (spec §4.6). */
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { BounceIn, FadeIn, ZoomIn } from 'react-native-reanimated';

import { completeTimeline, STAR_AT, STAR_GAP } from '@/game/feel';
import type { LevelResult } from '@/store/game';
import { t } from '@/i18n';
import { feedback } from '@/services/feedback';
import { fonts } from '@/theme/fonts';
import { mascot, ui } from '@/theme/images';
import { palette } from '@/theme/palette';

import { Confetti } from './Effects';

interface Props {
  result: LevelResult;
  /** The level has an Ek Turu: the button opens it instead of the next level. */
  ekTuru?: boolean;
  onNext: () => void;
}

export function LevelComplete({ result, ekTuru, onNext }: Props) {
  useEffect(() => {
    const ids = completeTimeline(result.stars, result.coins).map(([ms, ev]) =>
      setTimeout(() => feedback[ev](), ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [result.stars, result.coins]);

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <Confetti seed={result.score + result.stars} />
      <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.card}>
        <Image source={mascot.cheer} style={styles.mascot} resizeMode="contain" />
        <Text style={styles.title} accessibilityRole="header">
          {t('play.complete')}
        </Text>
        <View style={styles.starRow} accessibilityLabel={`${result.stars} yıldız`}>
          {[0, 1, 2].map((k) =>
            k < result.stars ? (
              <Animated.Text
                key={k}
                entering={BounceIn.delay(STAR_AT + k * STAR_GAP).duration(420)}
                style={styles.star}
              >
                ★
              </Animated.Text>
            ) : (
              <Text key={k} style={[styles.star, styles.starsOff]}>
                ★
              </Text>
            ),
          )}
        </View>
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
          <Text style={styles.nextText}>{t(ekTuru ? 'play.toEkTuru' : 'play.next')}</Text>
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
  title: { fontSize: 30, fontFamily: fonts.extraBold, color: palette.navy, marginTop: 4 },
  starRow: { flexDirection: 'row', gap: 6, marginVertical: 6 },
  star: { fontSize: 44, color: palette.saffron },
  starsOff: { color: 'rgba(30,42,90,0.18)' },
  score: { fontSize: 18, color: palette.navy, fontFamily: fonts.bold },
  coins: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  coin: { width: 30, height: 30, marginRight: 6 },
  coinText: { fontSize: 22, fontFamily: fonts.extraBold, color: palette.navy },
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
  nextText: { color: '#fff', fontSize: 20, fontFamily: fonts.extraBold },
});
