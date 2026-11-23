// GMG Global Mobile App - Home Screen (Modern Fintech Design)
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated, Dimensions, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTransactionType, getTransactionIcon } from '../utils/format';
import KYCUpgradeModal from '../components/KYCUpgradeModal';
import LanguageSwitcher, { LanguageButton } from '../components/LanguageSwitcher';
import BankIcon from '../components/icons/BankIcon';
import SendIcon from '../components/icons/SendIcon';
import EyeIcon from '../components/icons/EyeIcon';
const KYC_MODAL_SHOWN_KEY = 'kyc_modal_shown_session';

// Animated Floating Balls Component for Balance Card Background
const FloatingBalls = () => {
  const ball1X = useRef(new Animated.Value(0)).current;
  const ball1Y = useRef(new Animated.Value(0)).current;
  const ball2X = useRef(new Animated.Value(0)).current;
  const ball2Y = useRef(new Animated.Value(0)).current;
  const ball3X = useRef(new Animated.Value(0)).current;
  const ball3Y = useRef(new Animated.Value(0)).current;
  const ball4X = useRef(new Animated.Value(0)).current;
  const ball4Y = useRef(new Animated.Value(0)).current;
  const ball5X = useRef(new Animated.Value(0)).current;
  const ball5Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ball 1 - Large continuous orbit
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ball1X, { toValue: 40, duration: 3000, useNativeDriver: true }),
          Animated.timing(ball1X, { toValue: -30, duration: 3500, useNativeDriver: true }),
          Animated.timing(ball1X, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ball1Y, { toValue: -25, duration: 2500, useNativeDriver: true }),
          Animated.timing(ball1Y, { toValue: 30, duration: 3000, useNativeDriver: true }),
          Animated.timing(ball1Y, { toValue: 0, duration: 3500, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Ball 2 - Medium continuous orbit
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ball2X, { toValue: -35, duration: 2500, useNativeDriver: true }),
          Animated.timing(ball2X, { toValue: 25, duration: 3000, useNativeDriver: true }),
          Animated.timing(ball2X, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ball2Y, { toValue: 35, duration: 3000, useNativeDriver: true }),
          Animated.timing(ball2Y, { toValue: -20, duration: 2500, useNativeDriver: true }),
          Animated.timing(ball2Y, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Ball 3 - Small fast continuous
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ball3X, { toValue: 25, duration: 1500, useNativeDriver: true }),
          Animated.timing(ball3X, { toValue: -20, duration: 1800, useNativeDriver: true }),
          Animated.timing(ball3X, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ball3Y, { toValue: 30, duration: 1800, useNativeDriver: true }),
          Animated.timing(ball3Y, { toValue: -15, duration: 1500, useNativeDriver: true }),
          Animated.timing(ball3Y, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Ball 4 - Diagonal continuous movement
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ball4X, { toValue: 45, duration: 4000, useNativeDriver: true }),
          Animated.timing(ball4X, { toValue: -25, duration: 3500, useNativeDriver: true }),
          Animated.timing(ball4X, { toValue: 0, duration: 3000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ball4Y, { toValue: 20, duration: 3500, useNativeDriver: true }),
          Animated.timing(ball4Y, { toValue: -30, duration: 4000, useNativeDriver: true }),
          Animated.timing(ball4Y, { toValue: 0, duration: 3000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Ball 5 - Circular continuous movement
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ball5X, { toValue: 30, duration: 2000, useNativeDriver: true }),
          Animated.timing(ball5X, { toValue: -30, duration: 2000, useNativeDriver: true }),
          Animated.timing(ball5X, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ball5Y, { toValue: -35, duration: 2000, useNativeDriver: true }),
          Animated.timing(ball5Y, { toValue: 35, duration: 2000, useNativeDriver: true }),
          Animated.timing(ball5Y, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={floatingStyles.container}>
      {/* Large ball - top left */}
      <Animated.View style={[floatingStyles.ball, floatingStyles.ball1, { transform: [{ translateX: ball1X }, { translateY: ball1Y }] }]}>
        <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']} style={floatingStyles.ballGradient} />
      </Animated.View>
      
      {/* Medium ball - top right */}
      <Animated.View style={[floatingStyles.ball, floatingStyles.ball2, { transform: [{ translateX: ball2X }, { translateY: ball2Y }] }]}>
        <LinearGradient colors={['rgba(147,197,253,0.5)', 'rgba(59,130,246,0.2)']} style={floatingStyles.ballGradient} />
      </Animated.View>
      
      {/* Small ball - center */}
      <Animated.View style={[floatingStyles.ball, floatingStyles.ball3, { transform: [{ translateX: ball3X }, { translateY: ball3Y }] }]}>
        <LinearGradient colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.15)']} style={floatingStyles.ballGradient} />
      </Animated.View>
      
      {/* Medium ball - bottom left */}
      <Animated.View style={[floatingStyles.ball, floatingStyles.ball4, { transform: [{ translateX: ball4X }, { translateY: ball4Y }] }]}>
        <LinearGradient colors={['rgba(96,165,250,0.4)', 'rgba(37,99,235,0.15)']} style={floatingStyles.ballGradient} />
      </Animated.View>
      
      {/* Small ball - bottom right */}
      <Animated.View style={[floatingStyles.ball, floatingStyles.ball5, { transform: [{ translateX: ball5X }, { translateY: ball5Y }] }]}>
        <LinearGradient colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.1)']} style={floatingStyles.ballGradient} />
      </Animated.View>
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  ball: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  ballGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  ball1: {
    width: 80,
    height: 80,
    top: -20,
    left: -15,
  },
  ball2: {
    width: 50,
    height: 50,
    top: 10,
    right: 20,
  },
  ball3: {
    width: 30,
    height: 30,
    top: '45%',
    left: '40%',
  },
  ball4: {
    width: 60,
    height: 60,
    bottom: -10,
    left: 30,
  },
  ball5: {
    width: 35,
    height: 35,
    bottom: 20,
    right: 40,
  },
});

// Light theme colors for Home screen
const homeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FA',
  primary: '#0066FF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E8ECF0',
  success: '#00C48C',
  error: '#FF4757',
  warning: '#FFB020',
  card: '#F5F7FA',
};

// Ad Banner Component
const AdBanner = () => (
  <View style={[styles.adBanner, { backgroundColor: '#0066FF', borderColor: '#0055DD' }]}>
    <View style={styles.adContent}>
      <View style={styles.adTextContainer}>
        <Text style={styles.adTitle}>Send Money Instantly! 🎉</Text>
        <Text style={styles.adSubtitle}>Fast, secure transfers to anyone</Text>
        <View style={styles.adButton}>
          <Text style={styles.adButtonText}>Try Now →</Text>
        </View>
      </View>
      <Text style={styles.adEmoji}>📱💰</Text>
    </View>
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, wallets, refreshUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { startTour, hasCompletedTour } = useOnboarding();
  const { unreadCount, isOnline } = useNotifications();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [eyeOpen, setEyeOpen] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('UGX');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [ephemeralMessage, setEphemeralMessage] = useState<string | null>(null);
  const [showWavingEmoji, setShowWavingEmoji] = useState(false);
  const [greetingText, setGreetingText] = useState('Welcome');
  const waveAnim = useState(new Animated.Value(0))[0];
  const messageOpacity = useState(new Animated.Value(0))[0];
  const tickerAnim = useState(new Animated.Value(Dimensions.get('window').width))[0];
  const eyeOpacity = useState(new Animated.Value(1))[0];
  const tickerFade = useState(new Animated.Value(1))[0];
  const tickerBarOpacity = useState(new Animated.Value(1))[0];
  const tickerGlitchX = useState(new Animated.Value(0))[0];
  const tickerGlitchScale = useState(new Animated.Value(1))[0];
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const [tickerCycleCount, setTickerCycleCount] = useState(0);
  const [showTicker, setShowTicker] = useState(true);
  const [tickerStartTime] = useState(Date.now());

  // Coming soon services list - International
  const comingSoonServices = [
    'Bus Tickets',
    'Flight Booking',
    'Hotel Reservations',
    'Event Tickets',
    'School Fees',
    'Pension Payments',
    'Electricity Bills',
    'Water Bills',
    'TV Subscriptions',
    'Betting Deposits',
    'Gift Cards',
    'Crypto Wallet',
    'Virtual Cards',
    'Merchant Payments',
    'Government Services',
    'Healthcare Payments',
  ];

  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // Change greeting from Welcome to Hi after 10 seconds
  useEffect(() => {
    // Check if user was using app before (returning user)
    const checkReturningUser = async () => {
      try {
        const lastVisit = await AsyncStorage.getItem('last_app_visit');
        if (lastVisit) {
          setGreetingText('Welcome back');
        } else {
          setGreetingText('Welcome');
        }
        // Save current visit
        await AsyncStorage.setItem('last_app_visit', Date.now().toString());
      } catch (e) {
        setGreetingText('Welcome');
      }
    };
    checkReturningUser();

    // After 10 seconds, change to Hi
    const timer = setTimeout(() => {
      setGreetingText('Hi');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Welcome back ticker animation - lasts 10 seconds then glitchy fade out
  useEffect(() => {
    if (!showTicker) return;

    // Auto-hide after 10 seconds with glitchy effect
    const hideTimer = setTimeout(() => {
      // Glitchy fade out animation
      const glitchSequence = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(tickerGlitchX, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(tickerGlitchScale, { toValue: 1.02, duration: 50, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(tickerGlitchX, { toValue: -8, duration: 30, useNativeDriver: true }),
            Animated.timing(tickerGlitchScale, { toValue: 0.98, duration: 30, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(tickerGlitchX, { toValue: 3, duration: 40, useNativeDriver: true }),
            Animated.timing(tickerGlitchScale, { toValue: 1.01, duration: 40, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(tickerGlitchX, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(tickerGlitchScale, { toValue: 0.99, duration: 50, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(tickerGlitchX, { toValue: 0, duration: 30, useNativeDriver: true }),
            Animated.timing(tickerGlitchScale, { toValue: 1, duration: 30, useNativeDriver: true }),
          ]),
        ]),
        { iterations: 8 }
      );
      
      glitchSequence.start();
      
      // Fade out while glitching
      Animated.timing(tickerBarOpacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        glitchSequence.stop();
        setShowTicker(false);
      });
    }, 10000);

    // Cycle through services while visible
    const cycleService = () => {
      Animated.timing(tickerFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTickerIndex(prev => (prev + 1) % comingSoonServices.length);
        Animated.timing(tickerFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    };

    const interval = setInterval(cycleService, 2500);
    
    return () => {
      clearInterval(interval);
      clearTimeout(hideTimer);
    };
  }, [tickerFade, tickerBarOpacity, tickerGlitchX, tickerGlitchScale, comingSoonServices.length, showTicker]);

  // Currency conversion rates (approximate)
  const currencyRates: { [key: string]: { rate: number; symbol: string; flag: string } } = {
    UGX: { rate: 1, symbol: 'UGX', flag: '🇺🇬' },
    USD: { rate: 0.00027, symbol: '$', flag: '🇺🇸' },
    EUR: { rate: 0.00025, symbol: '€', flag: '🇪🇺' },
    GBP: { rate: 0.00021, symbol: '£', flag: '🇬🇧' },
    KES: { rate: 0.035, symbol: 'KES', flag: '🇰🇪' },
    TZS: { rate: 0.68, symbol: 'TZS', flag: '🇹🇿' },
    RWF: { rate: 0.33, symbol: 'RWF', flag: '🇷🇼' },
    NGN: { rate: 0.42, symbol: '₦', flag: '🇳🇬' },
    ZAR: { rate: 0.005, symbol: 'R', flag: '🇿🇦' },
    CNY: { rate: 0.0019, symbol: '¥', flag: '🇨🇳' },
  };

  const convertBalance = (amount: number, currency: string) => {
    const rate = currencyRates[currency]?.rate || 1;
    const symbol = currencyRates[currency]?.symbol || currency;
    const converted = amount * rate;
    
    if (currency === 'UGX') {
      return `UGX ${converted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `${symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Blinking eye animation when balance is visible
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout;
    
    if (showBalance) {
      blinkInterval = setInterval(() => {
        // Blink animation: close then open
        setEyeOpen(false);
        setTimeout(() => setEyeOpen(true), 150);
      }, 2000);
    } else {
      setEyeOpen(false);
    }
    
    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [showBalance]);

  // Fetch ephemeral status message from admin
  const fetchEphemeralStatus = useCallback(async () => {
    try {
      const result = await api.get<{ message: string | null }>('/app/ephemeral-status');
      if (result.success && result.data?.message) {
        setEphemeralMessage(result.data.message);
        setShowWavingEmoji(false);
        // Fade in message
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // After 5 seconds, fade out and show waving emoji
        setTimeout(() => {
          Animated.timing(messageOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setEphemeralMessage(null);
            setShowWavingEmoji(true);
          });
        }, 5000);
      } else {
        setShowWavingEmoji(true);
      }
    } catch (error) {
      setShowWavingEmoji(true);
    }
  }, [messageOpacity]);

  // Waving hand animation
  useEffect(() => {
    if (showWavingEmoji) {
      const waveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(1500),
        ])
      );
      waveAnimation.start();
      return () => waveAnimation.stop();
    }
  }, [showWavingEmoji, waveAnim]);

  const loadData = useCallback(async () => {
    const result = await api.getTransactions(5);
    if (result.success && result.data) {
      setTransactions(result.data.transactions || []);
    }
    setLoading(false);
  }, []);

  const checkKYCModal = useCallback(async () => {
    if (!user) return;
    if (user.kycTier === 1) {
      try {
        const modalShown = await AsyncStorage.getItem(KYC_MODAL_SHOWN_KEY);
        if (!modalShown) {
          setTimeout(() => setShowKYCModal(true), 1500);
          await AsyncStorage.setItem(KYC_MODAL_SHOWN_KEY, 'true');
        }
      } catch (error) {
        console.log('Error checking KYC modal state:', error);
      }
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { checkKYCModal(); }, [checkKYCModal]);
  useEffect(() => { fetchEphemeralStatus(); }, [fetchEphemeralStatus]);
  useEffect(() => {
    if (!loading && !hasCompletedTour('Home')) {
      setTimeout(() => startTour('Home'), 1000);
    }
  }, [loading, hasCompletedTour, startTour]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadData()]);
    setRefreshing(false);
  };

  const mainWallet = wallets.find(w => w.currency === 'UGX') || wallets[0];
  const balance = mainWallet?.balance || 0;

  const handleStartVerification = () => {
    setShowKYCModal(false);
    navigation.navigate('Profile', { startKYC: true });
  };

  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1: return { name: 'Basic', color: '#FFB020', bg: '#FFB02015' };
      case 2: return { name: 'Standard', color: '#00C48C', bg: '#00C48C15' };
      case 3: return { name: 'Premium', color: '#0066FF', bg: '#0066FF15' };
      default: return { name: 'Basic', color: '#FFB020', bg: '#FFB02015' };
    }
  };

  const tierInfo = getTierInfo(user?.kycTier || 1);

  // Quick action items with gradient backgrounds
  const airtimeIcon = require('../../assets/airtime.png');
  const taxesIcon = require('../../assets/taxes.png');
  const billsIcon = require('../../assets/bills.png');
  const dataIcon = require('../../assets/data.png');
  const quickActions = [
    { icon: '📱', label: t('actions.airtime'), screen: 'Airtime', gradient: ['#FF6B6B', '#FF8E8E'], imageIcon: airtimeIcon },
    { icon: '📶', label: t('actions.data'), screen: 'Data', gradient: ['#4ECDC4', '#6EE7DE'], imageIcon: dataIcon },
    { icon: '💡', label: t('actions.bills'), screen: 'Bills', gradient: ['#FFE66D', '#FFF09E'], imageIcon: billsIcon },
    { icon: '🏛️', label: 'Taxes', screen: 'URA', gradient: ['#95E1D3', '#B5F1E5'], imageIcon: taxesIcon },
    { icon: '🏦', label: t('actions.bank'), screen: 'Banks', gradient: ['#A8E6CF', '#C8F6DF'], customIcon: <BankIcon size={36} color="#2E7D32" /> },
  ];

  const savingsIcon = require('../../assets/save-money.png');
  const insuranceIcon = require('../../assets/family-insurance.png');
  const visaIcon = require('../../assets/visa.png');
  const financialServices = [
    { icon: '💰', label: t('actions.savings'), screen: 'Savings', gradient: ['#00C48C', '#20E4AC'], imageIcon: savingsIcon },
    { icon: '💳', label: t('actions.loans'), screen: 'Loans', gradient: ['#0066FF', '#3388FF'] },
    { icon: '🛡️', label: t('actions.insurance'), screen: 'Insurance', gradient: ['#9B59B6', '#BB79D6'], imageIcon: insuranceIcon },
    { icon: '💳', label: t('actions.cards'), screen: 'Cards', gradient: ['#E74C3C', '#F76C5C'], imageIcon: visaIcon },
    { icon: '📈', label: t('actions.trading'), screen: 'TradingHub', gradient: ['#F39C12', '#F5BC52'] },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: homeColors.background }]}>
        <ActivityIndicator size="large" color={homeColors.primary} />
      </View>
    );
  }

  const renderActionItem = (action: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.actionItem}
      onPress={() => action.screen && navigation.navigate(action.screen)}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconContainer}>
        {action.imageIcon ? (
          <Image source={action.imageIcon} style={styles.actionImageIcon} resizeMode="contain" />
        ) : action.customIcon ? (
          action.customIcon
        ) : (
          <Text style={styles.actionEmoji}>{action.icon}</Text>
        )}
      </View>
      <Text style={[styles.actionLabel, { color: homeColors.textSecondary }]} numberOfLines={1}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: homeColors.background }]}>
      <KYCUpgradeModal
        visible={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onStartVerification={handleStartVerification}
        currentTier={user?.kycTier || 1}
      />
      <LanguageSwitcher visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={homeColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: homeColors.textSecondary }]}>{greetingText}</Text>
            <Text style={[styles.userName, { color: homeColors.text }]}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.headerRight}>
            <LanguageButton onPress={() => setShowLanguageModal(true)} />
            <TouchableOpacity 
              style={[styles.tierBadge, { backgroundColor: tierInfo.bg }]}
              onPress={() => user?.kycTier === 1 && setShowKYCModal(true)}
            >
              <Text style={[styles.tierBadgeText, { color: tierInfo.color }]}>{tierInfo.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.notificationBtn, { backgroundColor: homeColors.card }]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Banner */}
        {!isOnline && (
          <View style={[styles.offlineBanner, { backgroundColor: homeColors.warning + '20' }]}>
            <Text style={[styles.offlineText, { color: homeColors.warning }]}>📴 You're offline</Text>
          </View>
        )}

        {/* KYC Upgrade Banner */}
        {user?.kycTier === 1 && (
          <TouchableOpacity 
            style={[styles.kycBanner, { backgroundColor: homeColors.card, borderColor: homeColors.warning }]}
            onPress={() => setShowKYCModal(true)}
          >
            <View style={styles.kycBannerContent}>
              <View style={[styles.kycIconBg, { backgroundColor: homeColors.warning + '20' }]}>
                <Text style={styles.kycBannerIcon}>⚡</Text>
              </View>
              <View style={styles.kycBannerText}>
                <Text style={[styles.kycBannerTitle, { color: homeColors.text }]}>{t('home.upgradeAccount')}</Text>
                <Text style={[styles.kycBannerSubtitle, { color: homeColors.textSecondary }]}>{t('home.unlockFeatures')}</Text>
              </View>
            </View>
            <Text style={[styles.kycBannerArrow, { color: homeColors.warning }]}>→</Text>
          </TouchableOpacity>
        )}

        {/* Balance Card */}
        <View style={styles.balanceCardContainer}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Animated floating balls background */}
            <FloatingBalls />
            {/* Inner highlight glow */}
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)', 'transparent', 'rgba(0,0,0,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardInnerGlow}
            />
            <BlurView intensity={30} tint="light" style={styles.blurOverlay}>
              <View style={styles.balanceHeader}>
                <TouchableOpacity 
                  style={styles.currencySelector} 
                  onPress={() => showBalance && setShowCurrencyPicker(!showCurrencyPicker)}
                >
                  <Text style={styles.balanceLabel}>{t('home.availableBalance')}</Text>
                  {showBalance && (
                    <View style={styles.currencyBadge}>
                      <Text style={styles.currencyFlag}>{currencyRates[selectedCurrency]?.flag}</Text>
                      <Text style={styles.currencyCode}>{selectedCurrency}</Text>
                      <Text style={styles.currencyArrow}>▼</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.balanceEye} onPress={() => setShowBalance(!showBalance)}>
                  <EyeIcon size={22} color="#FFFFFF" open={showBalance} />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>{showBalance ? convertBalance(balance, selectedCurrency) : '********'}</Text>
              
              {/* Currency Picker Dropdown */}
              {showCurrencyPicker && showBalance && (
                <View style={styles.currencyPicker}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Object.entries(currencyRates).map(([code, { flag }]) => (
                      <TouchableOpacity
                        key={code}
                        style={[
                          styles.currencyOption,
                          selectedCurrency === code && styles.currencyOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedCurrency(code);
                          setShowCurrencyPicker(false);
                        }}
                      >
                        <Text style={styles.currencyOptionFlag}>{flag}</Text>
                        <Text style={[
                          styles.currencyOptionCode,
                          selectedCurrency === code && styles.currencyOptionCodeSelected
                        ]}>{code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              <View style={styles.balanceActions}>
                <TouchableOpacity style={styles.balanceActionBtn} onPress={() => navigation.navigate('Deposit')}>
                  <View style={styles.balanceActionIcon}><Image source={require('../../assets/save-moneyX.png')} style={styles.balanceActionImage} resizeMode="contain" /></View>
                  <Text style={styles.balanceActionText}>{t('home.deposit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.balanceActionBtn} onPress={() => navigation.navigate('Send')}>
                  <View style={styles.balanceActionIcon}><SendIcon size={24} color="#FFFFFF" /></View>
                  <Text style={styles.balanceActionText}>{t('home.send')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.balanceActionBtn} onPress={() => navigation.navigate('Withdraw')}>
                  <View style={styles.balanceActionIcon}><Image source={require('../../assets/withdrawal.png')} style={styles.balanceActionImage} resizeMode="contain" /></View>
                  <Text style={styles.balanceActionText}>{t('home.withdraw')}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </View>

        {/* Exchange Rates Button */}
        <TouchableOpacity 
          style={[styles.exchangeRatesButton, { backgroundColor: homeColors.card, borderColor: homeColors.border }]}
          onPress={() => navigation.navigate('ExchangeRates')}
        >
          <View style={styles.exchangeRatesContent}>
            <View style={[styles.exchangeIconBg, { backgroundColor: homeColors.primary + '15' }]}>
              <Text style={styles.exchangeRatesIcon}>💱</Text>
            </View>
            <View style={styles.exchangeRatesText}>
              <Text style={[styles.exchangeRatesTitle, { color: homeColors.text }]}>Exchange Rates</Text>
              <Text style={[styles.exchangeRatesSubtitle, { color: homeColors.textSecondary }]}>View current currency rates</Text>
            </View>
          </View>
          <Text style={[styles.exchangeRatesArrow, { color: homeColors.primary }]}>›</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: homeColors.text }]}>{t('home.quickActions')}</Text>
          <View style={styles.actionsGrid}>{quickActions.map(renderActionItem)}</View>
        </View>

        {/* Financial Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: homeColors.text }]}>{t('home.financialServices')}</Text>
          <View style={styles.actionsGrid}>{financialServices.map(renderActionItem)}</View>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* Live Market Ticker */}
        <View style={styles.tickerSection}>
          <View style={[styles.tickerContainer, { backgroundColor: homeColors.card }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerScroll}>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>BTC</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>$67,234</Text>
                <Text style={[styles.tickerChange, { color: '#10B981' }]}>+2.4%</Text>
              </View>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>ETH</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>$3,456</Text>
                <Text style={[styles.tickerChange, { color: '#EF4444' }]}>-1.2%</Text>
              </View>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>EUR/USD</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>1.0876</Text>
                <Text style={[styles.tickerChange, { color: '#10B981' }]}>+0.3%</Text>
              </View>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>AAPL</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>$189.45</Text>
                <Text style={[styles.tickerChange, { color: '#10B981' }]}>+1.1%</Text>
              </View>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>GOLD</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>$2,034</Text>
                <Text style={[styles.tickerChange, { color: '#EF4444' }]}>-0.5%</Text>
              </View>
              <View style={styles.tickerItem}>
                <Text style={[styles.tickerSymbol, { color: homeColors.textSecondary }]}>USD/UGX</Text>
                <Text style={[styles.tickerPrice, { color: homeColors.text }]}>3,750</Text>
                <Text style={[styles.tickerChange, { color: '#10B981' }]}>+0.1%</Text>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: homeColors.text }]}>{t('home.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.seeAllLink, { color: homeColors.primary }]}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: homeColors.card }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: homeColors.textSecondary }]}>{t('home.noTransactions')}</Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <TouchableOpacity 
                key={txn.id} 
                style={[styles.transactionItem, { backgroundColor: homeColors.card }]}
              >
                <View style={[styles.txnIconContainer, { backgroundColor: homeColors.surfaceVariant }]}>
                  <Text style={styles.txnIcon}>{getTransactionIcon(txn.type)}</Text>
                </View>
                <View style={styles.txnDetails}>
                  <Text style={[styles.txnType, { color: homeColors.text }]}>{formatTransactionType(txn.type)}</Text>
                  <Text style={[styles.txnDate, { color: homeColors.textSecondary }]}>{formatDate(txn.createdAt)}</Text>
                </View>
                <Text style={[styles.txnAmount, txn.type === 'DEPOSIT' ? styles.txnPositive : { color: homeColors.text }]}>
                  {txn.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Welcome Back Ticker - News style cycling, lasts 10 sec with glitchy fade */}
      {showTicker && (
        <Animated.View style={[
          styles.tickerBar, 
          { 
            backgroundColor: homeColors.primary, 
            opacity: tickerBarOpacity,
            transform: [
              { translateX: tickerGlitchX },
              { scaleX: tickerGlitchScale },
            ]
          }
        ]}>
          <Animated.Text 
            style={[
              styles.tickerText, 
              styles.tickerTextCentered,
              { opacity: tickerFade }
            ]}
          >
            Coming Soon: {comingSoonServices[currentTickerIndex]}
          </Animated.Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 14, marginBottom: 2 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingEmoji: { fontSize: 16 },
  userName: { fontSize: 22, fontFamily: 'Montserrat_700Bold' },
  userNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  wavingEmoji: { fontSize: 22 },
  ephemeralBadge: { backgroundColor: '#0066FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 4 },
  ephemeralText: { color: '#fff', fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  // Welcome back ticker
  tickerBar: { position: 'absolute', bottom: 80, left: 0, right: 0, height: 32, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: 0 },
  tickerContent: { position: 'absolute' },
  tickerText: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  tickerTextCentered: { textAlign: 'center' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tierBadgeText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notificationIcon: { fontSize: 20 },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF4757', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  offlineBanner: { paddingVertical: 10, paddingHorizontal: 20, marginHorizontal: 20, marginBottom: 12, borderRadius: 10, alignItems: 'center' },
  offlineText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
  // Ad Banner
  adBanner: { marginHorizontal: 20, marginVertical: 10, padding: 16, borderRadius: 16, borderWidth: 0, overflow: 'hidden' },
  adContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adTextContainer: { flex: 1 },
  adTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginBottom: 4 },
  adSubtitle: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  adButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  adButtonText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#0066FF' },
  adEmoji: { fontSize: 40, marginLeft: 10 },
  adLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  adPlaceholder: { height: 60, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  adPlaceholderText: { fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  adPlaceholderSubtext: { fontSize: 11, marginTop: 2 },
  // KYC Banner
  kycBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: 14, borderLeftWidth: 4 },
  kycBannerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  kycIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kycBannerIcon: { fontSize: 20 },
  kycBannerText: { flex: 1 },
  kycBannerTitle: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  kycBannerSubtitle: { fontSize: 12, marginTop: 2 },
  kycBannerArrow: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold' },
  // Balance Card with Premium 3D Glassmorphism
  balanceCardContainer: { 
    margin: 20, 
    marginTop: 8, 
    borderRadius: 28, 
    overflow: 'hidden', 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 25 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 35, 
    elevation: 25,
    transform: [{ perspective: 1200 }, { rotateX: '-3deg' }],
  },
  balanceCard: { 
    borderRadius: 28, 
    borderWidth: 2, 
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
  },
  blurOverlay: { 
    padding: 26, 
    borderRadius: 28, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceEye: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  balanceAmount: { fontSize: 38, fontFamily: 'Montserrat_700Bold', color: '#fff', marginVertical: 12, letterSpacing: -1 },
  // Currency selector styles
  currencySelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  currencyFlag: { fontSize: 14 },
  currencyCode: { fontSize: 11, color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
  currencyArrow: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  currencyPicker: { marginTop: 8, marginBottom: 4 },
  currencyOption: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  currencyOptionSelected: { backgroundColor: 'rgba(255,255,255,0.35)' },
  currencyOptionFlag: { fontSize: 20, marginBottom: 2 },
  currencyOptionCode: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat_500Medium' },
  currencyOptionCodeSelected: { color: '#fff', fontFamily: 'Montserrat_700Bold' },
  balanceActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  balanceActionBtn: { flex: 1, alignItems: 'center' },
  balanceActionIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  balanceActionEmoji: { fontSize: 24 },
  balanceActionImage: { width: 24, height: 24 },
  balanceActionText: { fontSize: 13, color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
  // Exchange Rates
  exchangeRatesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 8, padding: 16, borderRadius: 14, borderWidth: 1 },
  exchangeRatesContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exchangeIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  exchangeRatesIcon: { fontSize: 24 },
  exchangeRatesText: { flex: 1 },
  exchangeRatesTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  exchangeRatesSubtitle: { fontSize: 13, marginTop: 2 },
  exchangeRatesArrow: { fontSize: 28, fontFamily: 'Montserrat_300Light' },
  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', width: '20%', marginBottom: 16 },
  actionIconContainer: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 32 },
  actionImageIcon: { width: 36, height: 36 },
  actionLabel: { fontSize: 11, textAlign: 'center' },
  // Market Ticker
  tickerSection: { paddingHorizontal: 20, paddingVertical: 12 },
  tickerContainer: { borderRadius: 12, padding: 12 },
  tickerScroll: { flexDirection: 'row', gap: 16 },
  tickerItem: { alignItems: 'center', paddingHorizontal: 8 },
  tickerSymbol: { fontSize: 10, fontFamily: 'Montserrat_500Medium', marginBottom: 2 },
  tickerPrice: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  tickerChange: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  // Transactions
  transactionsSection: { paddingHorizontal: 20, paddingTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllLink: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 40, borderRadius: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10 },
  txnIconContainer: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txnIcon: { fontSize: 22 },
  txnDetails: { flex: 1 },
  txnType: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  txnDate: { fontSize: 12, marginTop: 3 },
  txnAmount: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  txnPositive: { color: '#00C48C' },
});
