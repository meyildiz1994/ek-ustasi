import { fireEvent, render, screen } from '@testing-library/react-native';

import { SETTING_ROWS, SettingsSheet } from '../src/components/SettingsSheet';

const mockSetSetting = jest.fn();
jest.mock('@/store', () => {
  const save = {
    settings: { sound: true, music: false, haptics: true, ekTuruExplanations: true },
  };
  return {
    useGame: (sel: (s: { save: typeof save }) => unknown) => sel({ save }),
    gameStore: {
      getState: () => ({ save, setSetting: (...a: unknown[]) => mockSetSetting(...a) }),
      subscribe: jest.fn(),
    },
  };
});

describe('SettingsSheet', () => {
  it('shows the Turkish toggles and saves a change', async () => {
    await render(<SettingsSheet visible onClose={jest.fn()} />);
    expect(screen.getByText('Ayarlar')).toBeTruthy();
    expect(screen.getByText('Titreşim')).toBeTruthy();
    expect(screen.getByText('Ek Turu açıklamaları')).toBeTruthy();
    expect(SETTING_ROWS).toHaveLength(4);
    fireEvent(screen.getByLabelText('Müzik'), 'valueChange', true);
    expect(mockSetSetting).toHaveBeenCalledWith('music', true);
  });
});
