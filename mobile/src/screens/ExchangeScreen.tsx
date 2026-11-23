// GMG Uganda - Crypto Exchange/Trading Screen
// Production-Ready with Binance Integration
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  high24h: string;
  low24h: string;
  icon: string;
}

interface PortfolioAsset {
  asset: string;
  free: string;
  locked: string;
  total: string;
  usdValue: string;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: '₿' },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: 'Ξ' },
  { symbol: 'BNBUSDT', name: 'BNB', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: '◈' },
  { symbol: 'SOLUSDT', name: 'Solana', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: '◎' },
  { symbol: 'XRPUSDT', name: 'XRP', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: '✕' },
  { symbol: 'ADAUSDT', name: 'Cardano', price: 0, change24h: 0, volume24h: '0', high24h: '0', low24h: '0', icon: '₳' },
];

const NETWORKS = [
  { id: 'BTC', name: 'Bitcoin', network: 'BTC' },
  { id: 'ETH', name: 'Ethereum (ERC20)', network: 'ETH' },
  { id: 'BSC', name: 'BNB Smart Chain (BEP20)', network: 'BSC' },
  { id: 'TRC20', name: 'Tron (TRC20)', network: 'TRX' },
];

export default function ExchangeScreen({ navigation }: { navigation: any }) {
  const { wallets } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [assets, setAssets] = useState<CryptoAsset[]>(CRYPTO_ASSETS);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [totalValue, setTotalValue] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'trade'>('market');
  
  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradingLoading, setTradingLoading] = useState(false);

  // Deposit/Withdraw modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositCoin, setDepositCoin] = useState('BTC');
  const [depositNetwork, setDepositNetwork] = useState('BTC');
  const [depositAddress, setDepositAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const usdtBalance = wallets.find(w => w.currency === 'USDT')?.balance || 0;

  const loadPrices = useCallback(async () => {
    try {
      const symbols = CRYPTO_ASSETS.map(a => a.symbol).join(',');
      const result = await api.getCryptoPrices(symbols);
      
      if (result.success && result.data) {
        const priceDataArray = result.data;
        setAssets(prev => prev.map(asset => {
          const priceData = priceDataArray.find((p: any) => p.symbol === asset.symbol);
          if (priceData) {
            return {
              ...asset,
              price: parseFloat(priceData.price),
              change24h: parseFloat(priceData.change24h || '0'),
              volume24h: priceData.volume24h || '0',
              high24h: priceData.high24h || '0',
              low24h: priceData.low24h || '0',
            };
          }
          return asset;
        }));
      }
    } catch (error) {
      console.error('Load prices error:', error);
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    try {
      const result = await api.getCryptoPortfolio();
      if (result.success && result.data) {
        setPortfolio(result.data.balances || []);
        setTotalValue(result.data.totalUsdValue || '0.00');
      }
    } catch (error) {
      console.error('Load portfolio error:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPrices(), loadPortfolio()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadPrices, loadPortfolio]);

  useEffect(() => {
    loadData();
    // Refresh prices every 30 seconds
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, [loadData, loadPrices]);

  const handleTrade = async () => {
    if (!selectedAsset || !tradeAmount || parseFloat(tradeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(tradeAmount);

    if (tradeType === 'BUY' && amount > usdtBalance) {
      Alert.alert('Error', 'Insufficient USDT balance');
      return;
    }

    Alert.alert(
      'Confirm Trade',
      `${tradeType} ${tradeType === 'BUY' ? amount + ' USDT worth of' : amount} ${selectedAsset.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: executeTrade }
      ]
    );
  };

  const executeTrade = async () => {
    if (!selectedAsset) return;
    
    setTradingLoading(true);
    try {
      let result;
      if (tradeType === 'BUY') {
        result = await api.buyCrypto(selectedAsset.symbol, parseFloat(tradeAmount));
      } else {
        result = await api.sellCrypto(selectedAsset.symbol, parseFloat(tradeAmount));
      }

      if (result.success) {
        Alert.alert('Success', `${tradeType} order completed!`);
        setShowTradeModal(false);
        setTradeAmount('');
        loadData();
      } else {
        Alert.alert('Error', result.error || 'Trade failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Trade failed');
    } finally {
      setTradingLoading(false);
    }
  };

  const openTradeModal = (asset: CryptoAsset, type: 'BUY' | 'SELL') => {
    setSelectedAsset(asset);
    setTradeType(type);
    setTradeAmount('');
    setShowTradeModal(true);
  };

  const getDepositAddress = async () => {
    setLoadingAddress(true);
    try {
      const result = await api.getCryptoDepositAddress(depositCoin, depositNetwork);
      if (result.success && result.data) {
        setDepositAddress(result.data.address);
      } else {
        Alert.alert('Error', result.error || 'Failed to get address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get deposit address');
    } finally {
      setLoadingAddress(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  const formatVolume = (vol: string) => {
    const num = parseFloat(vol);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading market data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchange.title')}</Text>
        <TouchableOpacity onPress={() => setShowDepositModal(true)}>
          <Text style={[styles.depositBtn, { color: colors.success }]}>{t('exchange.deposit')}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('exchange.usdtBalance')}</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>${usdtBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.portfolioValue}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('exchange.portfolioValue')}</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>${totalValue}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {(['market', 'portfolio', 'trade'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#0066FF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Tab */}
        {activeTab === 'market' && (
          <View style={styles.section}>
            {assets.map(asset => (
              <TouchableOpacity
                key={asset.symbol}
                style={[styles.assetCard, { backgroundColor: colors.card }]}
                onPress={() => openTradeModal(asset, 'BUY')}
              >
                <View style={styles.assetLeft}>
                  <View style={[styles.assetIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={styles.assetIconText}>{asset.icon}</Text>
                  </View>
                  <View>
                    <Text style={[styles.assetName, { color: colors.text }]}>{asset.name}</Text>
                    <Text style={[styles.assetSymbol, { color: colors.textSecondary }]}>{asset.symbol.replace('USDT', '')}</Text>
                  </View>
                </View>
                <View style={styles.assetRight}>
                  <Text style={[styles.assetPrice, { color: colors.text }]}>${formatPrice(asset.price)}</Text>
                  <Text style={[styles.assetChange, { color: asset.change24h >= 0 ? colors.success : colors.error }]}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <View style={styles.section}>
            {portfolio.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>{t('exchange.noHoldings')}</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('exchange.buyToStart')}</Text>
              </View>
            ) : (
              portfolio.map(holding => (
                <View key={holding.asset} style={[styles.holdingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.holdingLeft}>
                    <Text style={[styles.holdingAsset, { color: colors.text }]}>{holding.asset}</Text>
                    <Text style={[styles.holdingBalance, { color: colors.textSecondary }]}>{parseFloat(holding.total).toFixed(8)}</Text>
                  </View>
                  <View style={styles.holdingRight}>
                    <Text style={[styles.holdingValue, { color: colors.success }]}>${holding.usdValue}</Text>
                    {parseFloat(holding.locked) > 0 && (
                      <Text style={[styles.holdingLocked, { color: colors.warning }]}>🔒 {holding.locked} locked</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Trade Tab */}
        {activeTab === 'trade' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('exchange.quickTrade')}</Text>
            <View style={styles.quickTradeGrid}>
              {assets.slice(0, 4).map(asset => (
                <View key={asset.symbol} style={[styles.quickTradeCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.quickTradeIcon}>{asset.icon}</Text>
                  <Text style={[styles.quickTradeName, { color: colors.text }]}>{asset.symbol.replace('USDT', '')}</Text>
                  <Text style={[styles.quickTradePrice, { color: colors.textSecondary }]}>${formatPrice(asset.price)}</Text>
                  <View style={styles.quickTradeButtons}>
                    <TouchableOpacity
                      style={[styles.quickTradeBtn, styles.buyBtn]}
                      onPress={() => openTradeModal(asset, 'BUY')}
                    >
                      <Text style={styles.quickTradeBtnText}>{t('exchange.buy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickTradeBtn, styles.sellBtn]}
                      onPress={() => openTradeModal(asset, 'SELL')}
                    >
                      <Text style={styles.quickTradeBtnText}>{t('exchange.sell')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Trade Modal */}
      <Modal visible={showTradeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tradeType} {selectedAsset?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTradeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAsset && (
              <>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>Current Price</Text>
                  <Text style={styles.priceValue}>${formatPrice(selectedAsset.price)}</Text>
                </View>

                <View style={styles.tradeTypeToggle}>
                  <TouchableOpacity
                    style={[styles.tradeTypeBtn, tradeType === 'BUY' && styles.buyActive]}
                    onPress={() => setTradeType('BUY')}
                  >
                    <Text style={[styles.tradeTypeText, tradeType === 'BUY' && styles.tradeTypeTextActive]}>BUY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tradeTypeBtn, tradeType === 'SELL' && styles.sellActive]}
                    onPress={() => setTradeType('SELL')}
                  >
                    <Text style={[styles.tradeTypeText, tradeType === 'SELL' && styles.tradeTypeTextActive]}>SELL</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {tradeType === 'BUY' ? 'Amount (USDT)' : `Amount (${selectedAsset.symbol.replace('USDT', '')})`}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={tradeAmount}
                    onChangeText={setTradeAmount}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                  />
                  {tradeType === 'BUY' && (
                    <Text style={styles.availableBalance}>Available: ${usdtBalance.toLocaleString()} USDT</Text>
                  )}
                </View>

                {tradeAmount && parseFloat(tradeAmount) > 0 && (
                  <View style={styles.estimateBox}>
                    <Text style={styles.estimateLabel}>
                      {tradeType === 'BUY' ? 'You will receive approximately' : 'You will receive approximately'}
                    </Text>
                    <Text style={styles.estimateValue}>
                      {tradeType === 'BUY'
                        ? `${(parseFloat(tradeAmount) / selectedAsset.price).toFixed(8)} ${selectedAsset.symbol.replace('USDT', '')}`
                        : `$${(parseFloat(tradeAmount) * selectedAsset.price).toFixed(2)} USDT`
                      }
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.tradeBtn, tradeType === 'BUY' ? styles.buyBtnLarge : styles.sellBtnLarge, tradingLoading && styles.btnDisabled]}
                  onPress={handleTrade}
                  disabled={tradingLoading}
                >
                  {tradingLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.tradeBtnText}>{tradeType} {selectedAsset.symbol.replace('USDT', '')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Crypto</Text>
              <TouchableOpacity onPress={() => { setShowDepositModal(false); setDepositAddress(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Coin</Text>
              <View style={styles.coinSelector}>
                {['BTC', 'ETH', 'BNB', 'USDT'].map(coin => (
                  <TouchableOpacity
                    key={coin}
                    style={[styles.coinBtn, depositCoin === coin && styles.coinBtnActive]}
                    onPress={() => { setDepositCoin(coin); setDepositAddress(''); }}
                  >
                    <Text style={[styles.coinBtnText, depositCoin === coin && styles.coinBtnTextActive]}>{coin}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Network</Text>
              <View style={styles.networkSelector}>
                {NETWORKS.map(net => (
                  <TouchableOpacity
                    key={net.id}
                    style={[styles.networkBtn, depositNetwork === net.network && styles.networkBtnActive]}
                    onPress={() => { setDepositNetwork(net.network); setDepositAddress(''); }}
                  >
                    <Text style={[styles.networkBtnText, depositNetwork === net.network && styles.networkBtnTextActive]}>{net.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!depositAddress ? (
              <TouchableOpacity
                style={[styles.getAddressBtn, loadingAddress && styles.btnDisabled]}
                onPress={getDepositAddress}
                disabled={loadingAddress}
              >
                {loadingAddress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.getAddressBtnText}>Get Deposit Address</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>Deposit Address</Text>
                <Text style={styles.addressValue} selectable>{depositAddress}</Text>
                <Text style={styles.addressWarning}>
                  ⚠️ Only send {depositCoin} on {depositNetwork} network to this address
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#CCCCCC', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  depositBtn: { color: '#10B981', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  balanceCard: { margin: 16, padding: 20, borderRadius: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { color: '#CCCCCC', fontSize: 12 },
  balanceValue: { fontSize: 24, fontFamily: 'Montserrat_700Bold', marginTop: 4 },
  portfolioValue: { alignItems: 'flex-end' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#0066FF' },
  tabText: { color: '#CCCCCC', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  tabTextActive: { color: '#FFFFFF' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  assetCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetLeft: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  assetIconText: { fontSize: 20, color: '#F59E0B' },
  assetName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  assetSymbol: { color: '#CCCCCC', fontSize: 12, marginTop: 2 },
  assetRight: { alignItems: 'flex-end' },
  assetPrice: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  assetChange: { fontSize: 13, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  emptySubtext: { color: '#CCCCCC', fontSize: 14, marginTop: 8 },
  holdingCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  holdingLeft: {},
  holdingAsset: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  holdingBalance: { color: '#CCCCCC', fontSize: 14, marginTop: 4 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: '#10B981', fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  holdingLocked: { color: '#F59E0B', fontSize: 12, marginTop: 4 },
  quickTradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickTradeCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickTradeIcon: { fontSize: 32, marginBottom: 8 },
  quickTradeName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  quickTradePrice: { color: '#CCCCCC', fontSize: 14, marginTop: 4, marginBottom: 12 },
  quickTradeButtons: { flexDirection: 'row', gap: 8, width: '100%' },
  quickTradeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buyBtn: { backgroundColor: '#10B981' },
  sellBtn: { backgroundColor: '#EF4444' },
  quickTradeBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalClose: { color: '#CCCCCC', fontSize: 24, padding: 4 },
  priceInfo: { padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  priceLabel: { color: '#CCCCCC', fontSize: 12 },
  priceValue: { fontSize: 28, fontFamily: 'Montserrat_700Bold', marginTop: 4 },
  tradeTypeToggle: { flexDirection: 'row', marginBottom: 20 },
  tradeTypeBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  buyActive: { backgroundColor: '#10B981' },
  sellActive: { backgroundColor: '#EF4444' },
  tradeTypeText: { color: '#CCCCCC', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  tradeTypeTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#CCCCCC', fontSize: 13, marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 18 },
  availableBalance: { color: '#AAAAAA', fontSize: 12, marginTop: 8 },
  estimateBox: { backgroundColor: '#064e3b', padding: 16, borderRadius: 12, marginBottom: 20 },
  estimateLabel: { color: '#6EE7B7', fontSize: 12 },
  estimateValue: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  tradeBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  buyBtnLarge: { backgroundColor: '#10B981' },
  sellBtnLarge: { backgroundColor: '#EF4444' },
  btnDisabled: { opacity: 0.5 },
  tradeBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  coinSelector: { flexDirection: 'row', gap: 8 },
  coinBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  coinBtnActive: { backgroundColor: '#0066FF' },
  coinBtnText: { color: '#CCCCCC', fontFamily: 'Montserrat_600SemiBold' },
  coinBtnTextActive: { color: '#FFFFFF' },
  networkSelector: { gap: 8 },
  networkBtn: { padding: 12, borderRadius: 8 },
  networkBtnActive: { backgroundColor: '#0066FF' },
  networkBtnText: { color: '#CCCCCC', fontSize: 14 },
  networkBtnTextActive: { color: '#FFFFFF' },
  getAddressBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  getAddressBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  addressBox: { padding: 16, borderRadius: 12, marginTop: 16 },
  addressLabel: { color: '#CCCCCC', fontSize: 12, marginBottom: 8 },
  addressValue: { fontSize: 14, fontFamily: 'monospace', padding: 12, borderRadius: 8 },
  addressWarning: { color: '#F59E0B', fontSize: 12, marginTop: 12 },
});
