// GlitchText.tsx
// Glitch Text Effect Component for React Native
// Usage: <GlitchText text="GMG Uganda" style={styles.title} />
import React, { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, Animated, StyleProp, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface GlitchTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  glitchColor1?: string;
  glitchColor2?: string;
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'normal' | 'fast';
  haptic?: boolean;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  style,
  glitchColor1 = '#00ffff', // Cyan
  glitchColor2 = '#ff00ff', // Magenta
  intensity = 'medium',
  speed = 'normal',
  haptic = false,
}) => {
  // Animation values
  const glitchAnim1 = useRef(new Animated.Value(0)).current;
  const glitchAnim2 = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // State for random glitch positions
  const [glitchOffset1, setGlitchOffset1] = useState({ x: 0, y: 0 });
  const [glitchOffset2, setGlitchOffset2] = useState({ x: 0, y: 0 });

  // Intensity settings
  const intensitySettings = {
    low: { maxOffset: 2, frequency: 3000 },
    medium: { maxOffset: 4, frequency: 2000 },
    high: { maxOffset: 6, frequency: 1000 },
  };

  // Speed settings (duration in ms)
  const speedSettings = {
    slow: 500,
    normal: 300,
    fast: 150,
  };

  const { maxOffset, frequency } = intensitySettings[intensity];
  const duration = speedSettings[speed];

  useEffect(() => {
    // Random glitch effect
    const glitchInterval = setInterval(() => {
      // Random offsets for glitch layers
      const randomOffset1 = {
        x: (Math.random() - 0.5) * maxOffset * 2,
        y: (Math.random() - 0.5) * maxOffset,
      };
      const randomOffset2 = {
        x: (Math.random() - 0.5) * maxOffset * 2,
        y: (Math.random() - 0.5) * maxOffset,
      };

      setGlitchOffset1(randomOffset1);
      setGlitchOffset2(randomOffset2);

      // Haptic feedback on glitch (if enabled)
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animate glitch
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glitchAnim1, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim2, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glitchAnim1, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim2, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, frequency);

    return () => clearInterval(glitchInterval);
  }, [intensity, speed, haptic]);

  return (
    <View style={styles.container}>
      {/* Glitch Layer 1 - Cyan */}
      <Animated.Text
        style={[
          styles.glitchText,
          style,
          {
            color: glitchColor1,
            opacity: glitchAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
            transform: [
              {
                translateX: glitchAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, glitchOffset1.x],
                }),
              },
              {
                translateY: glitchAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, glitchOffset1.y],
                }),
              },
            ],
          },
        ]}
      >
        {text}
      </Animated.Text>

      {/* Glitch Layer 2 - Magenta */}
      <Animated.Text
        style={[
          styles.glitchText,
          style,
          {
            color: glitchColor2,
            opacity: glitchAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
            transform: [
              {
                translateX: glitchAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, glitchOffset2.x],
                }),
              },
              {
                translateY: glitchAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, glitchOffset2.y],
                }),
              },
            ],
          },
        ]}
      >
        {text}
      </Animated.Text>

      {/* Main Text */}
      <Animated.Text
        style={[
          styles.mainText,
          style,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glitchText: {
    position: 'absolute',
    fontWeight: 'bold',
  },
  mainText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default GlitchText;
