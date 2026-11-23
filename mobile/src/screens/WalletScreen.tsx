// GMG Global Mobile App - Wallet Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTransactionType, getTransactionIcon } from '../utils/format';

// Light theme colors
const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FA',
  primary: '#0066FF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E8ECF0',
  card: '#F5F7FA',
  success: '#00C48C',
  error: '#FF4757',
};

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { user, wallets, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const loadData = useCallback(async () => {
    const result = await api.getTransactions(10);
    if (result.success && result.data) {
      setTransactions(result.data.transactions || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadData()]);
    setRefreshing(false);
  };

  const mainWallet = wallets.find(w => w.currency === 'UGX') || wallets[0];
  const balance = mainWallet?.balance || 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
          <Text style={styles.eyeIcon}>{showBalance ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {showBalance ? `UGX ${balance.toLocaleString()}` : '********'}
          </Text>
          
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Deposit')}>
              <View style={[styles.actionIconBg, { backgroundColor: '#00C48C20' }]}>
                <Text style={styles.actionEmoji}>💵</Text>
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Send')}>
              <View style={[styles.actionIconBg, { backgroundColor: '#0066FF20' }]}>
                <Text style={styles.actionEmoji}>📤</Text>
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Withdraw')}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FF475720' }]}>
                <Text style={styles.actionEmoji}>🏧</Text>
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Wallets</Text>
          {wallets.map((wallet, index) => (
            <View key={index} style={styles.walletItem}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletCurrency}>{wallet.currency}</Text>
                <Text style={styles.walletType}>
                  {wallet.currency === 'UGX' ? 'Mobile Money' : 'Crypto Wallet'}
                </Text>
              </View>
              <Text style={styles.walletBalance}>
                {showBalance ? formatCurrency(wallet.balance, wallet.currency) : '****'}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((txn) => (
              <View key={txn.id} style={styles.transactionItem}>
                <View style={styles.txnIconContainer}>
                  <Text style={styles.txnIcon}>{getTransactionIcon(txn.type)}</Text>
                </View>
                <View style={styles.txnDetails}>
                  <Text style={styles.txnType}>{formatTransactionType(txn.type)}</Text>
                  <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
                </View>
                <Text style={[styles.txnAmount, txn.type === 'DEPOSIT' && styles.txnPositive]}>
                  {txn.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat_700Bold' },
  eyeIcon: { fontSize: 24 },
  scrollContent: { padding: 20 },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 32, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginTop: 8 },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  actionButton: { alignItems: 'center' },
  actionIconBg: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  actionEmoji: { fontSize: 24 },
  actionText: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#FFFFFF', marginTop: 8 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 16 },
  seeAllLink: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  walletInfo: { flex: 1 },
  walletCurrency: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  walletType: { fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 2 },
  walletBalance: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  txnIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txnIcon: { fontSize: 20 },
  txnDetails: { flex: 1 },
  txnType: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  txnDate: { fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 2 },
  txnAmount: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  txnPositive: { color: '#10b981' },
});
