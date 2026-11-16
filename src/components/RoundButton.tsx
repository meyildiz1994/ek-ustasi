/** Round icon button with an optional badge; ≥ 44 pt touch target (spec §16). */
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { fonts } from '@/theme/fonts';
import { palette } from '@/theme/palette';

interface Props {
  icon: ImageSourcePropType;
  label: string;
  badge?: string;
  active?: boolean;
  onPress: () => void;
}

export function RoundButton({ icon, label, badge, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, active && styles.active, pressed && styles.pressed]}
    >
      <Image source={icon} style={styles.icon} />
      {badge !== undefined ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,244,224,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.navy,
  },
  active: { borderColor: palette.selection, borderWidth: 3 },
  pressed: { transform: [{ scale: 0.94 }] },
  icon: { width: 40, height: 40 },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 26,
    paddingHorizontal: 4,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.pomegranate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: fonts.extraBold },
});
