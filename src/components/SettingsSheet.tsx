/** Settings sheet (spec §12): sound, music, haptics and the Ek Turu explanation cards. */
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { LINKS } from '../../config/monetization';

import { t } from '@/i18n';
import { feedback } from '@/services/feedback';
import { restorePurchases } from '@/services/purchases';
import { gameStore, useGame } from '@/store';
import type { Settings } from '@/store/save';
import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';

/** The toggles shown, in order. The other settings have no UI yet. */
export const SETTING_ROWS = ['sound', 'music', 'haptics', 'ekTuruExplanations'] as const;
type Row = (typeof SETTING_ROWS)[number] & keyof Settings;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsSheet({ visible, onClose }: Props) {
  const settings = useGame((s) => s.save.settings);
  const toggle = (key: Row, value: boolean) => {
    gameStore.getState().setSetting(key, value);
    feedback.tap();
  };
  const [note, setNote] = useState<string | null>(null);
  const restore = async () => {
    setNote(null);
    const out = await restorePurchases();
    setNote(
      t(
        out === 'restored'
          ? 'shop.restored'
          : out === 'nothing'
            ? 'shop.nothingToRestore'
            : out === 'unavailable'
              ? 'shop.unavailable'
              : 'shop.failed',
      ),
    );
  };
  const open = (url: string) => {
    if (url) void Linking.openURL(url).catch(() => setNote(t('settings.soon')));
    else setNote(t('settings.soon'));
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('settings.close')}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title} accessibilityRole="header">
            {t('settings.title')}
          </Text>
          {SETTING_ROWS.map((key) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{t(`settings.${key}`)}</Text>
              <Switch
                value={settings[key]}
                onValueChange={(v) => toggle(key, v)}
                accessibilityLabel={t(`settings.${key}`)}
                trackColor={{ true: palette.turquoise, false: 'rgba(30,42,90,0.25)' }}
                thumbColor="#fff"
              />
            </View>
          ))}
          <Pressable onPress={() => void restore()} accessibilityRole="button" style={styles.row}>
            <Text style={styles.link}>{t('settings.restore')}</Text>
          </Pressable>
          <Pressable
            onPress={() => open(LINKS.privacy)}
            accessibilityRole="link"
            style={styles.row}
          >
            <Text style={styles.link}>{t('settings.privacy')}</Text>
          </Pressable>
          <Pressable
            onPress={() => open(LINKS.contact ? `mailto:${LINKS.contact}` : '')}
            accessibilityRole="link"
            style={styles.row}
          >
            <Text style={styles.link}>{t('settings.contact')}</Text>
          </Pressable>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}
          >
            <Text style={styles.doneText}>{t('settings.done')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19,27,75,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 310,
    padding: 20,
    borderRadius: 28,
    backgroundColor: palette.cream,
    borderWidth: 4,
    borderColor: palette.turquoise,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: palette.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,42,90,0.12)',
  },
  label: { flex: 1, fontSize: 18, fontFamily: fonts.bold, color: palette.navy },
  link: { flex: 1, fontSize: 17, fontFamily: fonts.bold, color: palette.cobalt },
  note: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: palette.navy,
    textAlign: 'center',
  },
  done: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  doneText: { color: '#fff', fontSize: 20, fontFamily: fonts.extraBold },
});
