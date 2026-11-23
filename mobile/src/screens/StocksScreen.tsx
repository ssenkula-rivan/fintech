// GMG Uganda - Stocks Trading Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  market: string;
}

const stocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.45, change: 2.34, changePercent: 1.25, market: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -1.20, changePercent: -0.84, market: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 4.56, changePercent: 1.22, market: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 3.12, changePercent: 1.78, market: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.30, changePercent: -2.09, market: 'NASDAQ' },
  { symbol: 'SBU', name: 'Stanbic Uganda', price: 28.50, change: 0.50, changePercent: 1.79, market: 'USE' },
  { symbol: 'DFCU', name: 'DFCU Group', price: 0.85, change: -0.02, changePercent: -2.30, market: 'USE' },
  { symbol: 'BATU', name: 'BAT Uganda', price: 32000, change: 500, changePercent: 1.59, market: 'USE' },
];

export default function StocksScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [shares, setShares] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [filter, setFilter] = useState<'all' | 'USE' | 'NASDAQ'>('all');

  const filteredStocks = filter === 'all' ? stocks : stocks.filter(s => s.market === filter);

  const handleTrade = () => {
    if (!selectedStock || !shares) {
      Alert.alert('Error', 'Please select a stock and enter number of shares');
      return;
    }
    const total = parseFloat(shares) * selectedStock.price;
    Alert.alert(
      'Confirm Order',
      `${orderType.toUpperCase()} ${shares} shares of ${selectedStock.symbol} at $${selectedStock.price}\nTotal: $${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Order placed successfully!') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('stocks.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Market Filter */}
        <View style={styles.filterContainer}>
          {(['all', 'USE', 'NASDAQ'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, { backgroundColor: colors.card }, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: colors.textSecondary }, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All Markets' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stocks List */}
        {filteredStocks.map((stock) => (
          <TouchableOpacity
            key={stock.symbol}
            style={[styles.stockCard, { backgroundColor: colors.card }, selectedStock?.symbol === stock.symbol && styles.stockCardSelected]}
            onPress={() => setSelectedStock(stock)}
          >
            <View style={styles.stockInfo}>
              <View style={styles.stockHeader}>
                <Text style={[styles.stockSymbol, { color: colors.text }]}>{stock.symbol}</Text>
                <Text style={[styles.stockMarket, { backgroundColor: colors.surfaceVariant, color: colors.textSecondary }]}>{stock.market}</Text>
              </View>
              <Text style={[styles.stockName, { color: colors.textSecondary }]}>{stock.name}</Text>
            </View>
            <View style={styles.stockPrice}>
              <Text style={[styles.priceValue, { color: colors.text }]}>${stock.price.toLocaleString()}</Text>
              <View style={[styles.changeContainer, stock.change >= 0 ? styles.changePositive : styles.changeNegative]}>
                <Text style={styles.changeText}>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Trade Panel */}
        {selectedStock && (
          <View style={[styles.tradePanel, { backgroundColor: colors.card }]}>
            <Text style={[styles.tradePanelTitle, { color: colors.text }]}>Trade {selectedStock.symbol}</Text>
            
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Number of Shares</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={shares}
                onChangeText={setShares}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.tradeInfo, { backgroundColor: colors.background }]}>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Price per share</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${selectedStock.price}</Text>
              </View>
              {shares && (
                <View style={styles.tradeInfoRow}>
                  <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${(parseFloat(shares || '0') * selectedStock.price).toFixed(2)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.tradeBtn, orderType === 'buy' ? styles.tradeBtnBuy : styles.tradeBtnSell]}
              onPress={handleTrade}
            >
              <Text style={styles.tradeBtnText}>{orderType === 'buy' ? 'BUY' : 'SELL'} {selectedStock.symbol}</Text>
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
  backBtn: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { color: '#CCCCCC', fontSize: 14 },
  filterTextActive: { color: '#FFFFFF' },
  stockCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  stockCardSelected: { borderColor: '#3b82f6' },
  stockInfo: { flex: 1 },
  stockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockSymbol: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  stockMarket: { color: '#CCCCCC', fontSize: 10, backgroundColor: '#2a2a2a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stockName: { color: '#CCCCCC', fontSize: 12, marginTop: 2 },
  stockPrice: { alignItems: 'flex-end' },
  priceValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  changeContainer: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  changePositive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  changeNegative: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  changeText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
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
