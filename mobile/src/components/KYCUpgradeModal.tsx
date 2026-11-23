// GMG Uganda - KYC Upgrade Modal
// Shows verification steps for basic account users

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface KYCUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onStartVerification: () => void;
  currentTier: number;
}

const TIER_INFO = {
  1: {
    name: 'Basic',
    color: '#f59e0b',
    limits: 'UGX 500,000/day',
    features: ['Send & Receive Money', 'Mobile Money Deposits'],
  },
  2: {
    name: 'Standard',
    color: '#10b981',
    limits: 'UGX 5,000,000/day',
    features: ['All Basic Features', 'Bank Transfers', 'Bill Payments', 'Higher Limits'],
  },
  3: {
    name: 'Premium',
    color: '#0066FF',
    limits: 'UGX 50,000,000/day',
    features: ['All Standard Features', 'Crypto Trading', 'International Transfers', 'Priority Support'],
  },
};

const VERIFICATION_STEPS = [
  {
    step: 1,
    title: 'Personal Information',
    description: 'Provide your full name, date of birth, and address',
    icon: '👤',
    time: '2 min',
  },
  {
    step: 2,
    title: 'ID Verification',
    description: 'Upload a photo of your National ID or Passport',
    icon: '🪪',
    time: '3 min',
  },
  {
    step: 3,
    title: 'Selfie Verification',
    description: 'Take a quick selfie to confirm your identity',
    icon: '🤳',
    time: '1 min',
  },
  {
    step: 4,
    title: 'Review & Approval',
    description: 'We\'ll verify your documents within 24 hours',
    icon: '✅',
    time: '24 hrs',
  },
];

export default function KYCUpgradeModal({
  visible,
  onClose,
  onStartVerification,
  currentTier,
}: KYCUpgradeModalProps) {
  const tierInfo = TIER_INFO[currentTier as keyof typeof TIER_INFO] || TIER_INFO[1];
  const nextTier = TIER_INFO[(currentTier + 1) as keyof typeof TIER_INFO] || TIER_INFO[2];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.tierBadge, { backgroundColor: tierInfo.color }]}>
              <Text style={styles.tierBadgeText}>{tierInfo.name} Account</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Upgrade Message */}
            <View style={styles.upgradeMessage}>
              <Text style={styles.upgradeIcon}>🚀</Text>
              <Text style={styles.upgradeTitle}>Upgrade to {nextTier.name}</Text>
              <Text style={styles.upgradeSubtitle}>
                Unlock higher limits and more features by verifying your identity
              </Text>
            </View>

            {/* Current vs Next Tier Comparison */}
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonBox}>
                <Text style={[styles.comparisonTier, { color: tierInfo.color }]}>
                  Current: {tierInfo.name}
                </Text>
                <Text style={styles.comparisonLimit}>{tierInfo.limits}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.comparisonBox}>
                <Text style={[styles.comparisonTier, { color: nextTier.color }]}>
                  Upgrade: {nextTier.name}
                </Text>
                <Text style={styles.comparisonLimit}>{nextTier.limits}</Text>
              </View>
            </View>

            {/* Features Unlocked */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Features You'll Unlock</Text>
              {nextTier.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Verification Steps */}
            <View style={styles.stepsSection}>
              <Text style={styles.sectionTitle}>Verification Steps</Text>
              {VERIFICATION_STEPS.map((step, index) => (
                <View key={step.step} style={styles.stepItem}>
                  <View style={styles.stepIconContainer}>
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepTime}>{step.time}</Text>
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                  {index < VERIFICATION_STEPS.length - 1 && (
                    <View style={styles.stepConnector} />
                  )}
                </View>
              ))}
            </View>

            {/* Total Time */}
            <View style={styles.totalTime}>
              <Text style={styles.totalTimeIcon}>⏱️</Text>
              <Text style={styles.totalTimeText}>
                Total time: ~6 minutes + 24hr review
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={onStartVerification}
            >
              <Text style={styles.verifyButtonText}>Start Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierBadgeText: {
    color: '#fff',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#BBBBBB',
    fontSize: 16,
  },
  upgradeMessage: {
    alignItems: 'center',
    padding: 24,
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  comparisonTier: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  comparisonLimit: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Montserrat_700Bold',
  },
  arrow: {
    fontSize: 20,
    color: '#0066FF',
    marginHorizontal: 12,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    color: '#10b981',
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
  },
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
  },
  stepTime: {
    fontSize: 12,
    color: '#0066FF',
  },
  stepDescription: {
    fontSize: 12,
    color: '#BBBBBB',
    lineHeight: 18,
  },
  stepConnector: {
    position: 'absolute',
    left: 21,
    top: 44,
    width: 2,
    height: 24,
    backgroundColor: '#1a1a1a',
  },
  totalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 20,
  },
  totalTimeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  totalTimeText: {
    color: '#ccc',
    fontSize: 13,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  verifyButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#BBBBBB',
    fontSize: 14,
  },
});
