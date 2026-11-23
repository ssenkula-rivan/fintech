// GMG Uganda - Savings Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
  deadline?: string;
}

const MOCK_GOALS: SavingsGoal[] = [
  { id: '1', name: 'Emergency Fund', target: 5000000, saved: 2500000, icon: '🏥' },
  { id: '2', name: 'New Phone', target: 2000000, saved: 800000, icon: '📱' },
  { id: '3', name: 'School Fees', target: 3000000, saved: 1200000, icon: '🎓', deadline: '2025-02-01' },
];

export default function SavingsScreen({ navigation }: { navigation: any }) {
  const { wallets } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [goals, setGoals] = useState<SavingsGoal[]>(MOCK_GOALS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const balance = wallets.find(w => w.currency === 'UGX')?.balance || 0;

  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalTarget) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoalName,
      target: parseInt(newGoalTarget),
      saved: 0,
      icon: '🎯',
    };
    setGoals([...goals, newGoal]);
    setShowCreateModal(false);
    setNewGoalName('');
    setNewGoalTarget('');
    Alert.alert('Success', 'Savings goal created!');
  };

  const handleDeposit = () => {
    if (!selectedGoal || !depositAmount) return;
    const amount = parseInt(depositAmount);
    if (amount > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setGoals(goals.map(g => 
        g.id === selectedGoal.id ? { ...g, saved: g.saved + amount } : g
      ));
      setLoading(false);
      setShowDepositModal(false);
      setDepositAmount('');
      Alert.alert('Success', `${formatCurrency(amount)} added to ${selectedGoal.name}!`);
    }, 1500);
  };

  const openDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowDepositModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('savings.title')}</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Text style={[styles.addBtn, { color: colors.success }]}>+ {t('beneficiaries.addNew')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('savings.totalSavings')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalSaved)}</Text>
          <Text style={styles.summaryGoals}>{goals.length} active goals</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Goals</Text>
          {goals.map(goal => {
            const progress = (goal.saved / goal.target) * 100;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.card }]}
                onPress={() => openDeposit(goal)}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                    <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>Target: {formatCurrency(goal.target)}</Text>
                  </View>
                  <Text style={[styles.goalPercent, { color: colors.success }]}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
                <View style={styles.goalFooter}>
                  <Text style={[styles.goalSaved, { color: colors.success }]}>{formatCurrency(goal.saved)} saved</Text>
                  <Text style={[styles.goalRemaining, { color: colors.textSecondary }]}>{formatCurrency(goal.target - goal.saved)} to go</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 Savings Tips</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>• Set up automatic weekly deposits</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>• Start small - even UGX 5,000/week adds up</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>• Track your progress regularly</Text>
        </View>
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Goal Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={newGoalName}
                onChangeText={setNewGoalName}
                placeholder="e.g., New Laptop"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Amount (UGX)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateGoal}>
              <Text style={styles.createBtnText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to {selectedGoal?.name}</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.availableBalance, { color: colors.textSecondary }]}>Available: {formatCurrency(balance)}</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (UGX)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.depositBtn, loading && styles.btnDisabled]}
              onPress={handleDeposit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.depositBtnText}>Add to Savings</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  addBtn: { color: '#10B981', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  summaryCard: { backgroundColor: '#10B981', margin: 16, padding: 24, borderRadius: 20, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  summaryValue: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Montserrat_700Bold', marginTop: 4 },
  summaryGoals: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  goalCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalIcon: { fontSize: 32, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  goalTarget: { color: '#CCCCCC', fontSize: 12, marginTop: 2 },
  goalPercent: { color: '#10B981', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  goalSaved: { color: '#10B981', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  goalRemaining: { color: '#CCCCCC', fontSize: 14 },
  tipsCard: { margin: 16, padding: 16, borderRadius: 16 },
  tipsTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  tipsText: { color: '#CCCCCC', fontSize: 14, marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalClose: { color: '#CCCCCC', fontSize: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#CCCCCC', fontSize: 13, marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 18 },
  availableBalance: { color: '#CCCCCC', fontSize: 14, marginBottom: 16 },
  createBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  depositBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  depositBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
