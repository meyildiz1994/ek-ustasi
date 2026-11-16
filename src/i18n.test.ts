import { t } from './i18n';

describe('t', () => {
  it('looks up nested keys', () => expect(t('home.play')).toBe('Oyna'));
  it('returns the key when missing', () => {
    expect(t('home.nope')).toBe('home.nope');
    expect(t('home.play.deeper')).toBe('home.play.deeper');
    expect(t('home')).toBe('home');
  });
  it('interpolates params and leaves unknown placeholders', () => {
    expect(t('morph.orderMax', { max: 12 })).toBe('En fazla 12 ek takabilirsin.');
    expect(t('morph.orderMax', {})).toBe('En fazla {max} ek takabilirsin.');
  });
});
