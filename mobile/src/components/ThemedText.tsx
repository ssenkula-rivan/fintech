// GMG Global - Themed Text Components with Montserrat Font
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface ThemedTextProps extends TextProps {
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
}

const fontFamilies = {
  light: 'Montserrat_300Light',
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};

export function Text({ style, weight = 'regular', ...props }: ThemedTextProps) {
  return (
    <RNText
      {...props}
      style={[{ fontFamily: fontFamilies[weight] }, style]}
    />
  );
}

// Pre-styled variants for convenience
export function TextLight(props: TextProps) {
  return <Text {...props} weight="light" />;
}

export function TextMedium(props: TextProps) {
  return <Text {...props} weight="medium" />;
}

export function TextSemiBold(props: TextProps) {
  return <Text {...props} weight="semibold" />;
}

export function TextBold(props: TextProps) {
  return <Text {...props} weight="bold" />;
}

export default Text;
