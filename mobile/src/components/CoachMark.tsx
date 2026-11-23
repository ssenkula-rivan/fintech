// Coach Mark Tooltip Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoachMarkProps {
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function CoachMark({
  title,
  description,
  position,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: CoachMarkProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={[styles.container, styles[position]]}>
      <View style={styles.tooltip}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.footer}>
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentStep && styles.dotActive]}
              />
            ))}
          </View>
          
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>{isLastStep ? 'Done' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={[styles.arrow, styles[`arrow_${position}`]]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    width: SCREEN_WIDTH - 40,
    left: 20,
  },
  top: { top: 100 },
  bottom: { bottom: 100 },
  left: { left: 20 },
  right: { right: 20 },
  tooltip: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  nextBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  nextText: {
    color: '#0066FF',
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0066FF',
  },
  arrow_top: {
    top: -10,
    left: '50%',
    marginLeft: -10,
    transform: [{ rotate: '180deg' }],
  },
  arrow_bottom: {
    bottom: -10,
    left: '50%',
    marginLeft: -10,
  },
  arrow_left: {
    left: -10,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '90deg' }],
  },
  arrow_right: {
    right: -10,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '-90deg' }],
  },
});
