// GMG Uganda - Crypto Trading Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  icon: string;
}

const cryptos: Crypto[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change24h: 2.45, volume: '28.5B', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change24h: -1.23, volume: '15.2B', icon: 'Ξ' },
  { symbol: 'BNB', name: 'BNB', price: 598.45, change24h: 0.87, volume: '1.8B', icon: '◈' },
  { symbol: 'SOL', name: 'Solana', price: 145.67, change24h: 5.34, volume: '3.2B', icon: '◎' },
  { symbol: 'XRP', name: 'Ripple', price: 0.5234, change24h: -0.45, volume: '2.1B', icon: '✕' },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.01, volume: '45.6B', icon: '₮' },
  { symbol: 'ADA', name: 'Cardano', price: 0.4567, change24h: 3.21, volume: '890M', icon: '₳' },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.0823, change24h: -2.15, volume: '1.2B', icon: 'Ð' },
];

export default function CryptoTradingScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const handleTrade = () => {
    if (!selectedCrypto || !amount) {
      Alert.alert('Error', 'Please select a crypto and enter amount');
      return;
    }
    const total = parseFloat(amount) * selectedCrypto.price;
    Alert.alert(
      'Confirm Trade',
      `${orderType.toUpperCase()} ${amount} ${selectedCrypto.symbol} at $${selectedCrypto.price.toLocaleString()}\nTotal: $${total.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Trade executed!') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('crypto.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portfolio Summary */}
        <View style={[styles.portfolioCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>{t('crypto.portfolioValue')}</Text>
          <Text style={[styles.portfolioValue, { color: colors.text }]}>$0.00</Text>
          <Text style={styles.portfolioChange}>+0.00% {t('crypto.today')}</Text>
        </View>

        {/* Crypto List */}
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('crypto.markets')}</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllBtn, { color: colors.primary }]}>{t('crypto.viewAll')} →</Text>
          </TouchableOpacity>
        </View>

        {cryptos.map((crypto) => (
          <TouchableOpacity
            key={crypto.symbol}
            style={[styles.cryptoCard, { backgroundColor: colors.card }, selectedCrypto?.symbol === crypto.symbol && styles.cryptoCardSelected]}
            onPress={() => setSelectedCrypto(crypto)}
          >
            <View style={[styles.cryptoIcon, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.cryptoIconText}>{crypto.icon}</Text>
            </View>
            <View style={styles.cryptoInfo}>
              <Text style={[styles.cryptoSymbol, { color: colors.text }]}>{crypto.symbol}</Text>
              <Text style={[styles.cryptoName, { color: colors.textSecondary }]}>{crypto.name}</Text>
            </View>
            <View style={styles.cryptoPrice}>
              <Text style={[styles.priceValue, { color: colors.text }]}>${crypto.price.toLocaleString()}</Text>
              <Text style={[styles.changeValue, crypto.change24h >= 0 ? styles.changePositive : styles.changeNegative]}>
                {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Trade Panel */}
        {selectedCrypto && (
          <View style={[styles.tradePanel, { backgroundColor: colors.card }]}>
            <View style={styles.tradePanelHeader}>
              <Text style={styles.tradePanelIcon}>{selectedCrypto.icon}</Text>
              <Text style={[styles.tradePanelTitle, { color: colors.text }]}>{selectedCrypto.symbol}/USD</Text>
            </View>
            
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({selectedCrypto.symbol})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.tradeInfo, { backgroundColor: colors.surfaceVariant }]}>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Price</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${selectedCrypto.price.toLocaleString()}</Text>
              </View>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>24h Volume</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${selectedCrypto.volume}</Text>
              </View>
              {amount && (
                <View style={styles.tradeInfoRow}>
                  <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${(parseFloat(amount || '0') * selectedCrypto.price).toLocaleString()}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.tradeBtn, orderType === 'buy' ? styles.tradeBtnBuy : styles.tradeBtnSell]}
              onPress={handleTrade}
            >
              <Text style={styles.tradeBtnText}>{orderType === 'buy' ? 'BUY' : 'SELL'} {selectedCrypto.symbol}</Text>
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
  backBtn: { fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  portfolioCard: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  portfolioLabel: { fontSize: 14 },
  portfolioValue: { fontSize: 36, fontFamily: 'Montserrat_700Bold', marginVertical: 8 },
  portfolioChange: { color: '#10b981', fontSize: 14 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  viewAllBtn: { fontSize: 14 },
  cryptoCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  cryptoCardSelected: { borderColor: '#f59e0b' },
  cryptoIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cryptoIconText: { fontSize: 20, color: '#f59e0b' },
  cryptoInfo: { flex: 1 },
  cryptoSymbol: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  cryptoName: { fontSize: 12 },
  cryptoPrice: { alignItems: 'flex-end' },
  priceValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  changeValue: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  changePositive: { color: '#10b981' },
  changeNegative: { color: '#ef4444' },
  tradePanel: { margin: 16, padding: 20, borderRadius: 16 },
  tradePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  tradePanelIcon: { fontSize: 24, color: '#f59e0b', marginRight: 8 },
  tradePanelTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  orderTypeContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  orderTypeBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  orderTypeBtnBuy: { backgroundColor: '#10b981' },
  orderTypeBtnSell: { backgroundColor: '#ef4444' },
  orderTypeText: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  orderTypeTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 18 },
  tradeInfo: { borderRadius: 12, padding: 16, marginBottom: 16 },
  tradeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tradeInfoLabel: { fontSize: 14 },
  tradeInfoValue: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  tradeBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  tradeBtnBuy: { backgroundColor: '#10b981' },
  tradeBtnSell: { backgroundColor: '#ef4444' },
  tradeBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
});
