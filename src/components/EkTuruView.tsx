/**
 * Ek Turu screen (spec §5): the root grows as suffix chips are drawn on the wheel. Each suffix gets
 * its own colour so the chain reads as morphemes; the multiplier badge pops on every step.
 */
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { cardCategory, cardLabel, ekMultiplier, naivePreview, type EkSession } from '@/game/ekturu';
import { HINT_COST } from '@/game/hints';
import { t } from '@/i18n';
import { ui } from '@/theme/images';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

import { PreviewBubble, type BubbleHandle } from './PreviewBubble';
import { RoundButton } from './RoundButton';
import { Wheel } from './Wheel';

const SEGMENT_COLORS = [palette.navy, palette.turquoise, palette.cobalt, palette.saffron];

interface Props {
  ek: EkSession;
  paid: number | null;
  coins: number;
  onApply: (indices: number[]) => { added: number; failed: boolean } | null;
  onHint: () => boolean;
  onCollect: () => void;
  onNext: () => void;
  onFeedback: (kind: 'select' | 'success' | 'error') => void;
}

export function EkTuruView({
  ek,
  paid,
  coins,
  onApply,
  onHint,
  onCollect,
  onNext,
  onFeedback,
}: Props) {
  const { width } = useWindowDimensions();
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const bubble = useRef<BubbleHandle>(null);
  const shake = useSharedValue(0);
  const badge = useSharedValue(1);
  const steps = ek.steps.length;

  useEffect(() => {
    if (steps > 0) {
      badge.value = withSequence(withTiming(1.45, { duration: 140 }), withSpring(1));
      // 5+ suffixes: the screen shakes a little (spec §12).
      if (steps >= 5) {
        shake.value = withSequence(
          ...[4, -4, 3, -3, 0].map((v) => withTiming(v, { duration: 50 })),
        );
      }
    }
  }, [steps, badge, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));

  const playing = ek.status === 'playing';
  const reached = ek.score >= ek.target;
  const wheelSize = Math.min(width - 24, 340);
  const labels = ek.cards.map(cardLabel);
  const subs = ek.cards.map(cardCategory);

  const onRelease = (path: number[]) => {
    setPreview('');
    const out = onApply(path);
    if (!out) return;
    if (out.failed) {
      onFeedback('error');
      bubble.current?.shake();
    } else if (out.added > 0) onFeedback('success');
  };

  const hint = () => {
    if (coins < HINT_COST.suffix) return setNote(t('play.notEnoughCoins'));
    if (!onHint()) setNote(t('ek.noHint'));
  };

  const morphemes = ek.word.morphemes;
  return (
    <Animated.View style={[styles.root, shakeStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{trUpper(t(ek.ek.big ? 'ek.bigTitle' : 'ek.title'))}</Text>
        {ek.ek.big ? <Text style={styles.big}>{t('ek.big3x')}</Text> : null}
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{t('ek.score', { n: ek.score })}</Text>
          <Text style={[styles.target, reached && styles.targetOk]}>
            {reached ? '✓ ' : ''}
            {t('ek.target', { n: ek.target })}
          </Text>
        </View>
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, (ek.score / Math.max(1, ek.target)) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.wordArea}>
        <View style={styles.word} accessibilityLabel={ek.word.surface}>
          {morphemes.map((m, i) => (
            <Text
              key={i}
              style={[
                styles.morph,
                { backgroundColor: SEGMENT_COLORS[i === 0 ? 0 : 1 + ((i - 1) % 3)] },
                morphemes.join('').length > 14 && styles.morphSmall,
              ]}
            >
              {trUpper(m)}
            </Text>
          ))}
          <Animated.View style={[styles.badge, badgeStyle]}>
            <Text style={styles.badgeText}>×{ekMultiplier(ek)}</Text>
          </Animated.View>
        </View>
        {ek.error ? (
          <View style={styles.error}>
            <Text style={styles.errorWord}>{trUpper(ek.error.tried)}</Text>
            <Text style={styles.errorText}>{ek.error.explanation}</Text>
          </View>
        ) : (
          <Text style={styles.howto}>
            {steps === 0 ? t('ek.howto') : t('ek.chain', { n: steps })}
          </Text>
        )}
      </View>

      {playing ? (
        <>
          <View style={styles.bubbleRow}>
            <PreviewBubble
              ref={bubble}
              text={preview || note || ''}
              tone={preview ? 'normal' : 'already'}
            />
          </View>
          <Wheel
            letters={labels}
            subs={subs}
            highlighted={ek.hinted}
            size={wheelSize}
            onChange={(p) => {
              if (p.length > 0) {
                onFeedback('select');
                setNote(null);
              }
              setPreview(
                p.length
                  ? naivePreview(
                      ek,
                      p.map((i) => ek.cards[i]!),
                    )
                  : '',
              );
            }}
            onRelease={onRelease}
          />
          <View style={styles.actions}>
            <RoundButton
              icon={ui.suffixHint}
              label={t('ek.hint', { cost: HINT_COST.suffix })}
              badge={String(HINT_COST.suffix)}
              onPress={hint}
            />
            <Pressable
              onPress={onCollect}
              disabled={steps === 0}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.collect,
                steps === 0 && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.collectText}>
                {t('ek.collect')} · {ek.score}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>
            {t(ek.status === 'broken' ? 'ek.broken' : 'ek.collected')}
          </Text>
          <Text style={styles.resultSub}>
            {reached ? t('ek.reachedTarget') : t('ek.missedTarget', { n: ek.target - ek.score })}
          </Text>
          <View style={styles.coins}>
            <Image source={ui.coin} style={styles.coin} />
            <Text style={styles.coinText}>{t('ek.reward', { n: paid ?? 0 })}</Text>
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.collect, pressed && styles.pressed]}
          >
            <Text style={styles.collectText}>{t('ek.next')}</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  header: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(19,27,75,0.78)',
    alignItems: 'center',
  },
  title: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 24, letterSpacing: 2 },
  big: { color: palette.saffron, fontFamily: fonts.extraBold, fontSize: 15, marginTop: -4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  score: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 18 },
  target: { color: palette.cream, fontFamily: fonts.bold, fontSize: 16 },
  targetOk: { color: palette.saffron },
  bar: {
    alignSelf: 'stretch',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,244,224,0.25)',
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: 10, borderRadius: 5, backgroundColor: palette.saffron },
  wordArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  word: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  morph: {
    color: '#fff',
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: 1.5,
    paddingHorizontal: 10,
    paddingTop: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  morphSmall: { fontSize: 24, paddingHorizontal: 6 },
  badge: {
    marginLeft: 6,
    minWidth: 48,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 8,
    backgroundColor: palette.pomegranate,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 18 },
  howto: {
    marginTop: 10,
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: palette.navyDeep,
    textShadowRadius: 6,
  },
  error: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(200,50,60,0.92)',
    alignItems: 'center',
  },
  errorWord: {
    color: '#fff',
    fontFamily: fonts.extraBold,
    fontSize: 20,
    textDecorationLine: 'line-through',
  },
  errorText: {
    color: '#fff',
    fontFamily: fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 2,
  },
  bubbleRow: { height: 52, justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  collect: {
    minHeight: 56,
    paddingHorizontal: 28,
    borderRadius: 28,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
  },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.96 }] },
  collectText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 22 },
  result: {
    margin: 16,
    marginBottom: 40,
    padding: 20,
    borderRadius: 24,
    backgroundColor: palette.cream,
    borderWidth: 3,
    borderColor: palette.turquoise,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  resultTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: palette.navy },
  resultSub: { fontFamily: fonts.bold, fontSize: 16, color: palette.cobalt },
  coins: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  coin: { width: 30, height: 30, marginRight: 6 },
  coinText: { fontSize: 24, fontFamily: fonts.extraBold, color: palette.navy },
});
