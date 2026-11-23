// GMG System - Referral Program Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Clipboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ReferralScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Generate referral code from user ID
  const referralCode = `GMG-${(user?.id || 'USER01').toString().slice(-6).toUpperCase().padStart(6, 'X')}`;
  
  const referralStats = {
    totalReferrals: 12,
    pendingReferrals: 3,
    completedReferrals: 9,
    totalEarnings: 1.35,
    pendingEarnings: 0.45,
  };

  const milestones = [
    { count: 10, bonus: 1, reached: referralStats.completedReferrals >= 10 },
    { count: 25, bonus: 3, reached: referralStats.completedReferrals >= 25 },
    { count: 50, bonus: 7, reached: referralStats.completedReferrals >= 50 },
    { count: 100, bonus: 15, reached: referralStats.completedReferrals >= 100 },
    { count: 500, bonus: 100, reached: referralStats.completedReferrals >= 500 },
  ];

  const copyCode = async () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Join GMG System and get $0.30 bonus! Use my referral code: ${referralCode}\n\nDownload: https://gmgsystem.com/download`,
        title: 'Join GMG System',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('referral.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Referral Code Card */}
        <View style={[styles.codeCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeText}>{referralCode}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeBtn} onPress={copyCode}>
              <Text style={styles.codeBtnText}>{copied ? '✓ Copied!' : '📋 Copy'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeBtn} onPress={shareCode}>
              <Text style={styles.codeBtnText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rewards Info */}
        <View style={[styles.rewardsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Earn Rewards</Text>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>You earn per referral:</Text>
            <Text style={[styles.rewardValue, { color: colors.success }]}>$0.15</Text>
          </View>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>Friend gets:</Text>
            <Text style={[styles.rewardValue, { color: colors.success }]}>$0.30</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{referralStats.totalReferrals}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{referralStats.pendingReferrals}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{referralStats.completedReferrals}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>${referralStats.totalEarnings.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Earned</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={[styles.milestonesCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Milestones</Text>
          {milestones.map((m, i) => (
            <View key={i} style={[styles.milestoneRow, { borderBottomColor: colors.border }]}>
              <View style={styles.milestoneInfo}>
                <Text style={[styles.milestoneCount, { color: m.reached ? colors.success : colors.text }]}>
                  {m.reached ? '✓' : '○'} {m.count} referrals
                </Text>
              </View>
              <Text style={[styles.milestoneBonus, { color: m.reached ? colors.success : colors.textMuted }]}>
                +${m.bonus} bonus
              </Text>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorks, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 How It Works</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Share your unique code with friends</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Friend signs up & completes KYC</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Both of you get rewarded!</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  codeCard: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  codeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  codeText: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Montserrat_700Bold', letterSpacing: 2 },
  codeActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  codeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  codeBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  rewardsCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 12 },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rewardLabel: { fontSize: 14 },
  rewardValue: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  statsCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Montserrat_700Bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  milestonesCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 12 },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  milestoneInfo: { flexDirection: 'row', alignItems: 'center' },
  milestoneCount: { fontSize: 14 },
  milestoneBonus: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  howItWorks: { marginHorizontal: 16, padding: 16, borderRadius: 12 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0066FF', color: '#FFFFFF', textAlign: 'center', lineHeight: 28, fontFamily: 'Montserrat_700Bold', marginRight: 12 },
  stepText: { flex: 1, fontSize: 14 },
});
