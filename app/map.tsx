/** World map (spec §10): a winding vertical path of the 100 stops, from İstanbul at the bottom up. */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Postcard } from '@/components/Postcard';
import { Scene } from '@/components/Scene';
import { mapX, stopProgress, type StopProgress } from '@/game/stops';
import { t } from '@/i18n';
import { stops, type StopInfo } from '@/services/levels';
import { useGame } from '@/store';
import { fonts } from '@/theme/fonts';
import { backgrounds, ui } from '@/theme/images';
import { scenePhoto } from '@/theme/scenes';
import { palette } from '@/theme/palette';

const ROW = 112;
const NODE = 64;
const PAD = 80;

export default function MapScreen() {
  const { width } = useWindowDimensions();
  const currentLevel = useGame((s) => s.save.currentLevel);
  const stars = useGame((s) => s.save.stars);
  const scroll = useRef<ScrollViewInstance>(null);
  const [open, setOpen] = useState<StopInfo | null>(null);
  const [postcard, setPostcard] = useState<StopInfo | null>(null);

  const progress = useMemo(
    () => stops.map((s) => stopProgress(s, currentLevel, stars)),
    [currentLevel, stars],
  );
  const height = stops.length * ROW + PAD * 2;
  const yOf = (index: number) => height - PAD - (index - 0.5) * ROW;
  const xOf = (index: number) => mapX(index) * width;
  const current = Math.max(1, progress.findIndex((p) => p.state === 'current') + 1);

  useEffect(() => {
    const id = setTimeout(
      () => scroll.current?.scrollTo({ y: Math.max(0, yOf(current) - 360), animated: false }),
      0,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first layout
  }, []);

  return (
    <ImageBackground source={backgrounds.dunya} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel={t('play.back')}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{t('map.title')}</Text>
          <View style={styles.back} />
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ height }}>
          {stops.slice(0, -1).map((s) => {
            // Dotted connector to the next stop.
            const a = { x: xOf(s.index), y: yOf(s.index) };
            const b = { x: xOf(s.index + 1), y: yOf(s.index + 1) };
            const lit = progress[s.index - 1]?.state === 'done';
            return [1, 2, 3, 4].map((k) => (
              <View
                key={`${s.index}-${k}`}
                style={[
                  styles.dot,
                  lit && styles.dotLit,
                  { left: a.x + ((b.x - a.x) * k) / 5 - 4, top: a.y + ((b.y - a.y) * k) / 5 - 4 },
                ]}
              />
            ));
          })}
          {stops.map((s, i) => {
            const p = progress[i] as StopProgress;
            const newRegion = i === 0 || stops[i - 1]?.region !== s.region;
            return (
              <View key={s.id}>
                {newRegion ? (
                  <View style={[styles.region, { top: yOf(s.index) + NODE / 2 + 2 }]}>
                    <Text style={styles.regionText}>{t(`map.regions.${s.region}`)}</Text>
                  </View>
                ) : null}
                <StopNode
                  stop={s}
                  p={p}
                  x={xOf(s.index)}
                  y={yOf(s.index)}
                  onPress={() => setOpen(s)}
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      {open ? (
        <StopSheet
          stop={open}
          p={progress[open.index - 1] as StopProgress}
          onClose={() => setOpen(null)}
          onPostcard={() => {
            setPostcard(open);
            setOpen(null);
          }}
        />
      ) : null}
      {postcard ? <Postcard stop={postcard} onClose={() => setPostcard(null)} /> : null}
    </ImageBackground>
  );
}

function StopNode({
  stop,
  p,
  x,
  y,
  onPress,
}: {
  stop: StopInfo;
  p: StopProgress;
  x: number;
  y: number;
  onPress: () => void;
}) {
  const locked = p.state === 'locked';
  const size = p.state === 'current' ? NODE + 14 : NODE;
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={`${stop.name}, ${locked ? t('map.locked') : t('map.stars', { n: p.stars })}`}
      style={[styles.nodeWrap, { left: x - 60, top: y - size / 2 }]}
    >
      <View
        style={[
          styles.node,
          { width: size, height: size, borderRadius: size / 2 },
          { backgroundColor: locked ? '#8A8FA8' : stop.palette.accent },
          p.state === 'current' && styles.nodeCurrent,
        ]}
      >
        {locked ? (
          <Image source={ui.lock} style={styles.lock} />
        ) : (
          <Text style={styles.nodeNum}>{stop.index}</Text>
        )}
      </View>
      <Text style={[styles.nodeName, locked && styles.nodeNameLocked]} numberOfLines={1}>
        {stop.name}
      </Text>
      {p.state === 'done' ? <Text style={styles.nodeStars}>★ {p.stars}</Text> : null}
    </Pressable>
  );
}

function StopSheet({
  stop,
  p,
  onClose,
  onPostcard,
}: {
  stop: StopInfo;
  p: StopProgress;
  onClose: () => void;
  onPostcard: () => void;
}) {
  const { width } = useWindowDimensions();
  const w = Math.min(width - 64, 320);
  const total = stop.lastLevel - stop.firstLevel + 1;
  return (
    <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel={t('map.close')}>
      <Pressable style={styles.sheet} onPress={() => undefined}>
        <Text style={styles.sheetKicker}>
          {t('map.stop', { n: stop.index })} · {t(`map.regions.${stop.region}`)}
        </Text>
        <Text style={styles.sheetName} accessibilityRole="header">
          {stop.name}
        </Text>
        <Scene stop={stop} photo={scenePhoto(stop.index)} width={w} height={Math.round(w * 0.7)} />
        <Text style={styles.sheetIntro}>{stop.intro}</Text>
        <Text style={styles.sheetStats}>
          {t('map.levels', { done: p.done, total })} · ★ {p.stars}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(p.done / total) * 100}%` }]} />
        </View>
        <Pressable
          onPress={() => {
            onClose();
            if (p.state === 'done') onPostcard();
            else router.push('/play');
          }}
          accessibilityRole="button"
          style={styles.sheetBtn}
        >
          <Text style={styles.sheetBtnText}>
            {p.state === 'done' ? t('map.postcard') : t('map.play')}
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  safe: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 28, marginTop: -4 },
  title: {
    color: '#fff',
    fontFamily: fonts.extraBold,
    fontSize: 26,
    textShadowColor: palette.navyDeep,
    textShadowRadius: 8,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,244,224,0.45)',
  },
  dotLit: { backgroundColor: palette.saffron },
  region: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  regionText: {
    color: palette.navy,
    backgroundColor: palette.cream,
    fontFamily: fonts.extraBold,
    fontSize: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  nodeWrap: { position: 'absolute', width: 120, alignItems: 'center' },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.cream,
  },
  nodeCurrent: { borderColor: palette.saffron, borderWidth: 5 },
  nodeNum: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 22 },
  lock: { width: 32, height: 32, opacity: 0.85 },
  nodeName: {
    marginTop: 2,
    color: '#fff',
    fontFamily: fonts.extraBold,
    fontSize: 14,
    textShadowColor: palette.navyDeep,
    textShadowRadius: 6,
  },
  nodeNameLocked: { color: 'rgba(255,255,255,0.65)' },
  nodeStars: { color: palette.saffron, fontFamily: fonts.extraBold, fontSize: 13, marginTop: -2 },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19,27,75,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.turquoise,
  },
  sheetKicker: { color: palette.cobalt, fontFamily: fonts.bold, fontSize: 14 },
  sheetName: { color: palette.navy, fontFamily: fonts.extraBold, fontSize: 28, marginBottom: 6 },
  sheetIntro: {
    maxWidth: 300,
    marginTop: 10,
    color: palette.navy,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  sheetStats: { marginTop: 8, color: palette.cobalt, fontFamily: fonts.bold, fontSize: 15 },
  bar: {
    width: 240,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(30,42,90,0.15)',
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: 8, backgroundColor: palette.turquoise },
  sheetBtn: {
    marginTop: 14,
    minHeight: 50,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 19 },
});
