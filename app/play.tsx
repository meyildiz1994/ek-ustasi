/** Level screen (spec §4): grid on top, preview bubble, letter wheel with helper buttons. */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlyingStar } from '@/components/Effects';
import { Grid, FILL_STAGGER_MS } from '@/components/Grid';
import { EkTuruView } from '@/components/EkTuruView';
import { LevelComplete } from '@/components/LevelComplete';
import { PreviewBubble, type BubbleHandle, type BubbleTone } from '@/components/PreviewBubble';
import { Postcard } from '@/components/Postcard';
import { RoundButton } from '@/components/RoundButton';
import { StopIntro } from '@/components/StopIntro';
import { TipCard } from '@/components/TipCard';
import { TopBar } from '@/components/TopBar';
import { Wheel } from '@/components/Wheel';
import { fillDelays, visibleCells, type CellKey } from '@/game/grid';
import { HINT_COST } from '@/game/hints';
import { gridOf } from '@/game/session';
import { pathWord } from '@/game/wheel';
import { t } from '@/i18n';
import { feedback } from '@/services/feedback';
import { stopForLevel, stops } from '@/services/levels';
import { gameStore, useGame } from '@/store';
import { fonts } from '@/theme/fonts';
import { backgrounds, ui } from '@/theme/images';
import { palette } from '@/theme/palette';

const FLASH_MS = 900;

export default function PlayScreen() {
  const level = useGame((s) => s.level);
  const session = useGame((s) => s.session);
  const result = useGame((s) => s.result);
  const coins = useGame((s) => s.save.coins);
  const bonusCounter = useGame((s) => s.save.bonusCounter);
  const loading = useGame((s) => s.loading);
  const error = useGame((s) => s.error);
  const ek = useGame((s) => s.ek);
  const ekPaid = useGame((s) => s.ekPaid);
  const tip = useGame((s) => s.tip);
  const newPostcard = useGame((s) => s.newPostcard);
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [introSeen, setIntroSeen] = useState<number | null>(null);

  const { width } = useWindowDimensions();
  const [gridBox, setGridBox] = useState({ w: 0, h: 0 });
  const [preview, setPreview] = useState('');
  const [flash, setFlash] = useState<{ text: string; tone: BubbleTone } | null>(null);
  const [picking, setPicking] = useState(false);
  const [delays, setDelays] = useState<ReadonlyMap<CellKey, number>>(new Map());
  const bubble = useRef<BubbleHandle>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pathLen = useRef(0);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    void gameStore.getState().openLevel();
    const pending = timers.current;
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      pending.forEach(clearTimeout);
    };
  }, []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const model = level ? gridOf(level) : null;
  const visible = useMemo(
    () => (model && session ? visibleCells(model, session.progress) : new Set<CellKey>()),
    [model, session],
  );
  const wheelLetters = useMemo(
    () => (level && session ? session.order.map((i) => level.letters[i] as string) : []),
    [level, session],
  );

  const showFlash = (text: string, tone: BubbleTone) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, tone });
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
  };

  /** Runs a store action and animates the cells it opened; notes rise as tiles fill (spec §12). */
  const withFill = (order: readonly CellKey[], act: () => boolean): number => {
    const before = visible;
    if (!act()) return 0;
    const s = gameStore.getState();
    if (!s.level || !s.session) return 0;
    const after = visibleCells(gridOf(s.level), s.session.progress);
    const d = fillDelays(before, after, order, FILL_STAGGER_MS);
    setDelays(d);
    [...d.values()].forEach((ms, k) => later(ms, () => feedback.fill(k)));
    return d.size * FILL_STAGGER_MS;
  };

  const onRelease = (path: number[]) => {
    setPreview('');
    if (!model) return;
    const word = pathWord(wheelLetters, path);
    if (word.length < 2) return;
    const wi = model.byWord.get(word);
    const order = wi === undefined ? [] : (model.words[wi]?.cells ?? []);
    let res: string | undefined;
    const fillMs = withFill(order, () => {
      res = gameStore.getState().submit(word)?.result;
      return res === 'target';
    });
    if (res === 'target') later(fillMs, feedback.success);
    else if (res === 'bonus') {
      feedback.bonus();
      setStars((n) => n + 1);
      showFlash(`${word} · ${t('play.bonusFound')}`, 'bonus');
    } else if (res === 'alreadyFound') {
      feedback.already();
      showFlash(t('play.alreadyFound'), 'already');
    } else {
      feedback.error();
      showFlash(word, 'error');
      bubble.current?.shake();
    }
  };

  const hint = (kind: 'letter' | 'word') => {
    setPicking(false);
    if (coins < HINT_COST[kind]) return showFlash(t('play.notEnoughCoins'), 'error');
    withFill([], () => gameStore.getState().hint({ kind }) !== null);
  };

  const onCellPress = (cell: CellKey) => {
    setPicking(false);
    withFill([cell], () => gameStore.getState().hint({ kind: 'targeted', cell }) !== null);
  };

  const togglePicking = () => {
    if (!picking && coins < HINT_COST.targeted) return showFlash(t('play.notEnoughCoins'), 'error');
    setPicking(!picking);
  };

  /** Next level, with the postcard first when a stop was just finished. */
  const goNext = () => {
    setDelays(new Map());
    if (gameStore.getState().newPostcard) setPostcardOpen(true);
    else void gameStore.getState().nextLevel();
  };

  const stop = level ? stopForLevel(level.id) : null;
  const showIntro =
    !!level &&
    !!stop &&
    !!session &&
    level.id === stop.firstLevel &&
    session.progress.found.length === 0 &&
    session.progress.revealed.length === 0 &&
    !result &&
    !ek &&
    introSeen !== level.id;
  const bg = (stop && backgrounds[stop.region as keyof typeof backgrounds]) ?? backgrounds.marmara;
  // Side buttons take 56 + 2·6 px on each side.
  const wheelSize = Math.min(width - 2 * (56 + 12) - 8, 300);

  return (
    <ImageBackground source={bg} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        {!level || !session || !model || !stop ? (
          <View style={styles.center}>
            {error ? (
              <>
                <Text style={styles.msg}>{t('play.loadError')}</Text>
                <Pressable
                  onPress={() => void gameStore.getState().openLevel()}
                  accessibilityRole="button"
                  style={styles.retry}
                >
                  <Text style={styles.msg}>↻</Text>
                </Pressable>
              </>
            ) : (
              <>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.msg}>{t('play.loading')}</Text>
              </>
            )}
          </View>
        ) : ek ? (
          <>
            <TopBar
              coins={coins}
              stopName={stop.name}
              level={level.id}
              bonus={bonusCounter}
              onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <EkTuruView
              ek={ek}
              paid={ekPaid}
              coins={coins}
              onApply={(p) => gameStore.getState().ekApply(p)}
              onHint={() => gameStore.getState().ekHint()}
              onCollect={() => gameStore.getState().ekCollect()}
              onNext={goNext}
            />
          </>
        ) : (
          <>
            <TopBar
              coins={coins}
              stopName={stop.name}
              level={level.id}
              bonus={bonusCounter}
              onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <View
              style={styles.gridArea}
              onLayout={(e) =>
                setGridBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
              }
            >
              {gridBox.w > 0 ? (
                <Grid
                  model={model}
                  visible={visible}
                  delays={delays}
                  width={gridBox.w - 24}
                  height={gridBox.h - 12}
                  picking={picking}
                  onCellPress={onCellPress}
                />
              ) : null}
            </View>
            <View style={styles.bubbleRow}>
              {picking ? (
                <PreviewBubble ref={bubble} text={t('play.pickCell')} tone="already" />
              ) : (
                <PreviewBubble
                  ref={bubble}
                  text={preview || flash?.text || ''}
                  tone={preview ? 'normal' : (flash?.tone ?? 'normal')}
                />
              )}
            </View>
            <View style={styles.wheelRow}>
              <View style={styles.side}>
                <RoundButton
                  icon={ui.shuffle}
                  label={t('play.shuffle')}
                  onPress={() => gameStore.getState().shuffle()}
                />
                <RoundButton
                  icon={ui.revealWord}
                  label={t('play.hintWord', { cost: HINT_COST.word })}
                  badge={String(HINT_COST.word)}
                  onPress={() => hint('word')}
                />
              </View>
              <Wheel
                letters={wheelLetters}
                size={wheelSize}
                onChange={(p) => {
                  if (p.length > pathLen.current) feedback.select(p.length - 1);
                  pathLen.current = p.length;
                  setPreview(pathWord(wheelLetters, p));
                }}
                onRelease={onRelease}
              />
              <View style={styles.side}>
                <RoundButton
                  icon={ui.hint}
                  label={t('play.hintLetter', { cost: HINT_COST.letter })}
                  badge={String(HINT_COST.letter)}
                  onPress={() => hint('letter')}
                />
                <RoundButton
                  icon={ui.targetHint}
                  label={t('play.hintTargeted', { cost: HINT_COST.targeted })}
                  badge={String(HINT_COST.targeted)}
                  active={picking}
                  onPress={togglePicking}
                />
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
      {result ? (
        <LevelComplete
          result={result}
          ekTuru={level?.ekTuru !== undefined}
          onNext={() => {
            if (level?.ekTuru) gameStore.getState().startEkTuru();
            else goNext();
          }}
        />
      ) : null}
      {showIntro && stop ? <StopIntro stop={stop} onStart={() => setIntroSeen(level.id)} /> : null}
      {postcardOpen && newPostcard ? (
        <Postcard
          stop={stops.find((x) => x.id === newPostcard) ?? (stop as NonNullable<typeof stop>)}
          onClose={() => {
            setPostcardOpen(false);
            gameStore.getState().dismissPostcard();
            void gameStore.getState().nextLevel();
          }}
        />
      ) : null}
      {stars > 0 ? <FlyingStar key={stars} /> : null}
      {tip ? <TipCard tip={tip} onClose={() => gameStore.getState().dismissTip()} /> : null}
      {loading && level ? <View style={styles.dim} pointerEvents="none" /> : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  msg: { color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  retry: { padding: 12 },
  gridArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  bubbleRow: { height: 52, justifyContent: 'center' },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  side: { gap: 16, marginHorizontal: 6 },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(19,27,75,0.3)' },
});
