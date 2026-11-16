/** Shown when the player reaches a new stop: its scene, name and one-sentence introduction. */
import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { t } from '@/i18n';
import type { StopInfo } from '@/services/levels';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

import { Scene } from './Scene';

export function StopIntro({ stop, onStart }: { stop: StopInfo; onStart: () => void }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width - 48, 340);
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <Animated.View entering={SlideInDown.springify()} style={styles.card}>
        <Text style={styles.kicker}>
          {t('stop.welcome')} · {t('map.stop', { n: stop.index })}
        </Text>
        <Text style={styles.name} accessibilityRole="header">
          {trUpper(stop.name)}
        </Text>
        <Scene stop={stop} width={w} height={Math.round(w * 0.75)} />
        <Text style={styles.intro}>{stop.intro}</Text>
        <Pressable onPress={onStart} accessibilityRole="button" style={styles.btn}>
          <Text style={styles.btnText}>{t('stop.start')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19,27,75,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.turquoise,
    overflow: 'hidden',
  },
  kicker: { color: palette.cobalt, fontFamily: fonts.bold, fontSize: 15 },
  name: { color: palette.navy, fontFamily: fonts.extraBold, fontSize: 30, letterSpacing: 1.5 },
  intro: {
    maxWidth: 320,
    marginTop: 10,
    color: palette.navy,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  btn: {
    marginTop: 14,
    minHeight: 52,
    paddingHorizontal: 32,
    borderRadius: 26,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 20 },
});
