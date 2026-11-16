/** Small celebration effects (spec §12): confetti on level end, a star flying to the bonus counter. */
import { Canvas, Path, Skia, useClock } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ui } from '@/theme/images';
import { palette } from '@/theme/palette';
import { createRng } from '@/utils/rng';

const CONFETTI_COLORS = [palette.pomegranate, palette.saffron, palette.turquoise, palette.cobalt];
const PIECES = 90;
const FALL_MS = 2600;

interface Piece {
  x: number;
  delay: number;
  speed: number;
  sway: number;
  phase: number;
  spin: number;
  size: number;
}

/** Paper confetti falling once over the screen; one Skia path per colour, rebuilt every frame. */
export function Confetti({ seed = 1 }: { seed?: number }) {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const groups = useMemo(() => {
    const r = createRng(seed);
    const gs: Piece[][] = CONFETTI_COLORS.map(() => []);
    for (let i = 0; i < PIECES; i++) {
      gs[i % gs.length]!.push({
        x: r.next() * width,
        delay: r.next() * 600,
        speed: 0.8 + r.next() * 0.6,
        sway: 10 + r.next() * 30,
        phase: r.next() * 6.28,
        spin: 2 + r.next() * 6,
        size: 6 + r.next() * 6,
      });
    }
    return gs;
  }, [seed, width]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {groups.map((pieces, i) => (
        <ConfettiGroup
          key={i}
          pieces={pieces}
          color={CONFETTI_COLORS[i] as string}
          clock={clock}
          height={height}
        />
      ))}
    </Canvas>
  );
}

function ConfettiGroup({
  pieces,
  color,
  clock,
  height,
}: {
  pieces: Piece[];
  color: string;
  clock: SharedValue<number>;
  height: number;
}) {
  const path = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    const t = clock.value;
    for (const c of pieces) {
      const k = (t - c.delay) / FALL_MS;
      if (k < 0 || k > 1.2) continue;
      const y = -20 + k * c.speed * (height + 40);
      const x = c.x + Math.sin(c.phase + k * 6) * c.sway;
      const a = c.phase + k * c.spin;
      const w = Math.max(1, c.size * Math.abs(Math.cos(a)));
      const h = c.size * 0.6;
      p.addRect(Skia.XYWHRect(x - w / 2, y - h / 2, w, h));
    }
    return p.detach();
  });
  return <Path path={path} color={color} />;
}

/** A bonus star flies from the preview bubble to the bonus counter (top right). */
export function FlyingStar() {
  const { width, height } = useWindowDimensions();
  const k = useSharedValue(0);
  useEffect(() => {
    k.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) });
  }, [k]);
  const style = useAnimatedStyle(() => {
    const x0 = width / 2 - 24;
    const y0 = height * 0.55;
    const x1 = width - 70;
    const y1 = 18;
    // Arc upwards: quadratic Bézier through a control point above the start.
    const cx = width * 0.7;
    const cy = height * 0.2;
    const t = k.value;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1.6 - t },
        { rotate: `${t * 360}deg` },
      ],
      opacity: t < 0.95 ? 1 : (1 - t) * 20,
    };
  });
  return <Animated.Image source={ui.bonusStar} style={[styles.star, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  star: { position: 'absolute', left: 0, top: 0, width: 48, height: 48 },
});
