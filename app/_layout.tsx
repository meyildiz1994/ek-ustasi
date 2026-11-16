import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadSkia } from '@/services/skia';
import { palette } from '@/theme/palette';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void loadSkia().then(() => setReady(true));
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
