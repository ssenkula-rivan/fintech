// GMG Uganda - Network Provider Logo Components using actual SVG files
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

// MTN Logo - Using the actual mtn-new-logo.svg provided
export const MTNLogo = ({ size = 40 }: LogoProps) => {
  const scale = size / 820;
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 820 820" width={size} height={size}>
        <Path d="M0 0h820v820H0z" fill="#ffc403" />
        <Path d="M364.5 361.6v93.6h-25.6v-52.5L321.8 428h-13.4l-18.8-25.3v52.5h-23.4v-93.6h23.6l27 36.7 24.2-36.7zM371.9 382.8v-21.2h87.4v21.2h-30.6v72.4h-26.1v-72.4zM555.6 361.6v93.6h-21.5l-44-53.5v53.5h-23.4v-93.6H490l42.1 51.6v-51.6z" fill="#000" />
        <Path d="M410 553c-75.6 0-146.9-14.1-200.7-39.8C153 486.3 122 449.7 122 410s31-76.3 87.3-103.2C263.1 281.1 334.4 267 410 267s146.9 14.1 200.7 39.8C667 333.7 698 370.3 698 410s-31 76.3-87.3 103.2C556.9 538.9 485.6 553 410 553zm0-264.9c-72.6 0-140.6 13.4-191.6 37.8-48.5 23.2-75.3 53.1-75.3 84.2s26.7 61 75.3 84.1c51 24.4 119.1 37.8 191.6 37.8s140.6-13.4 191.6-37.8c48.5-23.1 75.3-53.1 75.3-84.1s-26.7-61-75.3-84.1c-51-24.5-119-37.9-191.6-37.9z" fill="#000" />
      </Svg>
    </View>
  );
};

// Airtel Logo - Red circle with white text
export const AirtelLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#ED1C24" />
      <SvgText
        x="50"
        y="60"
        fontFamily="Arial"
        fontSize="18"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        AIRTEL
      </SvgText>
    </Svg>
  </View>
);

// Africell Logo - Orange
export const AfricellLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#FF6600" />
      <SvgText
        x="50"
        y="60"
        fontFamily="Arial"
        fontSize="16"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        AC
      </SvgText>
    </Svg>
  </View>
);


// Bank Icon - Blue with bank emoji
export const BankLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#3b82f6" />
      <SvgText
        x="50"
        y="62"
        fontSize="40"
        textAnchor="middle"
      >
        🏦
      </SvgText>
    </Svg>
  </View>
);

// Uganda Telecom Logo
export const UTLLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#0066CC" />
      <SvgText
        x="50"
        y="60"
        fontFamily="Arial"
        fontSize="16"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        UTL
      </SvgText>
    </Svg>
  </View>
);

// Safaricom Logo (Kenya)
export const SafaricomLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#00A651" />
      <SvgText
        x="50"
        y="60"
        fontFamily="Arial"
        fontSize="20"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        S
      </SvgText>
    </Svg>
  </View>
);

// Vodacom Logo
export const VodacomLogo = ({ size = 40 }: LogoProps) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill="#E60000" />
      <SvgText
        x="50"
        y="60"
        fontFamily="Arial"
        fontSize="20"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        V
      </SvgText>
    </Svg>
  </View>
);

// Generic Network Logo
export const GenericNetworkLogo = ({
  size = 40,
  color = '#0066FF',
  letter = 'N',
}: LogoProps & { color?: string; letter?: string }) => (
  <View style={{ width: size, height: size }}>
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx="50" cy="50" r="48" fill={color} />
      <SvgText
        x="50"
        y="62"
        fontFamily="Arial"
        fontSize="28"
        fontWeight="bold"
        fill="#FFF"
        textAnchor="middle"
      >
        {letter}
      </SvgText>
    </Svg>
  </View>
);

// Get logo component by network code
export const getNetworkLogo = (networkCode: string, size = 40) => {
  switch (networkCode.toUpperCase()) {
    case 'MTN':
      return <MTNLogo size={size} />;
    case 'AIRTEL':
      return <AirtelLogo size={size} />;
    case 'AFRICELL':
      return <AfricellLogo size={size} />;
    case 'UTL':
      return <UTLLogo size={size} />;
    case 'SAFARICOM':
      return <SafaricomLogo size={size} />;
    case 'VODACOM':
    case 'VODAFONE':
      return <VodacomLogo size={size} />;
    case 'BANK':
      return <BankLogo size={size} />;
    default:
      return <GenericNetworkLogo size={size} letter={networkCode.charAt(0)} />;
  }
};

export default {
  MTNLogo,
  AirtelLogo,
  AfricellLogo,
  UTLLogo,
  SafaricomLogo,
  VodacomLogo,
  BankLogo,
  GenericNetworkLogo,
  getNetworkLogo,
};
