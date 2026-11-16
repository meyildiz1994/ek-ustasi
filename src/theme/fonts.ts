/**
 * Baloo 2 (SIL OFL 1.1, see LICENSES.md), static instances subset to Latin + Turkish.
 * Use the family per weight; never fontWeight (custom fonts ignore it on Android).
 */
export const fontFiles = {
  'Baloo2-Medium': require('../../assets/fonts/Baloo2-Medium.ttf'),
  'Baloo2-Bold': require('../../assets/fonts/Baloo2-Bold.ttf'),
  'Baloo2-ExtraBold': require('../../assets/fonts/Baloo2-ExtraBold.ttf'),
};

export const fonts = {
  medium: 'Baloo2-Medium',
  bold: 'Baloo2-Bold',
  extraBold: 'Baloo2-ExtraBold',
} as const satisfies Record<string, keyof typeof fontFiles>;
