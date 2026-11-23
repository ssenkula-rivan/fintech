// GMG Uganda Mobile App - Transactions Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTransactionType, getTransactionIcon } from '../utils/format';

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadTransactions = useCallback(async (offset = 0, append = false) => {
    const result = await api.getTransactions(20, offset);
    if (result.success && result.data) {
      const newTxns = result.data.transactions || [];
      if (append) {
        setTransactions(prev => [...prev, ...newTxns]);
      } else {
        setTransactions(newTxns);
      }
      setHasMore(newTxns.length === 20);
    }
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions(0, false);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadTransactions(transactions.length, true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'FAILED': return '#ef4444';
      default: return '#BBBBBB';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={[styles.txnItem, { backgroundColor: colors.card }]}>
      <View style={[styles.txnIconContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.txnIcon}>{getTransactionIcon(item.type)}</Text>
      </View>
      <View style={styles.txnDetails}>
        <Text style={[styles.txnType, { color: colors.text }]}>{formatTransactionType(item.type)}</Text>
        <Text style={[styles.txnMeta, { color: colors.textSecondary }]}>
          {item.counterpartyName || item.counterpartyPhone || item.reference}
        </Text>
        <View style={styles.txnStatusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          <Text style={[styles.txnDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={[
        styles.txnAmount,
        item.type === 'DEPOSIT' ? styles.txnPositive : { color: colors.text }
      ]}>
        {item.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#0066FF" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={{ width: 50 }} />
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Your transaction history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold' },
  list: { padding: 20, paddingTop: 0 },
  txnItem: { 
    flexDirection: 'row', alignItems: 'center', 
    borderRadius: 16, padding: 16, marginBottom: 12 
  },
  txnIconContainer: { 
    width: 48, height: 48, borderRadius: 24, 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  txnIcon: { fontSize: 20 },
  txnDetails: { flex: 1 },
  txnType: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  txnMeta: { fontSize: 13, color: '#BBBBBB', marginTop: 2 },
  txnStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  txnDate: { fontSize: 12, color: '#666' },
  txnAmount: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  txnPositive: { color: '#10b981' },
  txnNegative: { },
  footer: { paddingVertical: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#BBBBBB', textAlign: 'center' },
});
