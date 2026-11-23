// GMG Global - Font Utilities
// Montserrat font family constants for consistent typography

export const fonts = {
  light: 'Montserrat_300Light',
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

// Font family names for direct use in styles
export const FONT_LIGHT = 'Montserrat_300Light';
export const FONT_REGULAR = 'Montserrat_400Regular';
export const FONT_MEDIUM = 'Montserrat_500Medium';
export const FONT_SEMIBOLD = 'Montserrat_600SemiBold';
export const FONT_BOLD = 'Montserrat_700Bold';

export type FontWeight = keyof typeof fonts;

// Helper to get font family by weight
export const getFont = (weight: FontWeight = 'regular'): string => {
  return fonts[weight];
};

// Map fontWeight values to Montserrat font families
export const fontWeightToFamily: Record<string, string> = {
  '300': FONT_LIGHT,
  '400': FONT_REGULAR,
  '500': FONT_MEDIUM,
  '600': FONT_SEMIBOLD,
  '700': FONT_BOLD,
  'normal': FONT_REGULAR,
  'bold': FONT_BOLD,
  'light': FONT_LIGHT,
  'medium': FONT_MEDIUM,
  'semibold': FONT_SEMIBOLD,
};
