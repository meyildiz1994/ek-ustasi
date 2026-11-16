/** Haptic feedback (spec §12), respecting the player's setting. Sounds come in Phase 8. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { gameStore } from '../store';

const enabled = () => Platform.OS !== 'web' && gameStore.getState().save.settings.haptics;

export const feedback = {
  select: () => {
    if (enabled()) void Haptics.selectionAsync();
  },
  success: () => {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: () => {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
