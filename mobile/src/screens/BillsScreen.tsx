// GMG Global - Bills Payment Screen (International)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface BillCategory {
  id: string;
  name: string;
  icon: string;
  providers: BillProvider[];
}

interface BillProvider {
  id: string;
  name: string;
  code: string;
  country?: string;
  flag?: string;
}

const BILL_CATEGORIES: BillCategory[] = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: '💡',
    providers: [
      // Uganda
      { id: 'uedcl', name: 'UEDCL Light', code: 'UEDCL', country: 'Uganda', flag: '🇺🇬' },
      { id: 'lit', name: 'LIT Prepaid', code: 'LIT', country: 'Uganda', flag: '🇺🇬' },
      // Kenya
      { id: 'kplc', name: 'Kenya Power (KPLC)', code: 'KPLC', country: 'Kenya', flag: '🇰🇪' },
      // Tanzania
      { id: 'tanesco', name: 'TANESCO', code: 'TANESCO', country: 'Tanzania', flag: '🇹🇿' },
      // Nigeria
      { id: 'ekedc', name: 'EKEDC', code: 'EKEDC', country: 'Nigeria', flag: '🇳🇬' },
      { id: 'ikedc', name: 'IKEDC', code: 'IKEDC', country: 'Nigeria', flag: '🇳🇬' },
      // South Africa
      { id: 'eskom', name: 'Eskom', code: 'ESKOM', country: 'South Africa', flag: '🇿🇦' },
      // Ghana
      { id: 'ecg', name: 'ECG Ghana', code: 'ECG', country: 'Ghana', flag: '🇬🇭' },
    ]
  },
  {
    id: 'water',
    name: 'Water',
    icon: '💧',
    providers: [
      // Uganda
      { id: 'nwsc_ug', name: 'NWSC Uganda', code: 'NWSC_UG', country: 'Uganda', flag: '🇺🇬' },
      // Kenya
      { id: 'nairobi_water', name: 'Nairobi Water', code: 'NAIROBI_WATER', country: 'Kenya', flag: '🇰🇪' },
      // Tanzania
      { id: 'dawasco', name: 'DAWASCO', code: 'DAWASCO', country: 'Tanzania', flag: '🇹🇿' },
      // Nigeria
      { id: 'lagos_water', name: 'Lagos Water Corp', code: 'LAGOS_WATER', country: 'Nigeria', flag: '🇳🇬' },
      // South Africa
      { id: 'rand_water', name: 'Rand Water', code: 'RAND_WATER', country: 'South Africa', flag: '🇿🇦' },
    ]
  },
  {
    id: 'tv',
    name: 'TV & Cable',
    icon: '📺',
    providers: [
      // Africa-wide
      { id: 'dstv', name: 'DStv', code: 'DSTV', country: 'Africa', flag: '🌍' },
      { id: 'gotv', name: 'GOtv', code: 'GOTV', country: 'Africa', flag: '🌍' },
      { id: 'startimes', name: 'StarTimes', code: 'STARTIMES', country: 'Africa', flag: '🌍' },
      { id: 'azam', name: 'Azam TV', code: 'AZAM', country: 'East Africa', flag: '🌍' },
      // International
      { id: 'netflix', name: 'Netflix', code: 'NETFLIX', country: 'Global', flag: '🌐' },
      { id: 'showmax', name: 'Showmax', code: 'SHOWMAX', country: 'Africa', flag: '🌍' },
    ]
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: '🌐',
    providers: [
      // Uganda
      { id: 'smile_ug', name: 'Smile Uganda', code: 'SMILE_UG', country: 'Uganda', flag: '🇺🇬' },
      { id: 'roke', name: 'Roke Telkom', code: 'ROKE', country: 'Uganda', flag: '🇺🇬' },
      // Kenya
      { id: 'safaricom_home', name: 'Safaricom Home', code: 'SAFARICOM_HOME', country: 'Kenya', flag: '🇰🇪' },
      { id: 'zuku', name: 'Zuku', code: 'ZUKU', country: 'Kenya', flag: '🇰🇪' },
      // Nigeria
      { id: 'spectranet', name: 'Spectranet', code: 'SPECTRANET', country: 'Nigeria', flag: '🇳🇬' },
      { id: 'smile_ng', name: 'Smile Nigeria', code: 'SMILE_NG', country: 'Nigeria', flag: '🇳🇬' },
      // Africa-wide
      { id: 'liquid', name: 'Liquid Telecom', code: 'LIQUID', country: 'Africa', flag: '🌍' },
    ]
  },
  {
    id: 'government',
    name: 'Government',
    icon: '🏛️',
    providers: [
      // Uganda
      { id: 'ura', name: 'URA Taxes', code: 'URA', country: 'Uganda', flag: '🇺🇬' },
      { id: 'kcca', name: 'KCCA Payments', code: 'KCCA', country: 'Uganda', flag: '🇺🇬' },
      { id: 'nira', name: 'NIRA (National ID)', code: 'NIRA', country: 'Uganda', flag: '🇺🇬' },
      // Kenya
      { id: 'kra', name: 'KRA Taxes', code: 'KRA', country: 'Kenya', flag: '🇰🇪' },
      { id: 'ecitizen', name: 'eCitizen', code: 'ECITIZEN', country: 'Kenya', flag: '🇰🇪' },
      // Nigeria
      { id: 'firs', name: 'FIRS Taxes', code: 'FIRS', country: 'Nigeria', flag: '🇳🇬' },
      // South Africa
      { id: 'sars', name: 'SARS Taxes', code: 'SARS', country: 'South Africa', flag: '🇿🇦' },
    ]
  },
  {
    id: 'school',
    name: 'School Fees',
    icon: '🎓',
    providers: [
      { id: 'school', name: 'School Payment', code: 'SCHOOL', country: 'All', flag: '🌐' },
      { id: 'university', name: 'University Fees', code: 'UNIVERSITY', country: 'All', flag: '🌐' },
    ]
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    providers: [
      // Uganda
      { id: 'jubilee_ug', name: 'Jubilee Insurance', code: 'JUBILEE_UG', country: 'Uganda', flag: '🇺🇬' },
      { id: 'aar_ug', name: 'AAR Insurance', code: 'AAR_UG', country: 'Uganda', flag: '🇺🇬' },
      // Kenya
      { id: 'jubilee_ke', name: 'Jubilee Kenya', code: 'JUBILEE_KE', country: 'Kenya', flag: '🇰🇪' },
      { id: 'britam', name: 'Britam', code: 'BRITAM', country: 'Kenya', flag: '🇰🇪' },
      // Nigeria
      { id: 'leadway', name: 'Leadway Assurance', code: 'LEADWAY', country: 'Nigeria', flag: '🇳🇬' },
      // South Africa
      { id: 'discovery', name: 'Discovery', code: 'DISCOVERY', country: 'South Africa', flag: '🇿🇦' },
    ]
  },
];

export default function BillsScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{ name: string; balance?: number } | null>(null);

  const validateAccount = async () => {
    if (!accountNumber || accountNumber.length < 5) {
      Alert.alert('Error', 'Please enter a valid account/meter number');
      return;
    }

    setValidating(true);
    // Simulate validation
    setTimeout(() => {
      setValidating(false);
      setAccountInfo({
        name: 'John Doe',
        balance: selectedCategory?.id === 'electricity' ? 15000 : undefined
      });
    }, 1500);
  };

  const handlePayBill = async () => {
    if (!selectedProvider || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 500) {
      Alert.alert('Error', 'Minimum payment is 500 UGX');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ${parseInt(amount).toLocaleString()} UGX to:\n\n${selectedProvider.name}\nAccount: ${accountNumber}\n${accountInfo?.name || ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: executePayment }
      ]
    );
  };

  const executePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Bill payment successful!\n\nReference: BIL${Date.now()}`);
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedProvider(null);
    setAccountNumber('');
    setAmount('');
    setAccountInfo(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('bills.title')}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Category Selection */}
        {!selectedCategory && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Category</Text>
            <View style={styles.categoriesGrid}>
              {BILL_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, { backgroundColor: colors.card }]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Provider Selection */}
        {selectedCategory && !selectedProvider && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.breadcrumb}>
              <Text style={[styles.breadcrumbText, { color: colors.primary }]}>← {selectedCategory.name}</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Provider</Text>
            {selectedCategory.providers.map(provider => (
              <TouchableOpacity
                key={provider.id}
                style={[styles.providerCard, { backgroundColor: colors.card }]}
                onPress={() => setSelectedProvider(provider)}
              >
                <Text style={styles.providerIcon}>{selectedCategory.icon}</Text>
                <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                <Text style={[styles.providerArrow, { color: colors.primary }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payment Form */}
        {selectedProvider && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => { setSelectedProvider(null); setAccountInfo(null); }} style={styles.breadcrumb}>
              <Text style={[styles.breadcrumbText, { color: colors.primary }]}>← {selectedProvider.name}</Text>
            </TouchableOpacity>

            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <View style={[styles.providerHeader, { borderBottomColor: colors.border }]}>
                <Text style={styles.providerHeaderIcon}>{selectedCategory?.icon}</Text>
                <Text style={[styles.providerHeaderName, { color: colors.text }]}>{selectedProvider.name}</Text>
              </View>

              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedCategory?.id === 'electricity' ? 'Meter Number' : 
                   selectedCategory?.id === 'tv' ? 'Smart Card Number' :
                   selectedCategory?.id === 'ura' && selectedProvider?.code === 'URA_PRN' ? 'PRN (Payment Registration Number)' :
                   selectedCategory?.id === 'ura' && selectedProvider?.code === 'URA_TIN' ? 'TIN (Tax Identification Number)' :
                   selectedCategory?.id === 'ura' ? 'TIN / PRN' :
                   selectedCategory?.id === 'government' ? 'Reference Number' : 'Account Number'}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text }]}
                    value={accountNumber}
                    onChangeText={(text) => { setAccountNumber(text); setAccountInfo(null); }}
                    placeholder="Enter number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="default"
                  />
                  <TouchableOpacity 
                    style={styles.validateBtn} 
                    onPress={validateAccount}
                    disabled={validating}
                  >
                    {validating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.validateBtnText}>Validate</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Account Info */}
              {accountInfo && (
                <View style={styles.accountInfoBox}>
                  <Text style={styles.accountInfoLabel}>Account Holder</Text>
                  <Text style={styles.accountInfoName}>{accountInfo.name}</Text>
                  {accountInfo.balance !== undefined && (
                    <>
                      <Text style={styles.accountInfoLabel}>Outstanding Balance</Text>
                      <Text style={styles.accountInfoBalance}>{accountInfo.balance.toLocaleString()} UGX</Text>
                    </>
                  )}
                </View>
              )}

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (UGX)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmounts}>
                {[5000, 10000, 20000, 50000, 100000].map(amt => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickBtn, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text style={[styles.quickBtnText, { color: colors.textSecondary }]}>{amt >= 1000 ? `${amt/1000}K` : amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payBtn, (!accountInfo || !amount || loading) && styles.payBtnDisabled]}
                onPress={handlePayBill}
                disabled={!accountInfo || !amount || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payBtnText}>Pay Bill</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  breadcrumb: { marginBottom: 16 },
  breadcrumbText: { color: '#0066FF', fontSize: 14 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '30%', padding: 20, borderRadius: 16, alignItems: 'center' },
  categoryIcon: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 12, textAlign: 'center' },
  providerCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  providerIcon: { fontSize: 24, marginRight: 12 },
  providerName: { fontSize: 16, flex: 1 },
  providerArrow: { color: '#0066FF', fontSize: 18 },
  formCard: { padding: 16, borderRadius: 16 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  providerHeaderIcon: { fontSize: 28, marginRight: 12 },
  providerHeaderName: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#CCCCCC', fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { borderRadius: 10, padding: 14, fontSize: 16 },
  validateBtn: { backgroundColor: '#0066FF', paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  validateBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  accountInfoBox: { backgroundColor: '#064e3b', padding: 12, borderRadius: 10, marginBottom: 16 },
  accountInfoLabel: { color: '#6EE7B7', fontSize: 11, marginTop: 4 },
  accountInfoName: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  accountInfoBalance: { color: '#F59E0B', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  quickBtnText: { color: '#CCCCCC', fontSize: 13 },
  payBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
