// CyberGlitchText.tsx - SHAKING GLITCH EFFECT
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface Props {
  text: string;
  style?: any;
  primaryColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  enableScanlines?: boolean;
  enableSliceGlitch?: boolean;
  enableRGBSplit?: boolean;
  enableSignalNoise?: boolean;
}

const GLITCH = '░▒▓█▀▄◢◣!@#$%&*';

const CyberGlitchText: React.FC<Props> = ({
  text,
  style,
  primaryColor = '#00AAFF',
}) => {
  const [displayText, setDisplayText] = useState(text);
  
  // Animated values for SHAKING
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;
  const cyanX = useRef(new Animated.Value(-3)).current;
  const magentaX = useRef(new Animated.Value(3)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // CONTINUOUS SHAKE ANIMATION
  useEffect(() => {
    const shake = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 4, duration: 50, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(shakeX, { toValue: -4, duration: 50, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(shakeX, { toValue: 3, duration: 50, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(shakeX, { toValue: -3, duration: 50, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.linear }),
          Animated.delay(200),
        ])
      ).start();
    };
    shake();
  }, []);

  // VERTICAL SHAKE
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeY, { toValue: 2, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: -2, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.delay(300),
      ])
    ).start();
  }, []);

  // RGB SPLIT - Cyan moves left, Magenta moves right
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(cyanX, { toValue: -8, duration: 80, useNativeDriver: true }),
          Animated.timing(magentaX, { toValue: 8, duration: 80, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(cyanX, { toValue: -2, duration: 80, useNativeDriver: true }),
          Animated.timing(magentaX, { toValue: 2, duration: 80, useNativeDriver: true }),
        ]),
        Animated.delay(150),
      ])
    ).start();
  }, []);

  // FLICKER
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.8, duration: 30, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 30, useNativeDriver: true }),
        Animated.delay(400),
      ])
    ).start();
  }, []);

  // CHARACTER CORRUPTION
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = text.split('');
      const num = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < num; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        chars[idx] = GLITCH[Math.floor(Math.random() * GLITCH.length)];
      }
      setDisplayText(chars.join(''));
      setTimeout(() => setDisplayText(text), 100);
    }, 250);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <View style={styles.container}>
      {/* Scanlines */}
      <View style={styles.scanlines} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.scanline, { top: `${i * 16}%` }]} />
        ))}
      </View>

      {/* CYAN Layer */}
      <Animated.Text
        style={[
          styles.layer,
          style,
          {
            color: '#00FFFF',
            opacity: 0.7,
            transform: [{ translateX: cyanX }],
          },
        ]}
      >
        {text}
      </Animated.Text>

      {/* MAGENTA Layer */}
      <Animated.Text
        style={[
          styles.layer,
          style,
          {
            color: '#FF00FF',
            opacity: 0.7,
            transform: [{ translateX: magentaX }],
          },
        ]}
      >
        {text}
      </Animated.Text>

      {/* MAIN TEXT - SHAKES */}
      <Animated.Text
        style={[
          styles.mainText,
          style,
          {
            color: primaryColor,
            opacity: opacity,
            textShadowColor: '#00FFFF',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
            transform: [
              { translateX: shakeX },
              { translateY: shakeY },
            ],
          },
        ]}
      >
        {displayText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    overflow: 'visible',
  },
  layer: {
    position: 'absolute',
    fontWeight: 'bold',
  },
  mainText: {
    fontWeight: 'bold',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 10,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default CyberGlitchText;
