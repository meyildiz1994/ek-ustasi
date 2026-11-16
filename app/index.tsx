import { router } from 'expo-router';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { useGame } from '@/store';
import { backgrounds, mascot, ui } from '@/theme/images';
import { palette } from '@/theme/palette';
import { trUpper } from '@/utils/tr';

export default function HomeScreen() {
  const level = useGame((s) => s.save.currentLevel);
  const coins = useGame((s) => s.save.coins);
  return (
    <ImageBackground source={backgrounds.home} style={styles.root} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <View style={styles.pill} accessibilityLabel={t('play.coins', { n: coins })}>
            <Image source={ui.coin} style={styles.coin} />
            <Text style={styles.pillText}>{coins}</Text>
          </View>
        </View>
        <View style={styles.center}>
          <Text style={styles.title} accessibilityRole="header">
            {trUpper(t('app.name'))}
          </Text>
          <Text style={styles.subtitle}>{t('app.tagline')}</Text>
          <Image source={mascot.happy} style={styles.mascot} resizeMode="contain" />
        </View>
        <Pressable
          onPress={() => router.push('/play')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}
        >
          <Text style={styles.playText}>{t('home.play', { n: level })}</Text>
        </Pressable>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy },
  safe: { flex: 1, alignItems: 'center' },
  top: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'flex-end', padding: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(30,42,90,0.75)',
  },
  coin: { width: 28, height: 28, marginRight: 6 },
  pillText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: palette.navyDeep,
    textShadowRadius: 10,
  },
  subtitle: {
    color: palette.cream,
    fontSize: 17,
    fontWeight: '700',
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
  pressed: { transform: [{ scale: 0.96 }] },
  playText: { color: '#fff', fontSize: 26, fontWeight: '900' },
});
