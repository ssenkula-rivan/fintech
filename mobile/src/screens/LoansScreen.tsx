// GMG Uganda - Loans Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

interface LoanProduct {
  id: string;
  name: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  duration: string;
  description: string;
}

const loanProducts: LoanProduct[] = [
  { id: 'instant', name: 'Instant Loan', icon: '⚡', minAmount: 50000, maxAmount: 500000, interestRate: 15, duration: '7-30 days', description: 'Quick cash for emergencies' },
  { id: 'salary', name: 'Salary Advance', icon: '💼', minAmount: 100000, maxAmount: 2000000, interestRate: 10, duration: '30 days', description: 'Advance on your salary' },
  { id: 'business', name: 'Business Loan', icon: '🏢', minAmount: 500000, maxAmount: 10000000, interestRate: 18, duration: '3-12 months', description: 'Grow your business' },
  { id: 'education', name: 'Education Loan', icon: '📚', minAmount: 200000, maxAmount: 5000000, interestRate: 12, duration: '6-24 months', description: 'Invest in education' },
];

export default function LoansScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'products' | 'apply'>('products');

  const eligibleAmount = 500000; // Mock eligible amount based on user profile

  const handleApply = () => {
    if (!amount || parseFloat(amount) < (selectedProduct?.minAmount || 0)) {
      Alert.alert('Error', `Minimum amount is ${formatCurrency(selectedProduct?.minAmount || 0)}`);
      return;
    }
    if (parseFloat(amount) > (selectedProduct?.maxAmount || 0)) {
      Alert.alert('Error', `Maximum amount is ${formatCurrency(selectedProduct?.maxAmount || 0)}`);
      return;
    }
    Alert.alert(
      'Loan Application',
      `Your application for ${formatCurrency(parseFloat(amount))} ${selectedProduct?.name} has been submitted. We'll review and notify you within 24 hours.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const renderProducts = () => (
    <>
      {/* Eligibility Card */}
      <View style={styles.eligibilityCard}>
        <View style={styles.eligibilityHeader}>
          <Text style={styles.eligibilityIcon}>✅</Text>
          <View>
            <Text style={styles.eligibilityTitle}>You're Pre-Approved!</Text>
            <Text style={styles.eligibilitySubtitle}>Based on your account activity</Text>
          </View>
        </View>
        <Text style={styles.eligibleAmount}>Up to {formatCurrency(eligibleAmount)}</Text>
      </View>

      {/* Loan Products */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Loan Products</Text>
      {loanProducts.map((product) => (
        <TouchableOpacity
          key={product.id}
          style={[styles.productCard, { backgroundColor: colors.card }]}
          onPress={() => { setSelectedProduct(product); setStep('apply'); }}
        >
          <View style={styles.productHeader}>
            <Text style={styles.productIcon}>{product.icon}</Text>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.productDesc, { color: colors.textSecondary }]}>{product.description}</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
          </View>
          <View style={[styles.productDetails, { borderTopColor: colors.border }]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Interest</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{product.interestRate}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{product.duration}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Active Loans */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Active Loans</Text>
      <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={[styles.emptyText, { color: colors.text }]}>No active loans</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Apply for a loan above to get started</Text>
      </View>
    </>
  );

  const renderApplyForm = () => (
    <>
      <TouchableOpacity style={styles.backToProducts} onPress={() => setStep('products')}>
        <Text style={[styles.backToProductsText, { color: colors.primary }]}>← Back to Products</Text>
      </TouchableOpacity>

      <View style={[styles.selectedProductCard, { backgroundColor: colors.card }]}>
        <Text style={styles.selectedIcon}>{selectedProduct?.icon}</Text>
        <Text style={[styles.selectedName, { color: colors.text }]}>{selectedProduct?.name}</Text>
        <Text style={[styles.selectedRate, { color: colors.textSecondary }]}>{selectedProduct?.interestRate}% interest • {selectedProduct?.duration}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Loan Amount</Text>
        <View style={[styles.amountInputContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.currency, { color: colors.primary }]}>UGX</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Min: {formatCurrency(selectedProduct?.minAmount || 0)} • Max: {formatCurrency(selectedProduct?.maxAmount || 0)}
        </Text>
      </View>

      {amount && parseFloat(amount) > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Loan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Principal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(parseFloat(amount))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Interest ({selectedProduct?.interestRate}%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(parseFloat(amount) * (selectedProduct?.interestRate || 0) / 100)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Repayment</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>{formatCurrency(parseFloat(amount) * (1 + (selectedProduct?.interestRate || 0) / 100))}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
        <Text style={styles.applyBtnText}>Apply for Loan</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('loans.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {step === 'products' ? renderProducts() : renderApplyForm()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  content: { flex: 1, padding: 16 },
  eligibilityCard: { backgroundColor: '#10b981', borderRadius: 16, padding: 20, marginBottom: 24 },
  eligibilityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eligibilityIcon: { fontSize: 32, marginRight: 12 },
  eligibilityTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  eligibilitySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  eligibleAmount: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Montserrat_700Bold' },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  productCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productIcon: { fontSize: 32, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  productDesc: { color: '#CCCCCC', fontSize: 12 },
  arrow: { color: '#0066FF', fontSize: 20 },
  productDetails: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12 },
  detailItem: { alignItems: 'center' },
  detailLabel: { color: '#CCCCCC', fontSize: 10 },
  detailValue: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  emptySubtext: { color: '#CCCCCC', fontSize: 12 },
  backToProducts: { marginBottom: 16 },
  backToProductsText: { color: '#0066FF', fontSize: 14 },
  selectedProductCard: { alignItems: 'center', borderRadius: 16, padding: 24, marginBottom: 24 },
  selectedIcon: { fontSize: 48, marginBottom: 8 },
  selectedName: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  selectedRate: { color: '#CCCCCC', fontSize: 14 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#CCCCCC', fontSize: 14, marginBottom: 8 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
  currency: { color: '#0066FF', fontSize: 24, fontFamily: 'Montserrat_700Bold', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontFamily: 'Montserrat_700Bold' },
  hint: { color: '#CCCCCC', fontSize: 12, marginTop: 8 },
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 24 },
  summaryTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#CCCCCC', fontSize: 14 },
  summaryValue: { fontSize: 14 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  totalValue: { color: '#10b981', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  applyBtn: { backgroundColor: '#0066FF', borderRadius: 16, padding: 18, alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
});
