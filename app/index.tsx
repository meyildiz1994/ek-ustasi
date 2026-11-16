import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { trUpper } from '@/utils/tr';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {trUpper(t('app.name'))}
      </Text>
      <Text style={styles.subtitle}>{t('app.tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b1d4a',
  },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: '#ffd9bf', fontSize: 16, marginTop: 8 },
});
