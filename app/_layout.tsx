import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startFeedback } from '@/services/feedback';
import { loadSkia } from '@/services/skia';
import { fontFiles } from '@/theme/fonts';
import { palette } from '@/theme/palette';

export default function RootLayout() {
  const [skiaReady, setSkiaReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  // A font failure falls back to the system font rather than blocking the game.
  const ready = skiaReady && (fontsLoaded || fontError !== null);
  useEffect(() => {
    void loadSkia().then(() => setSkiaReady(true));
    startFeedback();
  }, []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? <Stack screenOptions={{ headerShown: false }} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.navy } });
