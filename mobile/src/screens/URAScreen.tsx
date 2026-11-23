// GMG Global - URA Tax Payment Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useTheme } from '../context/ThemeContext';

// URA Logo
const uraLogo = require('../../assets/URA.png');

interface TaxType {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
}

const TAX_TYPES: TaxType[] = [
  { id: 'prn', name: 'Pay with PRN', code: 'PRN', icon: '📋', description: 'Pay using Payment Registration Number' },
  { id: 'vat', name: 'VAT', code: 'VAT', icon: '🧾', description: 'Value Added Tax' },
  { id: 'paye', name: 'PAYE', code: 'PAYE', icon: '👔', description: 'Pay As You Earn' },
  { id: 'income', name: 'Income Tax', code: 'INCOME', icon: '💰', description: 'Individual/Corporate Income Tax' },
  { id: 'wht', name: 'Withholding Tax', code: 'WHT', icon: '✂️', description: 'Withholding Tax' },
  { id: 'excise', name: 'Excise Duty', code: 'EXCISE', icon: '🏭', description: 'Excise Duty on goods' },
  { id: 'stamp', name: 'Stamp Duty', code: 'STAMP', icon: '📜', description: 'Stamp Duty' },
  { id: 'rental', name: 'Rental Tax', code: 'RENTAL', icon: '🏠', description: 'Rental Income Tax' },
];

// International Tax Rates by Country
interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

interface CountryTax {
  name: string;
  flag: string;
  currency: string;
  vatRate: number;
  incomeTaxBrackets: TaxBracket[];
  corporateTax: number;
  withholdingTax: number;
}

const COUNTRY_TAX_RATES: { [key: string]: CountryTax } = {
  UG: {
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    vatRate: 18,
    incomeTaxBrackets: [
      { min: 0, max: 2820000, rate: 0 },
      { min: 2820001, max: 4020000, rate: 10 },
      { min: 4020001, max: 4920000, rate: 20 },
      { min: 4920001, max: 120000000, rate: 30 },
      { min: 120000001, max: Infinity, rate: 40 },
    ],
    corporateTax: 30,
    withholdingTax: 15,
  },
  KE: {
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    vatRate: 16,
    incomeTaxBrackets: [
      { min: 0, max: 288000, rate: 10 },
      { min: 288001, max: 388000, rate: 25 },
      { min: 388001, max: Infinity, rate: 30 },
    ],
    corporateTax: 30,
    withholdingTax: 15,
  },
  TZ: {
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    vatRate: 18,
    incomeTaxBrackets: [
      { min: 0, max: 270000, rate: 0 },
      { min: 270001, max: 520000, rate: 8 },
      { min: 520001, max: 760000, rate: 20 },
      { min: 760001, max: 1000000, rate: 25 },
      { min: 1000001, max: Infinity, rate: 30 },
    ],
    corporateTax: 30,
    withholdingTax: 10,
  },
  NG: {
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    vatRate: 7.5,
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 7 },
      { min: 300001, max: 600000, rate: 11 },
      { min: 600001, max: 1100000, rate: 15 },
      { min: 1100001, max: 1600000, rate: 19 },
      { min: 1600001, max: 3200000, rate: 21 },
      { min: 3200001, max: Infinity, rate: 24 },
    ],
    corporateTax: 30,
    withholdingTax: 10,
  },
  GH: {
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    vatRate: 15,
    incomeTaxBrackets: [
      { min: 0, max: 4824, rate: 0 },
      { min: 4825, max: 6000, rate: 5 },
      { min: 6001, max: 8400, rate: 10 },
      { min: 8401, max: 48000, rate: 17.5 },
      { min: 48001, max: 600000, rate: 25 },
      { min: 600001, max: Infinity, rate: 30 },
    ],
    corporateTax: 25,
    withholdingTax: 8,
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    vatRate: 18,
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300001, max: 600000, rate: 5 },
      { min: 600001, max: 900000, rate: 10 },
      { min: 900001, max: 1200000, rate: 15 },
      { min: 1200001, max: 1500000, rate: 20 },
      { min: 1500001, max: Infinity, rate: 30 },
    ],
    corporateTax: 25,
    withholdingTax: 10,
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    vatRate: 0,
    incomeTaxBrackets: [
      { min: 0, max: 11000, rate: 10 },
      { min: 11001, max: 44725, rate: 12 },
      { min: 44726, max: 95375, rate: 22 },
      { min: 95376, max: 182100, rate: 24 },
      { min: 182101, max: 231250, rate: 32 },
      { min: 231251, max: 578125, rate: 35 },
      { min: 578126, max: Infinity, rate: 37 },
    ],
    corporateTax: 21,
    withholdingTax: 30,
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    vatRate: 20,
    incomeTaxBrackets: [
      { min: 0, max: 12570, rate: 0 },
      { min: 12571, max: 50270, rate: 20 },
      { min: 50271, max: 125140, rate: 40 },
      { min: 125141, max: Infinity, rate: 45 },
    ],
    corporateTax: 25,
    withholdingTax: 20,
  },
};

export default function URAScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { startTour, hasCompletedTour } = useOnboarding();
  
  const [selectedTax, setSelectedTax] = useState<TaxType | null>(null);

  // Start tour for first-time users
  React.useEffect(() => {
    if (!hasCompletedTour('URA')) {
      setTimeout(() => startTour('URA'), 500);
    }
  }, [hasCompletedTour, startTour]);
  const [prn, setPrn] = useState('');
  const [tin, setTin] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [taxInfo, setTaxInfo] = useState<{
    taxpayerName: string;
    taxType: string;
    assessmentAmount: number;
    dueDate: string;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcCountry, setCalcCountry] = useState('UG');
  const [calcType, setCalcType] = useState<'income' | 'vat' | 'corporate' | 'withholding'>('income');
  const [calcAmount, setCalcAmount] = useState('');
  const [calcResult, setCalcResult] = useState<{ tax: number; effective: number } | null>(null);

  // Calculate tax based on country and type
  const calculateTax = () => {
    const amount = parseFloat(calcAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const country = COUNTRY_TAX_RATES[calcCountry];
    let tax = 0;
    
    switch (calcType) {
      case 'income':
        // Progressive tax calculation
        let remaining = amount;
        for (const bracket of country.incomeTaxBrackets) {
          if (remaining <= 0) break;
          const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
          if (amount > bracket.min) {
            tax += taxableInBracket * (bracket.rate / 100);
            remaining -= taxableInBracket;
          }
        }
        break;
      case 'vat':
        tax = amount * (country.vatRate / 100);
        break;
      case 'corporate':
        tax = amount * (country.corporateTax / 100);
        break;
      case 'withholding':
        tax = amount * (country.withholdingTax / 100);
        break;
    }

    const effective = (tax / amount) * 100;
    setCalcResult({ tax, effective });
  };

  const validatePRN = async () => {
    if (!prn || prn.length < 10) {
      Alert.alert('Error', 'Please enter a valid PRN (minimum 10 characters)');
      return;
    }

    setValidating(true);
    // Simulate URA API validation
    setTimeout(() => {
      setValidating(false);
      setTaxInfo({
        taxpayerName: 'SSENKULA ROGER',
        taxType: selectedTax?.name || 'Tax Payment',
        assessmentAmount: 1500000,
        dueDate: '2025-01-15',
      });
      setAmount('1500000');
    }, 2000);
  };

  const handlePayTax = async () => {
    if (!taxInfo || !amount) {
      Alert.alert('Error', 'Please validate your PRN first');
      return;
    }

    Alert.alert(
      'Confirm URA Payment',
      `Pay UGX ${parseInt(amount).toLocaleString()} to:\n\nUganda Revenue Authority\nPRN: ${prn}\nTaxpayer: ${taxInfo.taxpayerName}\nTax Type: ${taxInfo.taxType}`,
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
      Alert.alert(
        '✅ Payment Successful',
        `URA Tax Payment Completed!\n\nReceipt: URA${Date.now()}\nAmount: UGX ${parseInt(amount).toLocaleString()}\nPRN: ${prn}\n\nYou will receive an SMS confirmation from URA.`,
        [{ text: 'Done', onPress: resetForm }]
      );
    }, 3000);
  };

  const resetForm = () => {
    setSelectedTax(null);
    setPrn('');
    setTin('');
    setAmount('');
    setTaxInfo(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Image source={uraLogo} style={styles.uraLogoImage} resizeMode="contain" />
            <View>
              <Text style={styles.headerTitle}>{t('ura.title')}</Text>
              <Text style={styles.headerSubtitle}>Uganda Revenue Authority</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => setShowHistory(true)}>
            <Text style={styles.quickActionIcon}>📜</Text>
            <Text style={[styles.quickActionText, { color: colors.text }]}>Payment History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => setShowCalculator(true)}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={[styles.quickActionText, { color: colors.text }]}>Tax Calculator</Text>
          </TouchableOpacity>
        </View>

        {/* Tax Type Selection */}
        {!selectedTax && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Tax Type</Text>
            <View style={styles.taxGrid}>
              {TAX_TYPES.map(tax => (
                <TouchableOpacity
                  key={tax.id}
                  style={[styles.taxCard, { backgroundColor: colors.card }]}
                  onPress={() => setSelectedTax(tax)}
                >
                  <Text style={styles.taxIcon}>{tax.icon}</Text>
                  <Text style={[styles.taxName, { color: colors.text }]}>{tax.name}</Text>
                  <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>{tax.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Payment Form */}
        {selectedTax && (
          <View style={styles.section}>
            <TouchableOpacity onPress={resetForm} style={styles.breadcrumb}>
              <Text style={[styles.breadcrumbText, { color: colors.primary }]}>← Back to Tax Types</Text>
            </TouchableOpacity>

            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <View style={[styles.taxHeader, { borderBottomColor: colors.border }]}>
                <Text style={styles.taxHeaderIcon}>{selectedTax.icon}</Text>
                <View>
                  <Text style={[styles.taxHeaderName, { color: colors.text }]}>{selectedTax.name}</Text>
                  <Text style={[styles.taxHeaderDesc, { color: colors.textSecondary }]}>{selectedTax.description}</Text>
                </View>
              </View>

              {/* PRN Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>PRN (Payment Registration Number)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text }]}
                    value={prn}
                    onChangeText={(text) => { setPrn(text.toUpperCase()); setTaxInfo(null); }}
                    placeholder="Enter PRN from URA"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                  <TouchableOpacity 
                    style={styles.validateBtn} 
                    onPress={validatePRN}
                    disabled={validating}
                  >
                    {validating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.validateBtnText}>Validate</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.inputHint, { color: colors.textMuted }]}>Get your PRN from URA eTax portal or USSD *285#</Text>
              </View>

              {/* TIN Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>TIN (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={tin}
                  onChangeText={setTin}
                  placeholder="Tax Identification Number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              {/* Tax Info Display */}
              {taxInfo && (
                <View style={styles.taxInfoBox}>
                  <View style={styles.taxInfoHeader}>
                    <Text style={styles.taxInfoIcon}>✅</Text>
                    <Text style={styles.taxInfoTitle}>PRN Validated</Text>
                  </View>
                  <View style={styles.taxInfoRow}>
                    <Text style={styles.taxInfoLabel}>Taxpayer:</Text>
                    <Text style={styles.taxInfoValue}>{taxInfo.taxpayerName}</Text>
                  </View>
                  <View style={styles.taxInfoRow}>
                    <Text style={styles.taxInfoLabel}>Tax Type:</Text>
                    <Text style={styles.taxInfoValue}>{taxInfo.taxType}</Text>
                  </View>
                  <View style={styles.taxInfoRow}>
                    <Text style={styles.taxInfoLabel}>Amount Due:</Text>
                    <Text style={styles.taxInfoAmount}>UGX {taxInfo.assessmentAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.taxInfoRow}>
                    <Text style={styles.taxInfoLabel}>Due Date:</Text>
                    <Text style={styles.taxInfoValue}>{taxInfo.dueDate}</Text>
                  </View>
                </View>
              )}

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Amount to Pay (UGX)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payBtn, (!taxInfo || !amount || loading) && styles.payBtnDisabled]}
                onPress={handlePayTax}
                disabled={!taxInfo || !amount || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payBtnText}>Pay URA Tax</Text>
                )}
              </TouchableOpacity>

              {/* Info Note */}
              <View style={styles.infoNote}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Payments are processed instantly. You'll receive an SMS receipt from URA.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* URA Info */}
        <View style={[styles.uraInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.uraInfoTitle, { color: colors.text }]}>Need Help?</Text>
          <Text style={[styles.uraInfoText, { color: colors.textSecondary }]}>• URA Call Center: 0800 117 000</Text>
          <Text style={[styles.uraInfoText, { color: colors.textSecondary }]}>• USSD: *285#</Text>
          <Text style={[styles.uraInfoText, { color: colors.textSecondary }]}>• Website: ura.go.ug</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Payment History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>URA Payment History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No URA payments yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Your tax payment history will appear here</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tax Calculator Modal */}
      <Modal visible={showCalculator} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.calcModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>🌍 International Tax Calculator</Text>
              <TouchableOpacity onPress={() => { setShowCalculator(false); setCalcResult(null); setCalcAmount(''); }}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Country Selection */}
              <Text style={[styles.calcLabel, { color: colors.text }]}>Select Country</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                {Object.entries(COUNTRY_TAX_RATES).map(([code, country]) => (
                  <TouchableOpacity
                    key={code}
                    style={[styles.countryChip, calcCountry === code && styles.countryChipActive]}
                    onPress={() => { setCalcCountry(code); setCalcResult(null); }}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={[styles.countryName, calcCountry === code && styles.countryNameActive]}>{country.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tax Type Selection */}
              <Text style={[styles.calcLabel, { color: colors.text }]}>Tax Type</Text>
              <View style={styles.taxTypeGrid}>
                <TouchableOpacity
                  style={[styles.taxTypeBtn, calcType === 'income' && styles.taxTypeBtnActive]}
                  onPress={() => { setCalcType('income'); setCalcResult(null); }}
                >
                  <Text style={styles.taxTypeIcon}>💰</Text>
                  <Text style={[styles.taxTypeText, calcType === 'income' && styles.taxTypeTextActive]}>Income Tax</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taxTypeBtn, calcType === 'vat' && styles.taxTypeBtnActive]}
                  onPress={() => { setCalcType('vat'); setCalcResult(null); }}
                >
                  <Text style={styles.taxTypeIcon}>🧾</Text>
                  <Text style={[styles.taxTypeText, calcType === 'vat' && styles.taxTypeTextActive]}>VAT ({COUNTRY_TAX_RATES[calcCountry].vatRate}%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taxTypeBtn, calcType === 'corporate' && styles.taxTypeBtnActive]}
                  onPress={() => { setCalcType('corporate'); setCalcResult(null); }}
                >
                  <Text style={styles.taxTypeIcon}>🏢</Text>
                  <Text style={[styles.taxTypeText, calcType === 'corporate' && styles.taxTypeTextActive]}>Corporate ({COUNTRY_TAX_RATES[calcCountry].corporateTax}%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taxTypeBtn, calcType === 'withholding' && styles.taxTypeBtnActive]}
                  onPress={() => { setCalcType('withholding'); setCalcResult(null); }}
                >
                  <Text style={styles.taxTypeIcon}>✂️</Text>
                  <Text style={[styles.taxTypeText, calcType === 'withholding' && styles.taxTypeTextActive]}>WHT ({COUNTRY_TAX_RATES[calcCountry].withholdingTax}%)</Text>
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
              <Text style={[styles.calcLabel, { color: colors.text }]}>Amount ({COUNTRY_TAX_RATES[calcCountry].currency})</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={calcAmount}
                onChangeText={(text) => { setCalcAmount(text); setCalcResult(null); }}
                placeholder="Enter amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />

              {/* Calculate Button */}
              <TouchableOpacity style={styles.calcBtn} onPress={calculateTax}>
                <Text style={styles.calcBtnText}>Calculate Tax</Text>
              </TouchableOpacity>

              {/* Result */}
              {calcResult && (
                <View style={styles.calcResultBox}>
                  <View style={styles.calcResultHeader}>
                    <Text style={styles.calcResultFlag}>{COUNTRY_TAX_RATES[calcCountry].flag}</Text>
                    <Text style={styles.calcResultTitle}>{COUNTRY_TAX_RATES[calcCountry].name} Tax Result</Text>
                  </View>
                  <View style={styles.calcResultRow}>
                    <Text style={styles.calcResultLabel}>Gross Amount:</Text>
                    <Text style={styles.calcResultValue}>{COUNTRY_TAX_RATES[calcCountry].currency} {parseFloat(calcAmount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.calcResultRow}>
                    <Text style={styles.calcResultLabel}>Tax Amount:</Text>
                    <Text style={styles.calcResultTax}>{COUNTRY_TAX_RATES[calcCountry].currency} {calcResult.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                  </View>
                  <View style={styles.calcResultRow}>
                    <Text style={styles.calcResultLabel}>Effective Rate:</Text>
                    <Text style={styles.calcResultRate}>{calcResult.effective.toFixed(2)}%</Text>
                  </View>
                  <View style={styles.calcResultRow}>
                    <Text style={styles.calcResultLabel}>Net Amount:</Text>
                    <Text style={styles.calcResultNet}>{COUNTRY_TAX_RATES[calcCountry].currency} {(parseFloat(calcAmount) - calcResult.tax).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                  </View>
                </View>
              )}

              {/* Tax Brackets Info */}
              {calcType === 'income' && (
                <View style={styles.bracketsInfo}>
                  <Text style={[styles.bracketsTitle, { color: colors.text }]}>📊 {COUNTRY_TAX_RATES[calcCountry].name} Income Tax Brackets</Text>
                  {COUNTRY_TAX_RATES[calcCountry].incomeTaxBrackets.map((bracket, index) => (
                    <View key={index} style={styles.bracketRow}>
                      <Text style={[styles.bracketRange, { color: colors.textSecondary }]}>
                        {bracket.min.toLocaleString()} - {bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()}
                      </Text>
                      <Text style={styles.bracketRate}>{bracket.rate}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { backgroundColor: '#1e3a5f', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  uraLogoImage: { width: 60, height: 60, borderRadius: 12 },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  
  quickActions: { flexDirection: 'row', padding: 16, gap: 12 },
  quickAction: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  quickActionIcon: { fontSize: 24, marginBottom: 6 },
  quickActionText: { fontSize: 12, fontFamily: 'Montserrat_500Medium' },
  
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  breadcrumb: { marginBottom: 16 },
  breadcrumbText: { color: '#0066FF', fontSize: 14 },
  
  taxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  taxCard: { width: '47%', padding: 16, borderRadius: 16 },
  taxIcon: { fontSize: 28, marginBottom: 8 },
  taxName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  taxDesc: { color: '#888', fontSize: 11 },
  
  formCard: { padding: 20, borderRadius: 20 },
  taxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  taxHeaderIcon: { fontSize: 36, marginRight: 14 },
  taxHeaderName: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  taxHeaderDesc: { color: '#888', fontSize: 13, marginTop: 2 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontFamily: 'Montserrat_500Medium', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, fontSize: 16 },
  inputHint: { color: '#666', fontSize: 12, marginTop: 6 },
  validateBtn: { backgroundColor: '#0066FF', paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  validateBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  
  taxInfoBox: { backgroundColor: '#064e3b', borderRadius: 12, padding: 16, marginBottom: 16 },
  taxInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taxInfoIcon: { fontSize: 18, marginRight: 8 },
  taxInfoTitle: { color: '#10b981', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  taxInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  taxInfoLabel: { color: '#6ee7b7', fontSize: 13 },
  taxInfoValue: { fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  taxInfoAmount: { color: '#fbbf24', fontSize: 15, fontFamily: 'Montserrat_700Bold' },
  
  payBtn: { backgroundColor: '#1e3a5f', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  
  infoNote: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  infoIcon: { fontSize: 14, marginRight: 8 },
  infoText: { flex: 1, color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  
  uraInfo: { margin: 16, borderRadius: 12, padding: 16 },
  uraInfoTitle: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 10 },
  uraInfoText: { color: '#888', fontSize: 13, marginBottom: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  modalClose: { color: '#888', fontSize: 24 },
  emptyHistory: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  emptySubtext: { color: '#888', fontSize: 13, marginTop: 4 },
  
  // Tax Calculator Styles
  calcModalContent: { maxHeight: '90%' },
  calcLabel: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 10, marginTop: 16 },
  countryScroll: { marginBottom: 8 },
  countryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a3e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  countryChipActive: { backgroundColor: '#0066FF' },
  countryFlag: { fontSize: 20, marginRight: 6 },
  countryName: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  countryNameActive: { color: '#fff' },
  taxTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  taxTypeBtn: { width: '48%', backgroundColor: '#2a2a3e', padding: 14, borderRadius: 12, alignItems: 'center' },
  taxTypeBtnActive: { backgroundColor: '#0066FF' },
  taxTypeIcon: { fontSize: 24, marginBottom: 6 },
  taxTypeText: { color: '#9CA3AF', fontSize: 11, fontFamily: 'Montserrat_500Medium', textAlign: 'center' },
  taxTypeTextActive: { color: '#fff' },
  calcInput: { backgroundColor: '#2a2a3e', borderRadius: 12, padding: 16, fontSize: 18, color: '#fff', marginBottom: 16 },
  calcBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  calcBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  calcResultBox: { backgroundColor: '#064e3b', borderRadius: 16, padding: 18, marginTop: 20 },
  calcResultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  calcResultFlag: { fontSize: 28, marginRight: 10 },
  calcResultTitle: { color: '#10b981', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  calcResultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  calcResultLabel: { color: '#6ee7b7', fontSize: 14 },
  calcResultValue: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  calcResultTax: { color: '#fbbf24', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  calcResultRate: { color: '#60a5fa', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  calcResultNet: { color: '#10b981', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  bracketsInfo: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 },
  bracketsTitle: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  bracketRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  bracketRange: { color: '#94a3b8', fontSize: 12 },
  bracketRate: { color: '#0066FF', fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
});
