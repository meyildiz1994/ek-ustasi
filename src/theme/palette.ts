/** Art direction "Anatolian Iznik tile + paper-cut" (see docs/ASSET_PROMPTS.md). */
export const palette = {
  navy: '#1E2A5A',
  navyDeep: '#131B4B',
  turquoise: '#1FA6A0',
  cobalt: '#2753A6',
  pomegranate: '#C8323C',
  saffron: '#F2A93B',
  selection: '#FF8A3D',
  cream: '#FFF4E0',
} as const;

export type PaletteColor = keyof typeof palette;
