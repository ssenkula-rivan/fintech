// GMG Uganda - Commodities Trading Screen (Gold, Silver, etc.)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  icon: string;
}

const commodities: Commodity[] = [
  { symbol: 'XAU', name: 'Gold', price: 2034.50, change: 0.45, unit: 'oz', icon: '🥇' },
  { symbol: 'XAG', name: 'Silver', price: 23.45, change: -0.32, unit: 'oz', icon: '🥈' },
  { symbol: 'XPT', name: 'Platinum', price: 912.30, change: 1.23, unit: 'oz', icon: '⚪' },
  { symbol: 'XPD', name: 'Palladium', price: 1045.60, change: -0.87, unit: 'oz', icon: '🔘' },
  { symbol: 'CL', name: 'Crude Oil', price: 78.45, change: 2.15, unit: 'barrel', icon: '🛢️' },
  { symbol: 'NG', name: 'Natural Gas', price: 2.34, change: -1.45, unit: 'MMBtu', icon: '🔥' },
  { symbol: 'HG', name: 'Copper', price: 3.89, change: 0.67, unit: 'lb', icon: '🟤' },
  { symbol: 'ZC', name: 'Corn', price: 4.56, change: 0.23, unit: 'bushel', icon: '🌽' },
];

export default function CommoditiesScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const handleTrade = () => {
    if (!selectedCommodity || !quantity) {
      Alert.alert('Error', 'Please select a commodity and enter quantity');
      return;
    }
    const total = parseFloat(quantity) * selectedCommodity.price;
    Alert.alert(
      'Confirm Trade',
      `${orderType.toUpperCase()} ${quantity} ${selectedCommodity.unit} of ${selectedCommodity.name}\nPrice: $${selectedCommodity.price}/${selectedCommodity.unit}\nTotal: $${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Success', 'Order placed!') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.warning }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('commodities.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured - Gold */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredIcon}>🥇</Text>
            <View>
              <Text style={styles.featuredTitle}>{t('commodities.gold')}</Text>
              <Text style={styles.featuredSubtitle}>{t('commodities.mostTraded')}</Text>
            </View>
          </View>
          <Text style={styles.featuredPrice}>${commodities[0].price.toLocaleString()}</Text>
          <Text style={[styles.featuredChange, commodities[0].change >= 0 ? styles.changePositive : styles.changeNegative]}>
            {commodities[0].change >= 0 ? '+' : ''}{commodities[0].change}%
          </Text>
        </View>

        {/* Commodities List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('commodities.allCommodities')}</Text>
        {commodities.map((commodity) => (
          <TouchableOpacity
            key={commodity.symbol}
            style={[styles.commodityCard, { backgroundColor: colors.card }, selectedCommodity?.symbol === commodity.symbol && styles.commodityCardSelected]}
            onPress={() => setSelectedCommodity(commodity)}
          >
            <Text style={styles.commodityIcon}>{commodity.icon}</Text>
            <View style={styles.commodityInfo}>
              <Text style={[styles.commodityName, { color: colors.text }]}>{commodity.name}</Text>
              <Text style={[styles.commoditySymbol, { color: colors.textSecondary }]}>{commodity.symbol} • per {commodity.unit}</Text>
            </View>
            <View style={styles.commodityPrice}>
              <Text style={[styles.priceValue, { color: colors.text }]}>${commodity.price.toLocaleString()}</Text>
              <Text style={[styles.changeValue, commodity.change >= 0 ? styles.changePositive : styles.changeNegative]}>
                {commodity.change >= 0 ? '+' : ''}{commodity.change}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Trade Panel */}
        {selectedCommodity && (
          <View style={[styles.tradePanel, { backgroundColor: colors.card }]}>
            <View style={styles.tradePanelHeader}>
              <Text style={styles.tradePanelIcon}>{selectedCommodity.icon}</Text>
              <Text style={[styles.tradePanelTitle, { color: colors.text }]}>{selectedCommodity.name}</Text>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Quantity ({selectedCommodity.unit})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.tradeInfo, { backgroundColor: colors.background }]}>
              <View style={styles.tradeInfoRow}>
                <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Price per {selectedCommodity.unit}</Text>
                <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${selectedCommodity.price}</Text>
              </View>
              {quantity && (
                <View style={styles.tradeInfoRow}>
                  <Text style={[styles.tradeInfoLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.tradeInfoValue, { color: colors.text }]}>${(parseFloat(quantity || '0') * selectedCommodity.price).toFixed(2)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.tradeBtn, orderType === 'buy' ? styles.tradeBtnBuy : styles.tradeBtnSell]}
              onPress={handleTrade}
            >
              <Text style={styles.tradeBtnText}>{orderType === 'buy' ? 'BUY' : 'SELL'} {selectedCommodity.name}</Text>
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
  backBtn: { color: '#f59e0b', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  featuredCard: { backgroundColor: '#f59e0b', margin: 16, padding: 24, borderRadius: 16 },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featuredIcon: { fontSize: 40, marginRight: 12 },
  featuredTitle: { color: '#000', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  featuredSubtitle: { color: 'rgba(0,0,0,0.6)', fontSize: 12 },
  featuredPrice: { color: '#000', fontSize: 32, fontFamily: 'Montserrat_700Bold' },
  featuredChange: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginLeft: 16, marginBottom: 12 },
  commodityCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  commodityCardSelected: { borderColor: '#f59e0b' },
  commodityIcon: { fontSize: 32, marginRight: 12 },
  commodityInfo: { flex: 1 },
  commodityName: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  commoditySymbol: { color: '#CCCCCC', fontSize: 12 },
  commodityPrice: { alignItems: 'flex-end' },
  priceValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  changeValue: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  changePositive: { color: '#10b981' },
  changeNegative: { color: '#ef4444' },
  tradePanel: { margin: 16, padding: 20, borderRadius: 16 },
  tradePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  tradePanelIcon: { fontSize: 32, marginRight: 8 },
  tradePanelTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
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
