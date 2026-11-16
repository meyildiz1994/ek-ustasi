/** Current-word bubble above the wheel; shakes 400 ms on an invalid word (spec §12). */
import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

export type BubbleTone = 'normal' | 'already' | 'bonus' | 'error';

export interface BubbleHandle {
  shake(): void;
}

interface Props {
  text: string;
  tone: BubbleTone;
}

export const PreviewBubble = forwardRef<BubbleHandle, Props>(function PreviewBubble(
  { text, tone },
  ref,
) {
  const x = useSharedValue(0);
  useImperativeHandle(ref, () => ({
    shake: () => {
      x.value = withSequence(
        ...[10, -10, 8, -8, 5, -5, 0].map((v) => withTiming(v, { duration: 57 })),
      );
    },
  }));
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  if (text === '') return <Animated.View style={styles.placeholder} />;
  return (
    <Animated.View style={[styles.bubble, toneStyle[tone], anim]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{trUpper(text)}</Text>
    </Animated.View>
  );
});

const toneStyle = StyleSheet.create({
  normal: { backgroundColor: palette.selection },
  already: { backgroundColor: palette.saffron },
  bonus: { backgroundColor: palette.cobalt },
  error: { backgroundColor: palette.pomegranate },
});

const styles = StyleSheet.create({
  placeholder: { height: 44 },
  bubble: {
    height: 44,
    minWidth: 60,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 3 },
});
