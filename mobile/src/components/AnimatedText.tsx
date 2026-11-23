// GMG Global - Animated Text Component
// Text with micro-interactions and haptic feedback
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type TextAnimation = 'fadeIn' | 'slideUp' | 'slideDown' | 'typewriter' | 'scale' | 'shake' | 'glow';

interface AnimatedTextProps {
  children: string;
  animation?: TextAnimation;
  duration?: number;
  delay?: number;
  style?: TextStyle;
  haptic?: boolean;
  onAnimationEnd?: () => void;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  animation = 'fadeIn',
  duration = 400,
  delay = 0,
  style,
  haptic = false,
  onAnimationEnd,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      runAnimation();
    }, delay);

    return () => clearTimeout(timeout);
  }, [animation]);

  const runAnimation = () => {
    opacity.setValue(animation === 'fadeIn' || animation === 'slideUp' || animation === 'slideDown' ? 0 : 1);
    translateY.setValue(animation === 'slideUp' ? 30 : animation === 'slideDown' ? -30 : 0);
    scale.setValue(animation === 'scale' ? 0.5 : 1);
    translateX.setValue(0);

    const animations: Record<TextAnimation, Animated.CompositeAnimation> = {
      fadeIn: Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
      slideUp: Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]),
      slideDown: Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]),
      typewriter: Animated.timing(opacity, { toValue: 1, duration: duration * 2, useNativeDriver: true }),
      scale: Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]),
      shake: Animated.sequence([
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      glow: Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: duration / 2, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ),
    };

    animations[animation].start(() => onAnimationEnd?.());
  };

  return (
    <Animated.Text
      style={[
        styles.text,
        style,
        {
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Montserrat_400Regular',
  },
});

export default AnimatedText;
