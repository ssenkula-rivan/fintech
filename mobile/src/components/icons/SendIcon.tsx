import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface SendIconProps {
  size?: number;
  color?: string;
}

export default function SendIcon({ size = 24, color = '#FFFFFF' }: SendIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G transform="translate(-570, -257)">
        <Path
          d="M580.407,278.75 C581.743,281.205 586,289 586,289 C586,289 601.75,258.5 602,258 L602.02,257.91 L580.407,278.75 L580.407,278.75 Z M570,272 C570,272 577.298,276.381 579.345,277.597 L601,257 C598.536,258.194 570,272 570,272 L570,272 Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
