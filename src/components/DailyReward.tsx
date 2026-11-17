/** Daily login reward card (spec §13.1): the 7-day cycle with today's day highlighted. */
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DAILY_REWARDS } from '../../config/monetization';
import type { DailyOffer } from '@/game/daily';
import { t } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { ui } from '@/theme/images';
import { palette } from '@/theme/palette';

interface Props {
  offer: DailyOffer;
  onClaim: () => void;
  onLater: () => void;
}

export function DailyReward({ offer, onClaim, onLater }: Props) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {t('daily.title')}
          </Text>
          <View style={styles.days}>
            {DAILY_REWARDS.map((coins, i) => (
              <View
                key={i}
                style={[
                  styles.day,
                  i < offer.step && styles.done,
                  i === offer.step && styles.today,
                  i === DAILY_REWARDS.length - 1 && styles.big,
                ]}
                accessibilityLabel={`${t('daily.day', { n: i + 1 })}: ${coins}`}
              >
                <Text style={[styles.dayLabel, i === offer.step && styles.todayText]}>
                  {t('daily.day', { n: i + 1 })}
                </Text>
                <Image source={ui.coin} style={styles.coin} />
                <Text style={[styles.amount, i === offer.step && styles.todayText]}>
                  {i < offer.step ? '✓' : coins}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.body}>{t('daily.body')}</Text>
          <Pressable
            onPress={onClaim}
            accessibilityRole="button"
            style={({ pressed }) => [styles.claim, pressed && styles.pressed]}
          >
            <Text style={styles.claimText}>{t('daily.claim', { n: offer.coins })}</Text>
          </Pressable>
          <Pressable onPress={onLater} accessibilityRole="button">
            <Text style={styles.later}>{t('daily.later')}</Text>
          </Pressable>
        </View>
      </View>
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
    width: 330,
    padding: 18,
    borderRadius: 28,
    backgroundColor: palette.cream,
    borderWidth: 4,
    borderColor: palette.saffron,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontFamily: fonts.extraBold, color: palette.navy },
  days: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 },
  day: {
    width: 68,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(30,42,90,0.08)',
    alignItems: 'center',
  },
  big: { width: 142 },
  done: { opacity: 0.5 },
  today: { backgroundColor: palette.saffron },
  dayLabel: { fontSize: 13, fontFamily: fonts.bold, color: palette.cobalt },
  todayText: { color: '#fff' },
  coin: { width: 26, height: 26, marginVertical: 2 },
  amount: { fontSize: 16, fontFamily: fonts.extraBold, color: palette.navy },
  body: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: palette.navy,
    textAlign: 'center',
    marginTop: 10,
  },
  claim: {
    marginTop: 14,
    alignSelf: 'stretch',
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#147A75',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  claimText: { color: '#fff', fontSize: 21, fontFamily: fonts.extraBold },
  later: { marginTop: 10, fontSize: 15, fontFamily: fonts.bold, color: palette.cobalt },
});
