// GMG Uganda - Insurance Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

interface InsuranceProduct {
  id: string;
  name: string;
  icon: string;
  premium: number;
  coverage: number;
  period: string;
  features: string[];
}

const insuranceProducts: InsuranceProduct[] = [
  { id: 'health', name: 'Health Insurance', icon: '🏥', premium: 50000, coverage: 5000000, period: 'month', features: ['Hospital cover', 'Outpatient', 'Dental'] },
  { id: 'life', name: 'Life Insurance', icon: '❤️', premium: 30000, coverage: 10000000, period: 'month', features: ['Death benefit', 'Critical illness', 'Disability'] },
  { id: 'motor', name: 'Motor Insurance', icon: '🚗', premium: 100000, coverage: 20000000, period: 'year', features: ['Third party', 'Theft', 'Accident'] },
  { id: 'home', name: 'Home Insurance', icon: '🏠', premium: 25000, coverage: 15000000, period: 'month', features: ['Fire', 'Theft', 'Natural disasters'] },
  { id: 'travel', name: 'Travel Insurance', icon: '✈️', premium: 75000, coverage: 50000000, period: 'trip', features: ['Medical emergency', 'Lost luggage', 'Trip cancellation'] },
];

export default function InsuranceScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);

  const handlePurchase = (product: InsuranceProduct) => {
    Alert.alert(
      'Purchase Insurance',
      `Subscribe to ${product.name} for ${formatCurrency(product.premium)}/${product.period}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: () => Alert.alert('Success', 'Insurance purchased successfully!') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('insurance.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Active Policies */}
        <View style={styles.activePolicies}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Policies</Text>
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No active policies</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Get protected today</Text>
          </View>
        </View>

        {/* Insurance Products */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Products</Text>
        {insuranceProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, { backgroundColor: colors.card }]}
            onPress={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
          >
            <View style={styles.productHeader}>
              <Text style={styles.productIcon}>{product.icon}</Text>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                <Text style={[styles.productPremium, { color: colors.success }]}>{formatCurrency(product.premium)}/{product.period}</Text>
              </View>
              <Text style={[styles.arrow, { color: colors.primary }]}>{selectedProduct?.id === product.id ? '↓' : '→'}</Text>
            </View>
            
            {selectedProduct?.id === product.id && (
              <View style={[styles.productDetails, { borderTopColor: colors.border }]}>
                <View style={styles.coverageRow}>
                  <Text style={[styles.coverageLabel, { color: colors.textSecondary }]}>Coverage up to</Text>
                  <Text style={[styles.coverageValue, { color: colors.text }]}>{formatCurrency(product.coverage)}</Text>
                </View>
                <View style={styles.features}>
                  {product.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={[styles.featureCheck, { color: colors.success }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.purchaseBtn} onPress={() => handlePurchase(product)}>
                  <Text style={styles.purchaseBtnText}>Get Covered</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>All insurance products are underwritten by licensed insurance partners in Uganda.</Text>
        </View>
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
  activePolicies: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 30, borderRadius: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  emptySubtext: { color: '#CCCCCC', fontSize: 12 },
  productCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  productHeader: { flexDirection: 'row', alignItems: 'center' },
  productIcon: { fontSize: 36, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  productPremium: { color: '#10b981', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  arrow: { color: '#0066FF', fontSize: 20 },
  productDetails: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 16 },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  coverageLabel: { color: '#CCCCCC', fontSize: 14 },
  coverageValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  features: { marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureCheck: { color: '#10b981', fontSize: 16, marginRight: 8 },
  featureText: { fontSize: 14 },
  purchaseBtn: { backgroundColor: '#0066FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  purchaseBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  infoCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginTop: 16 },
  infoIcon: { fontSize: 20, marginRight: 12 },
  infoText: { color: '#CCCCCC', fontSize: 12, flex: 1 },
});
