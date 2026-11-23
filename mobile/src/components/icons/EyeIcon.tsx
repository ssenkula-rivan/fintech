// Eye Icon Component for Balance Visibility Toggle
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface EyeIconProps {
  size?: number;
  color?: string;
  open?: boolean;
}

export default function EyeIcon({ size = 24, color = '#FFFFFF', open = true }: EyeIconProps) {
  if (open) {
    // Open eye - can see balance
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle
          cx="12"
          cy="12"
          r="3.5"
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    );
  }
  
  // Closed eye - balance hidden
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a11.05 11.05 0 0 1 5.06-6.06"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.11 11 7.5a11.05 11.05 0 0 1-4.17 5.17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.71 8.71a4 4 0 1 0 5.58 5.58"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
