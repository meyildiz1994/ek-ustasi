import * as Audio from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { feedback, startFeedback } from './feedback';

type Listener = (s: State) => void;
interface State {
  save: { settings: { sound: boolean; music: boolean; haptics: boolean } };
}

jest.mock('@/store', () => {
  const state = { save: { settings: { sound: true, music: true, haptics: true } } };
  const listeners: ((s: typeof state) => void)[] = [];
  return {
    gameStore: {
      getState: () => state,
      subscribe: (l: (s: typeof state) => void) => listeners.push(l),
      __listeners: listeners,
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require('@/store').gameStore as {
  getState: () => State;
  __listeners: Listener[];
};
const players = (
  Audio as unknown as {
    __players: { play: jest.Mock; pause: jest.Mock; loop: boolean; volume: number }[];
  }
).__players;
const settings = store.getState().save.settings;
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  Object.assign(settings, { sound: true, music: true, haptics: true });
  jest.clearAllMocks();
});

describe('feedback', () => {
  it('plays a sound and a haptic for each event', async () => {
    feedback.select(3);
    feedback.ekStep(2);
    feedback.error();
    await flush();
    expect(Audio.createAudioPlayer).toHaveBeenCalled();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('reuses one player per effect and restarts it', async () => {
    const before = players.length;
    feedback.tap();
    feedback.tap();
    await flush();
    const created = players.length - before;
    expect(created).toBeLessThanOrEqual(1);
    const tap = players.find(
      (p) => (p as unknown as { source: unknown }).source !== undefined && p.volume === 0.6,
    );
    expect(tap?.play).toHaveBeenCalledTimes(2);
  });

  it('clamps scale indices', () => {
    expect(() => {
      feedback.select(-4);
      feedback.select(99);
      feedback.ekStep(50);
      feedback.fill(40);
    }).not.toThrow();
  });

  it('respects the sound and haptics settings', async () => {
    settings.sound = false;
    settings.haptics = false;
    const before = players.flatMap((p) => p.play.mock.calls).length;
    feedback.success();
    feedback.levelEnd();
    feedback.star();
    feedback.coin();
    await flush();
    expect(players.flatMap((p) => p.play.mock.calls).length).toBe(before);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('starts the music once and follows the music setting', () => {
    startFeedback();
    startFeedback();
    expect(store.__listeners).toHaveLength(1);
    const music = players.find((p) => p.loop);
    expect(music?.play).toHaveBeenCalledTimes(1);
    settings.music = false;
    store.__listeners[0]!(store.getState());
    expect(music?.pause).toHaveBeenCalledTimes(1);
    settings.music = true;
    store.__listeners[0]!(store.getState());
    expect(music?.play).toHaveBeenCalledTimes(2);
  });
});
