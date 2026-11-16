import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/index';

describe('HomeScreen', () => {
  it('renders the Turkish title with correct İ', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('EK USTASI')).toBeTruthy();
    expect(screen.getByText('Türkçenin eklerini ustaca tak!')).toBeTruthy();
  });
});
