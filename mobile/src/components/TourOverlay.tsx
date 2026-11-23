// Tour Overlay - Screen tour with coach marks
import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import CoachMark from './CoachMark';

export default function TourOverlay() {
  const { currentTour, currentTooltipIndex, showTooltip, nextTooltip, skipTour } = useOnboarding();

  if (!currentTour || !showTooltip) return null;

  const currentTooltip = currentTour.tooltips[currentTooltipIndex];
  if (!currentTooltip) return null;

  return (
    <Modal transparent visible={showTooltip} animationType="fade">
      <TouchableWithoutFeedback onPress={nextTooltip}>
        <View style={styles.overlay}>
          <CoachMark
            title={currentTooltip.title}
            description={currentTooltip.description}
            position={currentTooltip.position}
            currentStep={currentTooltipIndex}
            totalSteps={currentTour.tooltips.length}
            onNext={nextTooltip}
            onSkip={skipTour}
          />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
});
