import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyReward } from '@/components/DailyReward';
import { SettingsSheet } from '@/components/SettingsSheet';
import { dailyOffer, localDay } from '@/game/daily';
import { feedback } from '@/services/feedback';
import { t } from '@/i18n';
import { gameStore, useGame } from '@/store';
import { fonts } from '@/theme/fonts';
import { backgrounds, mascot, ui } from '@/theme/images';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

export default function HomeScreen() {
  const level = useGame((s) => s.save.currentLevel);
  const coins = useGame((s) => s.save.coins);
  const [settings, setSettings] = useState(false);
  // Offered once per app session; "Sonra" hides it until the next launch.
  const [dailyLater, setDailyLater] = useState(false);
  const dailyState = useGame((s) => s.save.daily);
  const [today] = useState(() => localDay(Date.now()));
  const daily = useMemo(() => dailyOffer(dailyState, today), [dailyState, today]);
  return (
    <ImageBackground source={backgrounds.home} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable
            onPress={() => setSettings(true)}
            accessibilityRole="button"
            accessibilityLabel={t('home.settings')}
            style={({ pressed }) => [styles.pill, styles.gear, pressed && styles.pressed]}
          >
            <Text style={styles.gearText}>⚙</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/shop')}
            accessibilityRole="button"
            accessibilityLabel={`${t('play.coins', { n: coins })}, ${t('home.shop')}`}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Image source={ui.coin} style={styles.coin} />
            <Text style={styles.pillText}>{coins}</Text>
            <Text style={styles.plus}>+</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.title} accessibilityRole="header">
            {trUpper(t('app.name'))}
          </Text>
          <Text style={styles.subtitle}>{t('app.tagline')}</Text>
          <Image source={mascot.happy} style={styles.mascot} resizeMode="contain" />
        </View>
        <Pressable
          onPress={() => router.push('/map')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.map, pressed && styles.pressed]}
        >
          <Text style={styles.mapText}>{t('home.map')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/play')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}
        >
          <Text style={styles.playText}>{t('home.play', { n: level })}</Text>
        </Pressable>
      </SafeAreaView>
      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
      {daily && !dailyLater ? (
        <DailyReward
          offer={daily}
          onClaim={() => {
            if (gameStore.getState().claimDaily() !== null) feedback.coin();
          }}
          onLater={() => setDailyLater(true)}
        />
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  safe: { flex: 1, alignItems: 'center' },
  top: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  gear: { width: 44, justifyContent: 'center', paddingHorizontal: 0 },
  gearText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
  },
  coin: { width: 28, height: 28, marginRight: 6 },
  pillText: { color: '#fff', fontSize: 17, fontFamily: fonts.extraBold },
  plus: {
    color: palette.navy,
    backgroundColor: palette.saffron,
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
    marginLeft: 8,
    overflow: 'hidden',
    fontFamily: fonts.extraBold,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    color: '#fff',
    fontSize: 52,
    fontFamily: fonts.extraBold,
    letterSpacing: 3,
    textShadowColor: palette.navyDeep,
    textShadowRadius: 10,
  },
  subtitle: {
    color: palette.cream,
    fontSize: 19,
    fontFamily: fonts.bold,
    marginTop: 6,
    textShadowColor: palette.navyDeep,
    textShadowRadius: 8,
  },
  mascot: { width: 180, height: 180, marginTop: 24 },
  play: {
    marginBottom: 56,
    minWidth: 240,
    minHeight: 64,
    paddingHorizontal: 32,
    borderRadius: 32,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#147A75',
  },
  map: {
    marginBottom: 14,
    minWidth: 180,
    minHeight: 50,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'rgba(30,42,90,0.8)',
    borderWidth: 2,
    borderColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: { color: '#fff', fontSize: 20, fontFamily: fonts.extraBold },
  pressed: { transform: [{ scale: 0.96 }] },
  playText: { color: '#fff', fontSize: 26, fontFamily: fonts.extraBold },
});
