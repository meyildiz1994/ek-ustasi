/** Crossword grid (spec §4.2): tiles fill in reading order, 80 ms apart, with a small pop. */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { CellKey, GridModel } from '@/game/grid';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

export const FILL_STAGGER_MS = 80;

interface Props {
  model: GridModel;
  visible: ReadonlySet<CellKey>;
  /** Delay (ms) per cell for the fill animation of newly visible cells. */
  delays: ReadonlyMap<CellKey, number>;
  width: number;
  height: number;
  picking?: boolean;
  onCellPress?: (key: CellKey) => void;
}

function Cell({
  letter,
  shown,
  delay,
  size,
  onPress,
}: {
  letter: string;
  shown: boolean;
  delay: number | undefined;
  size: number;
  onPress: (() => void) | undefined;
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (shown && delay !== undefined) {
      scale.value = withDelay(
        delay,
        withSequence(withTiming(1.22, { duration: 110 }), withTiming(1, { duration: 130 })),
      );
      rotate.value = withDelay(
        delay,
        withSequence(withTiming(6, { duration: 110 }), withTiming(0, { duration: 130 })),
      );
    }
  }, [shown, delay, scale, rotate]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const body = (
    <Animated.View
      style={[
        styles.cell,
        { width: size - 3, height: size - 3, borderRadius: size * 0.18 },
        shown ? styles.cellShown : styles.cellHidden,
        anim,
      ]}
    >
      {shown ? (
        <Text style={[styles.letter, { fontSize: size * 0.64 }]}>{trUpper(letter)}</Text>
      ) : null}
    </Animated.View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Kutu">
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function Grid({ model, visible, delays, width, height, picking, onCellPress }: Props) {
  const size = Math.min(56, Math.floor(Math.min(width / model.cols, height / model.rows)));
  return (
    <View
      style={{ width: size * model.cols, height: size * model.rows }}
      accessibilityLabel={`${model.words.length} kelimelik bulmaca`}
    >
      {[...model.cells.values()].map((cell) => {
        const shown = visible.has(cell.key);
        return (
          <View
            key={cell.key}
            style={{ position: 'absolute', left: cell.c * size, top: cell.r * size }}
          >
            <Cell
              letter={cell.letter}
              shown={shown}
              delay={delays.get(cell.key)}
              size={size}
              onPress={picking && !shown && onCellPress ? () => onCellPress(cell.key) : undefined}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cellHidden: { backgroundColor: 'rgba(255,244,224,0.85)', borderColor: 'rgba(30,42,90,0.25)' },
  cellShown: { backgroundColor: palette.turquoise, borderColor: palette.navy },
  letter: { color: '#fff', fontFamily: fonts.extraBold },
});
