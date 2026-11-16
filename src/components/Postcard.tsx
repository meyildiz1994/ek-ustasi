/** Postcard reward when a stop is finished (spec §10): the stop's scene with a caption, shareable. */
import { useCanvasRef } from '@shopify/react-native-skia';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { placeAblative } from '@/game/stops';
import { t } from '@/i18n';
import { engine } from '@/services/morph';
import type { StopInfo } from '@/services/levels';
import { canShare, shareSnapshot } from '@/services/share';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';
import { scenePhoto } from '@/theme/scenes';

import { Scene } from './Scene';

interface Props {
  stop: StopInfo;
  onClose: () => void;
}

export function Postcard({ stop, onClose }: Props) {
  const { width } = useWindowDimensions();
  const w = Math.min(width - 48, 360);
  const h = Math.round(w * 1.25);
  const canvas = useCanvasRef();
  const share = () => {
    if (canvas.current)
      void shareSnapshot(canvas.current, stop.id, t('postcard.shareText', { name: stop.name }));
  };
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <Text style={styles.heading} accessibilityRole="header">
        {t('postcard.title')}
      </Text>
      <Animated.View entering={ZoomIn.springify()} style={styles.card}>
        <Scene
          ref={canvas}
          stop={stop}
          photo={scenePhoto(stop.index)}
          width={w}
          height={h}
          caption={{
            title: stop.name,
            sub: t('postcard.from', { place: placeAblative(engine, stop.name) }),
          }}
        />
        <Text style={styles.intro}>{stop.intro}</Text>
      </Animated.View>
      <View style={styles.row}>
        {canShare ? (
          <Pressable onPress={share} accessibilityRole="button" style={[styles.btn, styles.share]}>
            <Text style={styles.btnText}>{t('postcard.share')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.btn}>
          <Text style={styles.btnText}>{t('postcard.continue')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19,27,75,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  heading: { color: palette.saffron, fontFamily: fonts.extraBold, fontSize: 28, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 8,
    paddingBottom: 12,
    borderRadius: 10,
    transform: [{ rotate: '-2deg' }],
    alignItems: 'center',
  },
  intro: {
    maxWidth: 340,
    marginTop: 8,
    color: palette.navy,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: {
    minHeight: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  share: { backgroundColor: palette.cobalt },
  btnText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 19 },
});
