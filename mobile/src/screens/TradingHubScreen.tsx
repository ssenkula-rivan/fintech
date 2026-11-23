// GMG Uganda - Trading Hub Screen
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useOnboarding } from '../context/OnboardingContext';

interface TradingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  screen: string;
  color: string;
  stats: { label: string; value: string }[];
}

const tradingCategories: TradingCategory[] = [
  { id: 'forex', name: 'Forex', icon: '💱', description: 'Trade currency pairs', screen: 'Forex', color: '#10b981', stats: [{ label: 'Pairs', value: '28+' }, { label: 'Spread', value: 'From 0.1' }] },
  { id: 'stocks', name: 'Stocks', icon: '📊', description: 'Global & local stocks', screen: 'Stocks', color: '#3b82f6', stats: [{ label: 'Markets', value: '5+' }, { label: 'Stocks', value: '500+' }] },
  { id: 'crypto', name: 'Crypto', icon: '₿', description: 'Cryptocurrencies', screen: 'CryptoTrading', color: '#f59e0b', stats: [{ label: 'Coins', value: '50+' }, { label: '24/7', value: 'Trading' }] },
  { id: 'commodities', name: 'Commodities', icon: '🥇', description: 'Gold, oil & more', screen: 'Commodities', color: '#eab308', stats: [{ label: 'Assets', value: '15+' }, { label: 'Leverage', value: 'Up to 10x' }] },
];

const marketHighlights = [
  { symbol: 'BTC/USD', price: '$67,234', change: '+2.4%', positive: true },
  { symbol: 'EUR/USD', price: '1.0876', change: '+0.3%', positive: true },
  { symbol: 'GOLD', price: '$2,034', change: '-0.5%', positive: false },
  { symbol: 'AAPL', price: '$189.45', change: '+1.1%', positive: true },
];

export default function TradingHubScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { startTour, hasCompletedTour } = useOnboarding();

  useEffect(() => {
    if (!hasCompletedTour('Trading')) {
      setTimeout(() => startTour('Trading'), 500);
    }
  }, [hasCompletedTour, startTour]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('trading.hub')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portfolio Overview */}
        <View style={[styles.portfolioCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>{t('trading.totalPortfolioValue')}</Text>
          <Text style={[styles.portfolioValue, { color: colors.text }]}>$0.00</Text>
          <View style={styles.portfolioStats}>
            <View style={styles.portfolioStat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('trading.todaysPL')}</Text>
              <Text style={[styles.statValue, styles.statPositive]}>+$0.00</Text>
            </View>
            <View style={styles.portfolioStat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('trading.openPositions')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
            </View>
          </View>
        </View>

        {/* Market Ticker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerContainer}>
          {marketHighlights.map((item, index) => (
            <View key={index} style={[styles.tickerItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.tickerSymbol, { color: colors.textSecondary }]}>{item.symbol}</Text>
              <Text style={[styles.tickerPrice, { color: colors.text }]}>{item.price}</Text>
              <Text style={[styles.tickerChange, item.positive ? styles.changePositive : styles.changeNegative]}>{item.change}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Trading Categories */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trading.markets')}</Text>
        {tradingCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: colors.card, borderLeftColor: category.color }]}
            onPress={() => navigation.navigate(category.screen)}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                <Text style={[styles.categoryDesc, { color: colors.textSecondary }]}>{category.description}</Text>
              </View>
              <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
            </View>
            <View style={[styles.categoryStats, { borderTopColor: colors.border }]}>
              {category.stats.map((stat, idx) => (
                <View key={idx} style={styles.categoryStat}>
                  <Text style={[styles.categoryStatValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.categoryStatLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('trading.quickActions')}</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📈</Text>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Watchlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Risk Warning */}
        <View style={[styles.warningCard, { backgroundColor: colors.card }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>Trading involves risk. Only trade with money you can afford to lose. Past performance is not indicative of future results.</Text>
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
  portfolioCard: { margin: 16, padding: 24, borderRadius: 16 },
  portfolioLabel: { fontSize: 14 },
  portfolioValue: { fontSize: 36, fontFamily: 'Montserrat_700Bold', marginVertical: 8 },
  portfolioStats: { flexDirection: 'row', marginTop: 16 },
  portfolioStat: { flex: 1 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  statPositive: { color: '#10b981' },
  tickerContainer: { paddingHorizontal: 16, marginBottom: 16 },
  tickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  tickerSymbol: { fontSize: 12 },
  tickerPrice: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  tickerChange: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  changePositive: { color: '#10b981' },
  changeNegative: { color: '#ef4444' },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginLeft: 16, marginBottom: 12 },
  categoryCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryIconText: { fontSize: 24 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  categoryDesc: { fontSize: 12 },
  arrow: { fontSize: 20 },
  categoryStats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  categoryStat: { flex: 1, alignItems: 'center' },
  categoryStatValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  categoryStatLabel: { fontSize: 10 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickActionIcon: { fontSize: 28, marginBottom: 4 },
  quickActionText: { fontSize: 12 },
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  warningIcon: { fontSize: 20, marginRight: 12 },
  warningText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
