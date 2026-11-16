/**
 * Letter wheel (spec §4.1): drag across letters; the selection is drawn as a thick, round-capped
 * Skia line that follows the finger. Path logic lives in src/game/wheel.ts.
 */
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { dragPath, HIT_FACTOR, wheelPositions, type Point } from '@/game/wheel';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';
import { ui } from '@/theme/images';
import { trUpper } from '@/utils/tr';

interface Props {
  /** Letters (or suffix-card labels in card mode) in wheel order. */
  letters: string[];
  /** Card mode (Ek Turu): suffix chips on the outer ring, with a small category line. */
  subs?: string[];
  /** Index pulsed by the Ek hint. */
  highlighted?: number | null;
  size: number;
  onChange: (path: number[]) => void;
  onRelease: (path: number[]) => void;
}

export function Wheel({ letters, subs, highlighted, size, onChange, onRelease }: Props) {
  const cards = subs !== undefined;
  const c = size / 2;
  // Letters sit on the plate's plain inner ring, clear of the rim ornaments.
  const letterR = cards
    ? size * (letters.length > 10 ? 0.082 : 0.092)
    : size * (letters.length > 6 ? 0.085 : letters.length > 5 ? 0.095 : 0.11);
  const positions = useMemo(
    () => wheelPositions(letters.length, c, c, size * (cards ? 0.355 : 0.235)),
    [letters.length, c, size, cards],
  );
  const [path, setPath] = useState<number[]>([]);
  const [finger, setFinger] = useState<Point | null>(null);
  // Drag state read by the gesture callbacks (JS thread, never during render).
  const last = useRef<Point | null>(null);
  const current = useRef<number[]>([]);

  const update = (next: number[]) => {
    if (next !== current.current) {
      current.current = next;
      setPath(next);
      onChange(next);
    }
  };

  const gesture = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => {
      const p = { x: e.x, y: e.y };
      last.current = p;
      current.current = [];
      update(dragPath([], positions, p, p, letterR * HIT_FACTOR));
      setFinger(p);
    },
    onUpdate: (e) => {
      if (!('x' in e)) return;
      const p = { x: e.x, y: e.y };
      update(dragPath(current.current, positions, last.current ?? p, p, letterR * HIT_FACTOR));
      last.current = p;
      setFinger(p);
    },
    onFinalize: () => {
      const done = current.current;
      current.current = [];
      last.current = null;
      setPath([]);
      setFinger(null);
      onChange([]);
      if (done.length > 0) onRelease(done);
    },
  });

  const line = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    path.forEach((i, k) => {
      const q = positions[i] as Point;
      if (k === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    });
    if (path.length > 0 && finger) p.lineTo(finger.x, finger.y);
    return p.detach();
  }, [path, finger, positions]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: size, height: size }} accessibilityLabel="Harf çarkı">
        <Image
          source={ui.wheelPlate}
          style={[styles.plate, { width: size, height: size }]}
          resizeMode="contain"
        />
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path
            path={line}
            style="stroke"
            strokeWidth={letterR * 0.42}
            strokeCap="round"
            strokeJoin="round"
            color={palette.selection}
          />
        </Canvas>
        {letters.map((ch, i) => {
          const q = positions[i] as Point;
          const on = path.includes(i);
          const w = cards ? letterR * 2.5 : letterR * 2;
          const h = cards ? letterR * 1.9 : letterR * 2;
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.letter,
                { left: q.x - w / 2, top: q.y - h / 2, width: w, height: h, borderRadius: h / 2 },
                cards && styles.card,
                cards && highlighted === i && styles.cardHint,
                on && styles.letterOn,
              ]}
            >
              <Text
                style={[
                  styles.letterText,
                  { fontSize: cards ? letterR * 0.78 : letterR * 1.4 },
                  on && styles.letterTextOn,
                ]}
                numberOfLines={1}
              >
                {cards ? ch : trUpper(ch)}
              </Text>
              {cards ? (
                <Text style={[styles.sub, { fontSize: letterR * 0.38 }, on && styles.letterTextOn]}>
                  {subs?.[i]}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  plate: { position: 'absolute', left: 0, top: 0 },
  letter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  letterOn: { backgroundColor: palette.selection },
  letterText: { color: palette.navy, fontFamily: fonts.extraBold },
  letterTextOn: { color: '#fff' },
  card: {
    backgroundColor: palette.cream,
    borderWidth: 2,
    borderColor: palette.cobalt,
  },
  cardHint: { borderColor: palette.saffron, borderWidth: 4 },
  sub: { color: palette.cobalt, fontFamily: fonts.medium, marginTop: -4 },
});
