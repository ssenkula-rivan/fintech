// Intro Slides - First-time app onboarding
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  FlatList, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IntroSlidesProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: '1',
    emoji: '💰',
    title: 'Welcome to GMG Global',
    description: 'Your all-in-one mobile money and financial services app for Uganda.',
  },
  {
    id: '2',
    emoji: '📲',
    title: 'Send & Receive Money',
    description: 'Transfer money instantly to any phone number or bank account across Uganda.',
  },
  {
    id: '3',
    emoji: '💳',
    title: 'Pay Bills & Buy Airtime',
    description: 'Pay utilities, URA taxes, buy airtime and data bundles with one tap.',
  },
  {
    id: '4',
    emoji: '📈',
    title: 'Invest & Grow',
    description: 'Trade forex, stocks, crypto and commodities. Save and earn interest.',
  },
  {
    id: '5',
    emoji: '🔐',
    title: 'Safe & Secure',
    description: 'Bank-grade security with PIN, biometrics, and 2FA protection.',
  },
];

export default function IntroSlides({ onComplete }: IntroSlidesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.dotActive]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: '#BBBBBB',
    fontSize: 16,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#0066FF',
    width: 30,
  },
  nextButton: {
    backgroundColor: '#0066FF',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
  },
});
