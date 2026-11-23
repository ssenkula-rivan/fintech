// GMG Global - Animated Emoji Component
// Provides shake, bounce, vibrate, explode animations with haptic feedback
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type AnimationType = 'shake' | 'bounce' | 'vibrate' | 'explode' | 'pulse' | 'wiggle' | 'pop';

interface AnimatedEmojiProps {
  emoji: string;
  animation?: AnimationType;
  size?: number;
  duration?: number;
  loop?: boolean;
  haptic?: boolean;
  delay?: number;
  style?: ViewStyle;
  onAnimationEnd?: () => void;
}

export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  emoji,
  animation = 'bounce',
  size = 24,
  duration = 500,
  loop = false,
  haptic = true,
  delay = 0,
  style,
  onAnimationEnd,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (haptic) triggerHaptic(animation);
      runAnimation();
    }, delay);

    return () => clearTimeout(timeout);
  }, [animation, loop]);

  const triggerHaptic = (type: AnimationType) => {
    switch (type) {
      case 'shake':
      case 'vibrate':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'explode':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'bounce':
      case 'pop':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'pulse':
      case 'wiggle':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  };

  const runAnimation = () => {
    animatedValue.setValue(0);
    scaleValue.setValue(1);
    opacityValue.setValue(1);

    const animations: Record<AnimationType, Animated.CompositeAnimation> = {
      shake: Animated.sequence([
        Animated.timing(animatedValue, { toValue: 10, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 10, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 6, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -6, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 3, duration: duration / 8, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: duration / 8, useNativeDriver: true }),
      ]),
      bounce: Animated.sequence([
        Animated.timing(animatedValue, { toValue: -20, duration: duration / 4, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: duration / 4, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: duration / 4, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: duration / 4, useNativeDriver: true }),
      ]),
      vibrate: Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, { toValue: 3, duration: 30, useNativeDriver: true }),
          Animated.timing(animatedValue, { toValue: -3, duration: 30, useNativeDriver: true }),
        ]),
        { iterations: Math.floor(duration / 60) }
      ),
      explode: Animated.parallel([
        Animated.timing(scaleValue, { toValue: 2, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(opacityValue, { toValue: 0, duration: duration, useNativeDriver: true }),
      ]),
      pulse: Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.3, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
      ]),
      wiggle: Animated.sequence([
        Animated.timing(animatedValue, { toValue: 15, duration: duration / 6, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -15, duration: duration / 6, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 10, duration: duration / 6, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: duration / 6, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 5, duration: duration / 6, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: duration / 6, useNativeDriver: true }),
      ]),
      pop: Animated.sequence([
        Animated.timing(scaleValue, { toValue: 0.8, duration: duration / 4, useNativeDriver: true }),
        Animated.spring(scaleValue, { toValue: 1.2, useNativeDriver: true, friction: 3 }),
        Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]),
    };

    const anim = animations[animation];
    if (loop && animation !== 'explode') {
      Animated.loop(anim).start();
    } else {
      anim.start(() => onAnimationEnd?.());
    }
  };

  const getTransform = () => {
    switch (animation) {
      case 'shake':
      case 'vibrate':
        return [{ translateX: animatedValue }];
      case 'bounce':
        return [{ translateY: animatedValue }];
      case 'wiggle':
        return [{ rotate: animatedValue.interpolate({ inputRange: [-15, 15], outputRange: ['-15deg', '15deg'] }) }];
      case 'explode':
      case 'pulse':
      case 'pop':
        return [{ scale: scaleValue }];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: getTransform(),
          opacity: opacityValue,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size }]}>{emoji}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});

export default AnimatedEmoji;
