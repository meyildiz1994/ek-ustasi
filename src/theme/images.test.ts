import { backgrounds, mascot, ui } from './images';
import { palette } from './palette';

describe('theme assets', () => {
  it('resolves every image', () => {
    const all = { ...backgrounds, ...ui, ...mascot };
    expect(Object.keys(all)).toHaveLength(26);
    for (const src of Object.values(all)) expect(src).toBeDefined();
  });

  it('has hex palette colours', () => {
    for (const c of Object.values(palette)) expect(c).toMatch(/^#[0-9A-F]{6}$/);
  });
});
