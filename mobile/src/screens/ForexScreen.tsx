// GMG Uganda - Forex Trading Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface ForexPair {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
}

const forexPairs: ForexPair[] = [
  { symbol: 'USD/UGX', name: 'US Dollar', bid: 3745, ask: 3755, change: 5, changePercent: 0.13 },
  { symbol: 'EUR/UGX', name: 'Euro', bid: 4085, ask: 4095, change: -12, changePercent: -0.29 },
  { symbol: 'GBP/UGX', name: 'British Pound', bid: 4750, ask: 4765, change: 25, changePercent: 0.53 },
  { symbol: 'KES/UGX', name: 'Kenyan Shilling', bid: 24.5, ask: 24.8, change: 0.1, changePercent: 0.41 },
  { symbol: 'TZS/UGX', name: 'Tanzanian Shilling', bid: 1.48, ask: 1.52, change: -0.02, changePercent: -1.32 },
  { symbol: 'RWF/UGX', name: 'Rwandan Franc', bid: 2.95, ask: 3.05, change: 0.03, changePercent: 1.02 },
];

export default function ForexScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const handleTrade = () => {
    if (!selectedPair || !amount) {
      Alert.alert('Error', 'Please select a pair and enter amount');
      return;
    }
    const rate = orderType === 'buy' ? selectedPair.ask : selectedPair.bid;
    const total = parseFloat(amount) * rate;
    Alert.alert(
      'Confirm Trade',
      `${orderType.toUpperCase()} ${amount} ${selectedPair.symbol.split('/')[0]} at ${rate}\nTotal: UGX ${total.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Trade executed successfully!') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.success }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('forex.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Market Overview */}
        <View style={styles.marketOverview}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('forex.liveRates')}</Text>
          <Text style={[styles.updateTime, { color: colors.textSecondary }]}>{t('forex.updatedJustNow')}</Text>
        </View>

        {/* Forex Pairs */}
        {forexPairs.map((pair) => (
          <TouchableOpacity
            key={pair.symbol}
            style={[styles.pairCard, { backgroundColor: colors.card }, selectedPair?.symbol === pair.symbol && styles.pairCardSelected]}
            onPress={() => setSelectedPair(pair)}
          >
            <View style={styles.pairInfo}>
              <Text style={[styles.pairSymbol, { color: colors.text }]}>{pair.symbol}</Text>
              <Text style={[styles.pairName, { color: colors.textSecondary }]}>{pair.name}</Text>
            </View>
            <View style={styles.pairRates}>
              <View style={styles.rateColumn}>
                <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>BID</Text>
                <Text style={[styles.rateValue, { color: colors.text }]}>{pair.bid.toLocaleString()}</Text>
              </View>
              <View style={styles.rateColumn}>
                <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>ASK</Text>
                <Text style={[styles.rateValue, { color: colors.text }]}>{pair.ask.toLocaleString()}</Text>
              </View>
              <View style={[styles.changeColumn, pair.change >= 0 ? styles.changePositive : styles.changeNegative]}>
                <Text style={styles.changeValue}>{pair.change >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Trade Panel */}
        {selectedPair && (
          <View style={[styles.tradePanel, { backgroundColor: colors.card }]}>
            <Text style={[styles.tradePanelTitle, { color: colors.text }]}>Trade {selectedPair.symbol}</Text>
            
            <View style={styles.orderTypeContainer}>
              <TouchableOpacity
                style={[styles.orderTypeBtn, { backgroundColor: colors.surfaceVariant }, orderType === 'buy' && styles.orderTypeBtnBuy]}
                onPress={() => setOrderType('buy')}
              >
                <Text style={[styles.orderTypeText, { color: colors.textSecondary }, orderType === 'buy' && styles.orderTypeTextActive]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.orderTypeBtn, { backgroundColor: colors.surfaceVariant }, orderType === 'sell' && styles.orderTypeBtnSell]}
                onPress={() => setOrderType('sell')}
              >
                <Text style={[styles.orderTypeText, { color: colors.textSecondary }, orderType === 'sell' && styles.orderTypeTextActive]}>SELL</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({selectedPair.symbol.split('/')[0]})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.tradeInfo, { backgroundColor: colors.background }]}>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Rate</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>{orderType === 'buy' ? selectedPair.ask : selectedPair.bid}</Text>
              </View>
              {amount && (
                <View style={styles.tradeInfoRow}>
                  <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Total (UGX)</Text>
                  <Text style={[styles.tradeInfoValue, { color: colors.text }]}>{(parseFloat(amount || '0') * (orderType === 'buy' ? selectedPair.ask : selectedPair.bid)).toLocaleString()}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.tradeBtn, orderType === 'buy' ? styles.tradeBtnBuy : styles.tradeBtnSell]}
              onPress={handleTrade}
            >
              <Text style={styles.tradeBtnText}>{orderType === 'buy' ? 'BUY' : 'SELL'} {selectedPair.symbol.split('/')[0]}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#10b981', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  marketOverview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  updateTime: { color: '#CCCCCC', fontSize: 12 },
  pairCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  pairCardSelected: { borderColor: '#10b981' },
  pairInfo: { flex: 1 },
  pairSymbol: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  pairName: { color: '#CCCCCC', fontSize: 12 },
  pairRates: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rateColumn: { alignItems: 'center' },
  rateLabel: { color: '#CCCCCC', fontSize: 10 },
  rateValue: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  changeColumn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  changePositive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  changeNegative: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  changeValue: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  tradePanel: { margin: 16, padding: 20, borderRadius: 16 },
  tradePanelTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 16, textAlign: 'center' },
  orderTypeContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  orderTypeBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2a2a2a', alignItems: 'center' },
  orderTypeBtnBuy: { backgroundColor: '#10b981' },
  orderTypeBtnSell: { backgroundColor: '#ef4444' },
  orderTypeText: { color: '#CCCCCC', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  orderTypeTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#CCCCCC', fontSize: 14, marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 18 },
  tradeInfo: { borderRadius: 12, padding: 16, marginBottom: 16 },
  tradeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tradeInfoLabel: { color: '#CCCCCC', fontSize: 14 },
  tradeInfoValue: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  tradeBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  tradeBtnBuy: { backgroundColor: '#10b981' },
  tradeBtnSell: { backgroundColor: '#ef4444' },
  tradeBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
});
