/**
 * Game feel (spec §12): one call per game event plays its sound and haptic, each respecting the
 * player's settings (sound, haptics). Music is driven by the music setting (see startFeedback).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { gameStore } from '../store';
import { playSfx, setMusic, type Sfx } from './sound';

const settings = () => gameStore.getState().save.settings;
const haptic = (fn: () => Promise<void>) => {
  if (Platform.OS !== 'web' && settings().haptics) void fn().catch(() => {});
};
const sound = (name: Sfx, volume?: number) => {
  if (settings().sound) playSfx(name, volume);
};

export const feedback = {
  /** Letter n (0-based) joined the selection: tick climbs the pentatonic scale. */
  select: (n = 0) => {
    sound(`tick_${Math.min(9, Math.max(0, n))}` as Sfx);
    haptic(() => Haptics.selectionAsync());
  },
  /** One grid tile filled (k-th of the word). */
  fill: (k: number) => sound(`tick_${Math.min(9, 2 + k)}` as Sfx, 0.5),
  success: () => {
    sound('word');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  error: () => {
    sound('bonk');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  already: () => {
    sound('already');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  bonus: () => {
    sound('bonus');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  coin: () => sound('coin'),
  star: () => {
    sound('star');
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  levelEnd: () => {
    sound('levelEnd');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** Ek Turu: the n-th suffix stuck (strong haptic, rising sound). */
  ekStep: (n: number) => {
    sound(`ek_${Math.min(7, Math.max(0, n))}` as Sfx);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  ekBreak: () => {
    sound('ekBreak');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
  collect: () => {
    sound('collect');
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  tap: () => sound('tap', 0.6),
};

let started = false;
/** Starts the music when allowed and follows the setting afterwards. */
export function startFeedback(): void {
  if (started) return;
  started = true;
  let last = settings().music;
  setMusic(last);
  gameStore.subscribe((s) => {
    if (s.save.settings.music !== last) {
      last = s.save.settings.music;
      setMusic(last);
    }
  });
}
