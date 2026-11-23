// GMG Global - Transaction Limits Screen
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const TIER_LIMITS = [
  {
    tier: 1,
    name: 'Basic',
    color: '#f59e0b',
    icon: '📱',
    requirements: 'Phone verification only',
    limits: {
      dailySend: 500000,
      dailyReceive: 1000000,
      maxBalance: 2000000,
      singleTransaction: 200000,
    }
  },
  {
    tier: 2,
    name: 'Verified',
    color: '#3b82f6',
    icon: '🪪',
    requirements: 'National ID + Selfie',
    limits: {
      dailySend: 5000000,
      dailyReceive: 10000000,
      maxBalance: 20000000,
      singleTransaction: 2000000,
    }
  },
  {
    tier: 3,
    name: 'Premium',
    color: '#10b981',
    icon: '⭐',
    requirements: 'Full KYC + Proof of Address',
    limits: {
      dailySend: 50000000,
      dailyReceive: -1, // Unlimited
      maxBalance: -1, // Unlimited
      singleTransaction: 20000000,
    }
  },
];

const formatLimit = (amount: number) => {
  if (amount === -1) return 'Unlimited';
  return `UGX ${amount.toLocaleString()}`;
};

export default function LimitsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  const currentTier = user?.kycTier || 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('limits.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('limits.title')}</Text>
        </View>

        {/* Current Tier */}
        <View style={[styles.currentTierCard, { backgroundColor: colors.card }]}>
          <View style={styles.currentTierHeader}>
            <Text style={[styles.currentTierLabel, { color: colors.textSecondary }]}>Your Current Tier</Text>
            <View style={[styles.tierBadge, { backgroundColor: TIER_LIMITS[currentTier - 1].color }]}>
              <Text style={styles.tierBadgeText}>
                {TIER_LIMITS[currentTier - 1].icon} TIER {currentTier}
              </Text>
            </View>
          </View>
          <Text style={[styles.currentTierName, { color: colors.text }]}>{TIER_LIMITS[currentTier - 1].name}</Text>
          
          {currentTier < 3 && (
            <TouchableOpacity 
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('KYC')}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Tier {currentTier + 1} →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Your Current Limits */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Your Current Limits</Text>
          <View style={styles.limitsGrid}>
            <View style={[styles.limitCard, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.limitIcon}>📤</Text>
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Daily Send</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(TIER_LIMITS[currentTier - 1].limits.dailySend)}
              </Text>
            </View>
            <View style={[styles.limitCard, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.limitIcon}>📥</Text>
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Daily Receive</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(TIER_LIMITS[currentTier - 1].limits.dailyReceive)}
              </Text>
            </View>
            <View style={[styles.limitCard, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.limitIcon}>💰</Text>
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Max Balance</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(TIER_LIMITS[currentTier - 1].limits.maxBalance)}
              </Text>
            </View>
            <View style={[styles.limitCard, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.limitIcon}>💸</Text>
              <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Per Transaction</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>
                {formatLimit(TIER_LIMITS[currentTier - 1].limits.singleTransaction)}
              </Text>
            </View>
          </View>
        </View>

        {/* All Tiers Comparison */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 All Tier Limits</Text>
          {TIER_LIMITS.map((tier) => (
            <View 
              key={tier.tier} 
              style={[
                styles.tierCard, 
                { borderColor: tier.color, backgroundColor: colors.surfaceVariant },
                tier.tier === currentTier && styles.tierCardActive
              ]}
            >
              <View style={styles.tierCardHeader}>
                <View style={[styles.tierBadgeSmall, { backgroundColor: tier.color }]}>
                  <Text style={styles.tierBadgeSmallText}>{tier.icon} Tier {tier.tier}</Text>
                </View>
                {tier.tier === currentTier && (
                  <View style={styles.currentLabel}>
                    <Text style={styles.currentLabelText}>Current</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tierCardName, { color: colors.text }]}>{tier.name}</Text>
              <Text style={[styles.tierCardReq, { color: colors.textSecondary }]}>{tier.requirements}</Text>
              
              <View style={styles.tierLimits}>
                <View style={styles.tierLimitRow}>
                  <Text style={[styles.tierLimitLabel, { color: colors.textSecondary }]}>Daily Send:</Text>
                  <Text style={[styles.tierLimitValue, { color: colors.text }]}>{formatLimit(tier.limits.dailySend)}</Text>
                </View>
                <View style={styles.tierLimitRow}>
                  <Text style={[styles.tierLimitLabel, { color: colors.textSecondary }]}>Daily Receive:</Text>
                  <Text style={[styles.tierLimitValue, { color: colors.text }]}>{formatLimit(tier.limits.dailyReceive)}</Text>
                </View>
                <View style={styles.tierLimitRow}>
                  <Text style={[styles.tierLimitLabel, { color: colors.textSecondary }]}>Max Balance:</Text>
                  <Text style={[styles.tierLimitValue, { color: colors.text }]}>{formatLimit(tier.limits.maxBalance)}</Text>
                </View>
                <View style={styles.tierLimitRow}>
                  <Text style={[styles.tierLimitLabel, { color: colors.textSecondary }]}>Per Transaction:</Text>
                  <Text style={[styles.tierLimitValue, { color: colors.text }]}>{formatLimit(tier.limits.singleTransaction)}</Text>
                </View>
              </View>

              {tier.tier > currentTier && (
                <TouchableOpacity 
                  style={[styles.tierUpgradeBtn, { backgroundColor: tier.color }]}
                  onPress={() => navigation.navigate('KYC')}
                >
                  <Text style={styles.tierUpgradeBtnText}>Upgrade to Tier {tier.tier}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: colors.card }]}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Limits reset daily at midnight (EAT). Upgrade your KYC tier to enjoy higher limits and more features.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { backgroundColor: '#0066FF', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  
  currentTierCard: { margin: 16, borderRadius: 16, padding: 20 },
  currentTierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  currentTierLabel: { color: '#888', fontSize: 14 },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tierBadgeText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  currentTierName: { fontSize: 28, fontFamily: 'Montserrat_700Bold', marginBottom: 12 },
  upgradeBtn: { backgroundColor: '#0066FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  upgradeBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  
  section: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  
  limitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  limitCard: { width: '48%', borderRadius: 12, padding: 14, alignItems: 'center' },
  limitIcon: { fontSize: 24, marginBottom: 8 },
  limitLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  limitValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, textAlign: 'center' },
  
  tierCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2 },
  tierCardActive: { borderWidth: 2 },
  tierCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tierBadgeSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tierBadgeSmallText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  currentLabel: { backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  currentLabelText: { color: '#10b981', fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  tierCardName: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  tierCardReq: { color: '#888', fontSize: 13, marginTop: 2, marginBottom: 12 },
  tierLimits: { gap: 6 },
  tierLimitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tierLimitLabel: { color: '#888', fontSize: 13 },
  tierLimitValue: { fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  tierUpgradeBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tierUpgradeBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },
  
  infoNote: { flexDirection: 'row', margin: 16, borderRadius: 12, padding: 14, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, marginRight: 10 },
  infoText: { flex: 1, color: '#888', fontSize: 13, lineHeight: 18 },
});
