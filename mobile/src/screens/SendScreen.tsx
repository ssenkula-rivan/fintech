// GMG Global Mobile App - Send Money Screen (International)
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, FlatList, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useNotification } from '../utils/useNotification';
import { formatCurrency, normalizePhone } from '../utils/format';

type SendMethod = 'wallet' | 'mobile' | 'bank';

// International Countries for GMG Wallet
const countries = [
  // Africa
  { id: 'ug', name: 'Uganda', flag: '🇺🇬', code: '+256', currency: 'UGX' },
  { id: 'ke', name: 'Kenya', flag: '🇰🇪', code: '+254', currency: 'KES' },
  { id: 'tz', name: 'Tanzania', flag: '🇹🇿', code: '+255', currency: 'TZS' },
  { id: 'rw', name: 'Rwanda', flag: '🇷🇼', code: '+250', currency: 'RWF' },
  { id: 'gh', name: 'Ghana', flag: '🇬🇭', code: '+233', currency: 'GHS' },
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬', code: '+234', currency: 'NGN' },
  { id: 'za', name: 'South Africa', flag: '🇿🇦', code: '+27', currency: 'ZAR' },
  { id: 'eg', name: 'Egypt', flag: '🇪🇬', code: '+20', currency: 'EGP' },
  { id: 'ma', name: 'Morocco', flag: '🇲🇦', code: '+212', currency: 'MAD' },
  { id: 'et', name: 'Ethiopia', flag: '🇪🇹', code: '+251', currency: 'ETB' },
  { id: 'sn', name: 'Senegal', flag: '🇸🇳', code: '+221', currency: 'XOF' },
  { id: 'ci', name: 'Ivory Coast', flag: '🇨🇮', code: '+225', currency: 'XOF' },
  { id: 'cm', name: 'Cameroon', flag: '🇨🇲', code: '+237', currency: 'XAF' },
  { id: 'zm', name: 'Zambia', flag: '🇿🇲', code: '+260', currency: 'ZMW' },
  { id: 'zw', name: 'Zimbabwe', flag: '🇿🇼', code: '+263', currency: 'USD' },
  // Europe
  { id: 'gb', name: 'United Kingdom', flag: '🇬🇧', code: '+44', currency: 'GBP' },
  { id: 'de', name: 'Germany', flag: '🇩🇪', code: '+49', currency: 'EUR' },
  { id: 'fr', name: 'France', flag: '🇫🇷', code: '+33', currency: 'EUR' },
  { id: 'it', name: 'Italy', flag: '🇮🇹', code: '+39', currency: 'EUR' },
  { id: 'es', name: 'Spain', flag: '🇪🇸', code: '+34', currency: 'EUR' },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱', code: '+31', currency: 'EUR' },
  { id: 'be', name: 'Belgium', flag: '🇧🇪', code: '+32', currency: 'EUR' },
  { id: 'se', name: 'Sweden', flag: '🇸🇪', code: '+46', currency: 'SEK' },
  { id: 'no', name: 'Norway', flag: '🇳🇴', code: '+47', currency: 'NOK' },
  { id: 'ch', name: 'Switzerland', flag: '🇨🇭', code: '+41', currency: 'CHF' },
  { id: 'at', name: 'Austria', flag: '🇦🇹', code: '+43', currency: 'EUR' },
  { id: 'pl', name: 'Poland', flag: '🇵🇱', code: '+48', currency: 'PLN' },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪', code: '+353', currency: 'EUR' },
  { id: 'pt', name: 'Portugal', flag: '🇵🇹', code: '+351', currency: 'EUR' },
  // Americas
  { id: 'us', name: 'United States', flag: '🇺🇸', code: '+1', currency: 'USD' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', code: '+1', currency: 'CAD' },
  { id: 'mx', name: 'Mexico', flag: '🇲🇽', code: '+52', currency: 'MXN' },
  { id: 'br', name: 'Brazil', flag: '🇧🇷', code: '+55', currency: 'BRL' },
  { id: 'ar', name: 'Argentina', flag: '🇦🇷', code: '+54', currency: 'ARS' },
  { id: 'co', name: 'Colombia', flag: '🇨🇴', code: '+57', currency: 'COP' },
  { id: 'cl', name: 'Chile', flag: '🇨🇱', code: '+56', currency: 'CLP' },
  { id: 'pe', name: 'Peru', flag: '🇵🇪', code: '+51', currency: 'PEN' },
  // Asia
  { id: 'in', name: 'India', flag: '🇮🇳', code: '+91', currency: 'INR' },
  { id: 'cn', name: 'China', flag: '🇨🇳', code: '+86', currency: 'CNY' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵', code: '+81', currency: 'JPY' },
  { id: 'kr', name: 'South Korea', flag: '🇰🇷', code: '+82', currency: 'KRW' },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', code: '+65', currency: 'SGD' },
  { id: 'my', name: 'Malaysia', flag: '🇲🇾', code: '+60', currency: 'MYR' },
  { id: 'th', name: 'Thailand', flag: '🇹🇭', code: '+66', currency: 'THB' },
  { id: 'ph', name: 'Philippines', flag: '🇵🇭', code: '+63', currency: 'PHP' },
  { id: 'id', name: 'Indonesia', flag: '🇮🇩', code: '+62', currency: 'IDR' },
  { id: 'vn', name: 'Vietnam', flag: '🇻🇳', code: '+84', currency: 'VND' },
  { id: 'pk', name: 'Pakistan', flag: '🇵🇰', code: '+92', currency: 'PKR' },
  { id: 'bd', name: 'Bangladesh', flag: '🇧🇩', code: '+880', currency: 'BDT' },
  // Middle East
  { id: 'ae', name: 'UAE', flag: '🇦🇪', code: '+971', currency: 'AED' },
  { id: 'sa', name: 'Saudi Arabia', flag: '🇸🇦', code: '+966', currency: 'SAR' },
  { id: 'qa', name: 'Qatar', flag: '🇶🇦', code: '+974', currency: 'QAR' },
  { id: 'kw', name: 'Kuwait', flag: '🇰🇼', code: '+965', currency: 'KWD' },
  { id: 'om', name: 'Oman', flag: '🇴🇲', code: '+968', currency: 'OMR' },
  { id: 'bh', name: 'Bahrain', flag: '🇧🇭', code: '+973', currency: 'BHD' },
  { id: 'il', name: 'Israel', flag: '🇮🇱', code: '+972', currency: 'ILS' },
  { id: 'tr', name: 'Turkey', flag: '🇹🇷', code: '+90', currency: 'TRY' },
  // Oceania
  { id: 'au', name: 'Australia', flag: '🇦🇺', code: '+61', currency: 'AUD' },
  { id: 'nz', name: 'New Zealand', flag: '🇳🇿', code: '+64', currency: 'NZD' },
];

// International Mobile Money Providers
const mobileMoneyProviders = [
  // East Africa
  { id: 'mtn_ug', name: 'MTN Mobile Money', country: 'Uganda', code: 'MTN', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'airtel_ug', name: 'Airtel Money', country: 'Uganda', code: 'AIRTEL', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'mpesa_ke', name: 'M-Pesa', country: 'Kenya', code: 'MPESA', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'airtel_ke', name: 'Airtel Money', country: 'Kenya', code: 'AIRTEL', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'mpesa_tz', name: 'M-Pesa', country: 'Tanzania', code: 'MPESA', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'tigopesa_tz', name: 'Tigo Pesa', country: 'Tanzania', code: 'TIGO', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'airtel_tz', name: 'Airtel Money', country: 'Tanzania', code: 'AIRTEL', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'mtn_rw', name: 'MTN Mobile Money', country: 'Rwanda', code: 'MTN', flag: '🇷🇼', currency: 'RWF', prefix: '+250' },
  { id: 'airtel_rw', name: 'Airtel Money', country: 'Rwanda', code: 'AIRTEL', flag: '🇷🇼', currency: 'RWF', prefix: '+250' },
  // West Africa
  { id: 'mtn_gh', name: 'MTN Mobile Money', country: 'Ghana', code: 'MTN', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'vodafone_gh', name: 'Vodafone Cash', country: 'Ghana', code: 'VODAFONE', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'mtn_ng', name: 'MTN MoMo', country: 'Nigeria', code: 'MTN', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'opay_ng', name: 'OPay', country: 'Nigeria', code: 'OPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'palmpay_ng', name: 'PalmPay', country: 'Nigeria', code: 'PALMPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'orange_sn', name: 'Orange Money', country: 'Senegal', code: 'ORANGE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'wave_sn', name: 'Wave', country: 'Senegal', code: 'WAVE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'orange_ci', name: 'Orange Money', country: 'Ivory Coast', code: 'ORANGE', flag: '🇨🇮', currency: 'XOF', prefix: '+225' },
  // Southern Africa
  { id: 'mpesa_za', name: 'M-Pesa', country: 'South Africa', code: 'MPESA', flag: '🇿🇦', currency: 'ZAR', prefix: '+27' },
  { id: 'ecocash_zw', name: 'EcoCash', country: 'Zimbabwe', code: 'ECOCASH', flag: '🇿🇼', currency: 'USD', prefix: '+263' },
  { id: 'airtel_zm', name: 'Airtel Money', country: 'Zambia', code: 'AIRTEL', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  { id: 'mtn_zm', name: 'MTN Mobile Money', country: 'Zambia', code: 'MTN', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  // Central Africa
  { id: 'orange_cm', name: 'Orange Money', country: 'Cameroon', code: 'ORANGE', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
  { id: 'mtn_cm', name: 'MTN Mobile Money', country: 'Cameroon', code: 'MTN', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
];


export default function SendScreen() {
  const navigation = useNavigation<any>();
  const { wallets, refreshUser } = useAuth();
  const { colors } = useTheme();
  const { country: userCountry } = useRegion();
  const { showSuccess, showError, showWarning } = useNotification();
  
  // Find default provider based on user's region
  const getDefaultProvider = () => {
    const regionProvider = mobileMoneyProviders.find(p => 
      p.country.toLowerCase() === userCountry.name.toLowerCase()
    );
    return regionProvider || mobileMoneyProviders[0];
  };

  const getDefaultCountry = () => {
    const regionCountry = countries.find(c => 
      c.id.toLowerCase() === userCountry.code.toLowerCase()
    );
    return regionCountry || countries[0];
  };

  const [method, setMethod] = useState<SendMethod>('wallet');
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProvider());
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [senderProvider, setSenderProvider] = useState(getDefaultProvider());
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showSenderPicker, setShowSenderPicker] = useState(false);
  const [senderPhone, setSenderPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [senderSearchQuery, setSenderSearchQuery] = useState('');

  // Update defaults when region changes
  useEffect(() => {
    setSelectedProvider(getDefaultProvider());
    setSenderProvider(getDefaultProvider());
    setSelectedCountry(getDefaultCountry());
  }, [userCountry]);

  const mainWallet = wallets.find(w => w.currency === 'UGX');
  const balance = mainWallet?.balance || 0;
  const amountNum = parseFloat(amount) || 0;
  const fee = method === 'wallet' ? Math.max(amountNum * 0.005, 100) : Math.max(amountNum * 0.015, 500);
  const total = amountNum + fee;

  const filteredProviders = mobileMoneyProviders.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    c.code.includes(countrySearchQuery)
  );

  const filteredSenderProviders = mobileMoneyProviders.filter(p => 
    p.name.toLowerCase().includes(senderSearchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(senderSearchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (!phone || phone.length < 6) {
      showError('Invalid Phone', 'Please enter a valid recipient phone number');
      return;
    }
    if (method === 'mobile' && (!senderPhone || senderPhone.length < 6)) {
      showError('Invalid Phone', 'Please enter your mobile money number');
      return;
    }
    if (!amount || amountNum < 1000) {
      showWarning('Minimum Amount', 'Minimum amount is 1,000');
      return;
    }
    if (method === 'wallet' && total > balance) {
      showError('Insufficient Balance', 'You don\'t have enough funds in your wallet');
      return;
    }
    setStep('confirm');
  };

  const handleSend = async () => {
    if (pin.length !== 6) {
      showError('Invalid PIN', 'Please enter your 6-digit PIN');
      return;
    }

    setLoading(true);
    
    let result;
    if (method === 'wallet') {
      result = await api.sendMoney({
        recipientPhone: `${selectedCountry.code}${phone.replace(/^0+/, '')}`,
        amount: amountNum,
        currency: selectedCountry.currency,
        pin,
        description: description || undefined,
      });
    } else {
      // Mobile to Mobile transfer - money comes from sender's mobile money
      result = await api.post('/transactions/mobile-transfer', {
        senderPhone: `${senderProvider.prefix}${senderPhone.replace(/^0+/, '')}`,
        senderProvider: senderProvider.code,
        senderCountry: senderProvider.country,
        recipientPhone: `${selectedProvider.prefix}${phone.replace(/^0+/, '')}`,
        recipientProvider: selectedProvider.code,
        recipientCountry: selectedProvider.country,
        amount: amountNum,
        currency: senderProvider.currency,
        reason: description || undefined,
      });
    }
    
    setLoading(false);

    if (result.success) {
      await refreshUser();
      const txnData = result.data as any;
      setReceiptData({
        transactionId: txnData?.transactionId || txnData?.id || `TXN${Date.now()}`,
        method: method === 'wallet' ? 'GMG Wallet' : `${senderProvider.name} → ${selectedProvider.name}`,
        fromCountry: method === 'wallet' ? selectedCountry.name : senderProvider.country,
        toCountry: method === 'wallet' ? selectedCountry.name : selectedProvider.country,
        fromFlag: method === 'wallet' ? selectedCountry.flag : senderProvider.flag,
        toFlag: method === 'wallet' ? selectedCountry.flag : selectedProvider.flag,
        fromPhone: method === 'wallet' ? '' : `${senderProvider.prefix}${senderPhone}`,
        phone: method === 'wallet' ? `${selectedCountry.code}${phone}` : `${selectedProvider.prefix}${phone}`,
        amount: amountNum,
        currency: method === 'wallet' ? selectedCountry.currency : senderProvider.currency,
        fee: fee,
        total: total,
        date: new Date().toLocaleString(),
        status: method === 'wallet' ? 'COMPLETED' : 'PENDING',
      });
      setShowReceipt(true);
      showSuccess('Money Sent!', method === 'mobile' ? 'Check your phone to approve the transfer' : `${formatCurrency(amountNum)} sent successfully`);
    } else {
      showError('Transfer Failed', result.error || 'Please try again');
    }
  };

  const quickAmounts = [10000, 50000, 100000, 500000];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 'confirm' ? setStep('details') : navigation.goBack()}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Send Money</Text>
            <View style={{ width: 50 }} />
          </View>

          {step === 'details' ? (
            <>
              {/* Send Method Tabs */}
              <View style={[styles.methodTabs, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[styles.methodTab, method === 'wallet' && styles.methodTabActive]}
                  onPress={() => setMethod('wallet')}
                >
                  <Text style={[styles.methodTabText, method === 'wallet' && styles.methodTabTextActive]}>
                    GMG Wallet
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodTab, method === 'mobile' && styles.methodTabActive]}
                  onPress={() => setMethod('mobile')}
                >
                  <Text style={[styles.methodTabText, method === 'mobile' && styles.methodTabTextActive]}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Country Selection for Wallet */}
              {method === 'wallet' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Recipient Country</Text>
                  <TouchableOpacity
                    style={[styles.providerSelector, { backgroundColor: colors.card }]}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.providerFlag}>{selectedCountry.flag}</Text>
                    <View style={styles.providerInfo}>
                      <Text style={[styles.providerName, { color: colors.text }]}>{selectedCountry.name}</Text>
                      <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                        {selectedCountry.code} • {selectedCountry.currency}
                      </Text>
                    </View>
                    <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mobile Money Provider Selection */}
              {method === 'mobile' && (
                <>
                  {/* FROM - Sender's Mobile Money */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>From (Your Mobile Money)</Text>
                    <TouchableOpacity
                      style={[styles.providerSelector, { backgroundColor: colors.card }]}
                      onPress={() => setShowSenderPicker(true)}
                    >
                      <Text style={styles.providerFlag}>{senderProvider.flag}</Text>
                      <View style={styles.providerInfo}>
                        <Text style={[styles.providerName, { color: colors.text }]}>{senderProvider.name}</Text>
                        <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                          {senderProvider.country} • {senderProvider.currency}
                        </Text>
                      </View>
                      <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sender Phone Number */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Your {senderProvider.name} Number</Text>
                    <View style={[styles.phoneInputContainer, { backgroundColor: colors.card }]}>
                      <Text style={[styles.phonePrefix, { color: colors.textMuted }]}>{senderProvider.prefix}</Text>
                      <TextInput
                        style={[styles.phoneInput, { color: colors.text }]}
                        placeholder="Your phone number"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        value={senderPhone}
                        onChangeText={setSenderPhone}
                        maxLength={12}
                      />
                    </View>
                  </View>

                  {/* Arrow indicator */}
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowText}>↓</Text>
                    <Text style={[styles.arrowLabel, { color: colors.textMuted }]}>Send to</Text>
                  </View>

                  {/* TO - Recipient's Mobile Money */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>To (Recipient's Mobile Money)</Text>
                    <TouchableOpacity
                      style={[styles.providerSelector, { backgroundColor: colors.card }]}
                      onPress={() => setShowProviderPicker(true)}
                    >
                      <Text style={styles.providerFlag}>{selectedProvider.flag}</Text>
                      <View style={styles.providerInfo}>
                        <Text style={[styles.providerName, { color: colors.text }]}>{selectedProvider.name}</Text>
                        <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                          {selectedProvider.country} • {selectedProvider.currency}
                        </Text>
                      </View>
                      <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {method === 'mobile' ? null : (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Provider</Text>
                  <TouchableOpacity
                    style={[styles.providerSelector, { backgroundColor: colors.card }]}
                    onPress={() => setShowProviderPicker(true)}
                  >
                    <Text style={styles.providerFlag}>{selectedProvider.flag}</Text>
                    <View style={styles.providerInfo}>
                      <Text style={[styles.providerName, { color: colors.text }]}>{selectedProvider.name}</Text>
                      <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                        {selectedProvider.country} • {selectedProvider.currency}
                      </Text>
                    </View>
                    <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Recipient Phone - Only for Wallet */}
              {method === 'wallet' && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Recipient GMG Phone
                </Text>
                <View style={[styles.phoneInputContainer, { backgroundColor: colors.card }]}>
                  <Text style={[styles.phonePrefix, { color: colors.textMuted }]}>
                    {selectedCountry.code}
                  </Text>
                  <TextInput
                    style={[styles.phoneInput, { color: colors.text }]}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={12}
                  />
                </View>
              </View>
              )}

              {/* Recipient Phone - Only for Mobile Money (already in the mobile section above) */}
              {method === 'mobile' && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Recipient {selectedProvider.name} Number
                </Text>
                <View style={[styles.phoneInputContainer, { backgroundColor: colors.card }]}>
                  <Text style={[styles.phonePrefix, { color: colors.textMuted }]}>
                    {selectedProvider.prefix}
                  </Text>
                  <TextInput
                    style={[styles.phoneInput, { color: colors.text }]}
                    placeholder="Enter recipient number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={12}
                  />
                </View>
              </View>
              )}

              {/* Amount */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Amount</Text>
                <TextInput
                  style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickAmountBtn, { backgroundColor: colors.card }, amountNum === amt && styles.quickAmountSelected]}
                      onPress={() => setAmount(amt.toString())}
                    >
                      <Text style={[styles.quickAmountText, { color: colors.textSecondary }, amountNum === amt && styles.quickAmountTextSelected]}>
                        {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description/Reason - For both wallet and mobile money */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {method === 'wallet' ? 'Note (Optional)' : 'Reason for Transfer'}
                </Text>
                <TextInput
                  style={[styles.noteInput, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder={method === 'wallet' ? "What's this for?" : "e.g. Family support, Business, Gift..."}
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={100}
                />
              </View>

              {/* Balance - Only for Wallet */}
              {method === 'wallet' && (
              <View style={[styles.balanceInfo, { backgroundColor: colors.card }]}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
                <Text style={[styles.balanceValue, { color: colors.text }]}>{formatCurrency(balance)}</Text>
              </View>
              )}

              <TouchableOpacity
                style={[styles.button, (amountNum < 1000 || !phone) && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={amountNum < 1000 || !phone}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Confirmation */}
              <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm Transfer</Text>
                
                <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>To</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>
                    {method === 'wallet' ? `${selectedCountry.flag} ${selectedCountry.code}${phone}` : `${selectedProvider.flag} ${selectedProvider.prefix}${phone}`}
                  </Text>
                </View>
                {method === 'mobile' && (
                  <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>From</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {senderProvider.flag} {senderProvider.prefix}{senderPhone}
                    </Text>
                  </View>
                )}
                {method === 'mobile' && (
                  <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Transfer</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {senderProvider.name} → {selectedProvider.name}
                    </Text>
                  </View>
                )}
                {method === 'wallet' && (
                  <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Country</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedCountry.name}</Text>
                  </View>
                )}
                {method === 'mobile' && (
                  <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Provider</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedProvider.name}</Text>
                  </View>
                )}
                <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Amount</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>{formatCurrency(amountNum)}</Text>
                </View>
                <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Fee</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>{formatCurrency(fee)}</Text>
                </View>
                <View style={[styles.confirmRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>

              {/* PIN */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Enter PIN to Confirm</Text>
                <TextInput
                  style={[styles.pinInput, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="••••••"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  secureTextEntry={true}
                  value={pin}
                  onChangeText={setPin}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send {formatCurrency(amountNum)}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sender Provider Picker Modal */}
      <Modal visible={showSenderPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Your Mobile Money</Text>
              <TouchableOpacity onPress={() => setShowSenderPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Search country or provider..."
              placeholderTextColor={colors.textMuted}
              value={senderSearchQuery}
              onChangeText={setSenderSearchQuery}
            />
            
            <FlatList
              data={filteredSenderProviders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSenderProvider(item);
                    setShowSenderPicker(false);
                    setSenderSearchQuery('');
                  }}
                >
                  <Text style={styles.providerItemFlag}>{item.flag}</Text>
                  <View style={styles.providerItemInfo}>
                    <Text style={[styles.providerItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.providerItemCountry, { color: colors.textMuted }]}>
                      {item.country} • {item.currency}
                    </Text>
                  </View>
                  {senderProvider.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Search country..."
              placeholderTextColor={colors.textMuted}
              value={countrySearchQuery}
              onChangeText={setCountrySearchQuery}
            />
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                    setCountrySearchQuery('');
                  }}
                >
                  <Text style={styles.providerItemFlag}>{item.flag}</Text>
                  <View style={styles.providerItemInfo}>
                    <Text style={[styles.providerItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.providerItemCountry, { color: colors.textMuted }]}>
                      {item.code} • {item.currency}
                    </Text>
                  </View>
                  {selectedCountry.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Provider Picker Modal */}
      <Modal visible={showProviderPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Provider</Text>
              <TouchableOpacity onPress={() => setShowProviderPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Search country or provider..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <FlatList
              data={filteredProviders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedProvider(item);
                    setShowProviderPicker(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.providerItemFlag}>{item.flag}</Text>
                  <View style={styles.providerItemInfo}>
                    <Text style={[styles.providerItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.providerItemCountry, { color: colors.textMuted }]}>
                      {item.country} • {item.currency}
                    </Text>
                  </View>
                  {selectedProvider.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptModal, { backgroundColor: colors.background }]}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptIcon}>✓</Text>
              <Text style={[styles.receiptTitle, { color: colors.text }]}>Transfer Successful</Text>
            </View>

            <View style={[styles.receiptCard, { backgroundColor: colors.card }]}>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.transactionId}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.phone}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Provider</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.method}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={styles.receiptAmountValue}>{formatCurrency(receiptData?.amount || 0)}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={[styles.statusBadge, receiptData?.status === 'COMPLETED' && styles.statusCompleted]}>
                  <Text style={[styles.statusText, receiptData?.status === 'COMPLETED' && styles.statusTextCompleted]}>
                    {receiptData?.status}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.receiptDoneBtn}
              onPress={() => {
                setShowReceipt(false);
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }}
            >
              <Text style={styles.receiptDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(10) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(16) },
  backBtn: { fontSize: scale(15) },
  title: { fontSize: scale(18), fontFamily: 'Montserrat_600SemiBold' },
  // Method Tabs
  methodTabs: { flexDirection: 'row', borderRadius: scale(10), padding: scale(3), marginBottom: verticalScale(16) },
  methodTab: { flex: 1, paddingVertical: verticalScale(10), alignItems: 'center', borderRadius: scale(8) },
  methodTabActive: { backgroundColor: '#0066FF' },
  methodTabText: { color: '#888', fontSize: scale(13), fontFamily: 'Montserrat_500Medium' },
  methodTabTextActive: { color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
  // Sections
  section: { marginBottom: verticalScale(16) },
  sectionLabel: { fontSize: scale(13), marginBottom: verticalScale(8) },
  // Provider Selector
  providerSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(12) },
  providerFlag: { fontSize: scale(24), marginRight: scale(10) },
  providerInfo: { flex: 1 },
  providerName: { fontSize: scale(14), fontFamily: 'Montserrat_600SemiBold' },
  providerCountry: { fontSize: scale(11), marginTop: 2 },
  dropdownArrow: { fontSize: scale(10) },
  // Arrow indicator
  arrowContainer: { alignItems: 'center', marginVertical: verticalScale(6) },
  arrowText: { fontSize: scale(22), color: '#0066FF' },
  arrowLabel: { fontSize: scale(11), marginTop: 2 },
  // Phone Input
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: scale(10), paddingHorizontal: scale(12) },
  phonePrefix: { fontSize: scale(14), marginRight: scale(8), fontFamily: 'Montserrat_500Medium' },
  phoneInput: { flex: 1, paddingVertical: verticalScale(12), fontSize: scale(14) },
  // Amount
  amountInput: { borderRadius: scale(10), paddingHorizontal: scale(16), paddingVertical: verticalScale(14), fontSize: scale(isSmallDevice ? 22 : 26), textAlign: 'center' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: verticalScale(8), justifyContent: 'space-between' },
  quickAmountBtn: { width: '23%', borderRadius: scale(8), paddingVertical: verticalScale(8), alignItems: 'center' },
  quickAmountSelected: { backgroundColor: '#0066FF' },
  quickAmountText: { fontFamily: 'Montserrat_600SemiBold', fontSize: scale(12) },
  quickAmountTextSelected: { color: '#fff' },
  noteInput: { borderRadius: scale(10), paddingHorizontal: scale(14), paddingVertical: verticalScale(12), fontSize: scale(14) },
  // Balance
  balanceInfo: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(14), marginBottom: verticalScale(16) },
  balanceLabel: { fontSize: scale(13) },
  balanceValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: scale(14) },
  // Button
  button: { backgroundColor: '#0066FF', borderRadius: scale(10), paddingVertical: verticalScale(14), alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: scale(16), fontFamily: 'Montserrat_600SemiBold' },
  // Confirm
  confirmCard: { borderRadius: scale(14), paddingVertical: verticalScale(16), paddingHorizontal: scale(16), marginBottom: verticalScale(20) },
  confirmTitle: { fontSize: scale(16), fontFamily: 'Montserrat_600SemiBold', marginBottom: verticalScale(14), textAlign: 'center' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: verticalScale(10), borderBottomWidth: 1 },
  confirmLabel: { fontSize: scale(12), flex: 1 },
  confirmValue: { fontSize: scale(12), fontFamily: 'Montserrat_500Medium', flex: 1, textAlign: 'right' },
  totalRow: { borderBottomWidth: 0, marginTop: verticalScale(6) },
  totalLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: scale(14) },
  totalValue: { color: '#0066FF', fontFamily: 'Montserrat_700Bold', fontSize: scale(16) },
  pinInput: { borderRadius: scale(10), paddingVertical: verticalScale(14), fontSize: scale(20), textAlign: 'center', letterSpacing: scale(6) },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), maxHeight: '80%', paddingVertical: verticalScale(14), paddingHorizontal: scale(14) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(10) },
  modalTitle: { fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  modalClose: { fontSize: scale(20), padding: scale(4) },
  searchInput: { borderRadius: scale(10), paddingHorizontal: scale(12), paddingVertical: verticalScale(10), fontSize: scale(14), marginBottom: verticalScale(10) },
  // Provider Item
  providerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(10), borderBottomWidth: 1 },
  providerItemFlag: { fontSize: scale(22), marginRight: scale(10) },
  providerItemInfo: { flex: 1 },
  providerItemName: { fontSize: scale(14), fontFamily: 'Montserrat_500Medium' },
  providerItemCountry: { fontSize: scale(10), marginTop: 2 },
  checkmark: { color: '#0066FF', fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  // Receipt
  receiptModal: { borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingVertical: verticalScale(16), paddingHorizontal: scale(16) },
  receiptHeader: { alignItems: 'center', marginBottom: verticalScale(14) },
  receiptIcon: { fontSize: scale(36), color: '#4CAF50', backgroundColor: '#0a2a1a', width: scale(60), height: scale(60), lineHeight: scale(60), textAlign: 'center', borderRadius: scale(30), marginBottom: verticalScale(8), overflow: 'hidden' },
  receiptTitle: { fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  receiptCard: { borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(12), marginBottom: verticalScale(14) },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8), borderBottomWidth: 1 },
  receiptLabel: { fontSize: scale(12), flex: 1 },
  receiptValue: { fontSize: scale(12), fontFamily: 'Montserrat_500Medium', flex: 1, textAlign: 'right' },
  receiptAmountValue: { color: '#4CAF50', fontSize: scale(14), fontFamily: 'Montserrat_700Bold' },
  statusBadge: { backgroundColor: '#332200', paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: scale(8) },
  statusCompleted: { backgroundColor: '#0a2a1a' },
  statusText: { color: '#FFAA00', fontSize: scale(10), fontFamily: 'Montserrat_600SemiBold' },
  statusTextCompleted: { color: '#4CAF50' },
  receiptDoneBtn: { backgroundColor: '#0066FF', borderRadius: scale(10), paddingVertical: verticalScale(12), alignItems: 'center' },
  receiptDoneBtnText: { color: '#fff', fontSize: scale(14), fontFamily: 'Montserrat_600SemiBold' },
});
