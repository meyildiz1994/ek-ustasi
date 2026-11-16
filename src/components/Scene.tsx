/** Draws a stop's procedural scene with Skia (spec §10). Shapes come from src/scenes/scene.ts. */
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Shadow,
  Skia,
  Text as SkText,
  useFont,
  vec,
  type CanvasRef,
  type SkPath,
} from '@shopify/react-native-skia';
import { forwardRef, useMemo } from 'react';

import { buildScene, type SceneRecipe } from '@/scenes/scene';
import { fontFiles } from '@/theme/fonts';

interface Props {
  stop: SceneRecipe;
  width: number;
  height: number;
  /** Greyed out (locked stop on the map). */
  muted?: boolean;
  /** Postcard caption drawn into the image (so a shared snapshot carries it). */
  caption?: { title: string; sub: string };
}

type Drawn =
  | { kind: 'sky'; colors: string[] }
  | { kind: 'fill'; path: SkPath; color: string; opacity: number; shadow: boolean }
  | { kind: 'stroke'; path: SkPath; color: string; width: number; opacity: number };

export const Scene = forwardRef<CanvasRef, Props>(function Scene(
  { stop, width, height, muted, caption },
  ref,
) {
  const titleFont = useFont(fontFiles['Baloo2-ExtraBold'], Math.round(height * 0.1));
  const subFont = useFont(fontFiles['Baloo2-Bold'], Math.round(height * 0.055));
  const drawn = useMemo(() => {
    const out: Drawn[] = [];
    for (const op of buildScene(stop, width, height)) {
      if (op.kind === 'sky') {
        out.push(op);
        continue;
      }
      const path = Skia.Path.MakeFromSVGString(op.d);
      if (!path) continue;
      out.push(
        op.kind === 'fill'
          ? {
              kind: 'fill',
              path,
              color: op.color,
              opacity: op.opacity ?? 1,
              shadow: op.shadow === true,
            }
          : { kind: 'stroke', path, color: op.color, width: op.width, opacity: op.opacity ?? 1 },
      );
    }
    return out;
  }, [stop, width, height]);
  const shadow = Math.max(1, width / 160);

  return (
    <Canvas ref={ref} style={{ width, height }} pointerEvents="none">
      <Group opacity={muted ? 0.35 : 1}>
        {drawn.map((d, i) => {
          if (d.kind === 'sky') {
            return (
              <Rect key={i} x={0} y={0} width={width} height={height}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, height)}
                  colors={d.colors}
                  positions={d.colors.map((_, k) => (k / (d.colors.length - 1)) * 0.7)}
                />
              </Rect>
            );
          }
          if (d.kind === 'fill') {
            return (
              <Path key={i} path={d.path} color={d.color} opacity={d.opacity}>
                {d.shadow ? (
                  <Shadow dx={0} dy={shadow} blur={shadow} color="rgba(0,0,0,0.28)" />
                ) : null}
              </Path>
            );
          }
          return (
            <Path
              key={i}
              path={d.path}
              color={d.color}
              style="stroke"
              strokeWidth={d.width}
              strokeCap="round"
              opacity={d.opacity}
            />
          );
        })}
      </Group>
      {caption && titleFont && subFont ? (
        <Group>
          <RoundedRect
            x={width * 0.05}
            y={height * 0.05}
            width={width * 0.9}
            height={height * 0.26}
            r={height * 0.04}
            color="rgba(255,244,224,0.92)"
          >
            <Shadow dx={0} dy={shadow} blur={shadow * 2} color="rgba(0,0,0,0.3)" />
          </RoundedRect>
          <SkText
            x={(width - titleFont.measureText(caption.title).width) / 2}
            y={height * 0.155}
            text={caption.title}
            font={titleFont}
            color="#1E2A5A"
          />
          <SkText
            x={(width - subFont.measureText(caption.sub).width) / 2}
            y={height * 0.255}
            text={caption.sub}
            font={subFont}
            color="#2753A6"
          />
        </Group>
      ) : null}
    </Canvas>
  );
});
