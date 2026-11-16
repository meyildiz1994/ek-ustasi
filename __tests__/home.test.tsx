import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/store', () => {
  const save = {
    currentLevel: 7,
    coins: 245,
    settings: { sound: true, music: true, haptics: true, ekTuruExplanations: true },
  };
  return { useGame: (sel: (s: { save: typeof save }) => unknown) => sel({ save }) };
});

describe('HomeScreen', () => {
  it('renders the Turkish title with correct İ and the current level', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('EK USTASI')).toBeTruthy();
    expect(screen.getByText('Türkçenin eklerini ustaca tak!')).toBeTruthy();
    expect(screen.getByText('Bölüm 7')).toBeTruthy();
    expect(screen.getByText('245')).toBeTruthy();
  });
});
