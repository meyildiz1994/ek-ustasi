/* global jest */
/* Native audio has no Jest implementation: a recording fake keeps sound code testable. */
jest.mock('expo-audio', () => {
  const players = [];
  return {
    __players: players,
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    createAudioPlayer: jest.fn((source) => {
      const p = {
        source,
        volume: 1,
        loop: false,
        play: jest.fn(),
        pause: jest.fn(),
        seekTo: jest.fn(() => Promise.resolve()),
      };
      players.push(p);
      return p;
    }),
  };
});
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));
