/** One-screen tutorial card, shown the first time a rule comes up (spec §5.4). */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import type { EkTip } from '@/game/ekturu';
import { t } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';

const SEGMENT_COLORS = [palette.cobalt, palette.turquoise, palette.saffron, palette.pomegranate];

/** "kalem|lik · kitap|lık" → chips, one colour per morpheme, one row per example. */
function Example({ text }: { text: string }) {
  return (
    <View style={styles.examples}>
      {text.split(' · ').map((ex) => (
        <View key={ex} style={styles.example}>
          {ex.split('|').map((m, i) => (
            <Text
              key={i}
              style={[styles.seg, { backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }]}
            >
              {m}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function TipCard({ tip, onClose }: { tip: EkTip; onClose: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
      <Animated.View entering={SlideInDown.springify()} style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {t(`tips.${tip}.title`)}
        </Text>
        <Example text={t(`tips.${tip}.example`)} />
        <Text style={styles.body}>{t(`tips.${tip}.body`)}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>{t('ek.gotIt')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19,27,75,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: palette.cobalt,
    padding: 20,
    alignItems: 'center',
  },
  title: { fontFamily: fonts.extraBold, fontSize: 24, color: palette.navy },
  examples: { gap: 6, marginVertical: 12, alignItems: 'center' },
  example: { flexDirection: 'row', gap: 2 },
  seg: {
    color: '#fff',
    fontFamily: fonts.extraBold,
    fontSize: 22,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    color: palette.navy,
    textAlign: 'center',
  },
  btn: {
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: palette.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  btnText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 19 },
});
