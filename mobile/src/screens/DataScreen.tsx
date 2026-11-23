// GMG Uganda - Data Bundles Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// MTN Logo Component - matches official MTN branding
const MTNLogo = ({ size = 28 }: { size?: number }) => (
  <View style={{
    width: size,
    height: size,
    backgroundColor: '#FFC403',
    borderRadius: size / 4,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{
      color: '#000',
      fontSize: size * 0.4,
      fontFamily: 'Montserrat_700Bold',
      letterSpacing: -0.5,
    }}>MTN</Text>
  </View>
);

// Airtel Logo Component
const AirtelLogo = ({ size = 28 }: { size?: number }) => (
  <View style={{
    width: size,
    height: size,
    backgroundColor: '#ED1C24',
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{
      color: '#FFFFFF',
      fontSize: size * 0.35,
      fontFamily: 'Montserrat_700Bold',
    }}>A</Text>
  </View>
);

interface DataBundle {
  id: string;
  name: string;
  data: string;
  validity: string;
  price: number;
}

const DATA_BUNDLES: Record<string, DataBundle[]> = {
  MTN: [
    { id: 'mtn1', name: 'Daily', data: '100MB', validity: '24 Hours', price: 1000 },
    { id: 'mtn2', name: 'Weekly', data: '1GB', validity: '7 Days', price: 5000 },
    { id: 'mtn3', name: 'Monthly', data: '3GB', validity: '30 Days', price: 15000 },
    { id: 'mtn4', name: 'Monthly Plus', data: '10GB', validity: '30 Days', price: 35000 },
    { id: 'mtn5', name: 'Mega Bundle', data: '25GB', validity: '30 Days', price: 70000 },
  ],
  AIRTEL: [
    { id: 'air1', name: 'Daily Lite', data: '150MB', validity: '24 Hours', price: 1000 },
    { id: 'air2', name: 'Weekly', data: '1.5GB', validity: '7 Days', price: 5000 },
    { id: 'air3', name: 'Monthly', data: '4GB', validity: '30 Days', price: 15000 },
    { id: 'air4', name: 'Monthly Max', data: '12GB', validity: '30 Days', price: 35000 },
    { id: 'air5', name: 'Unlimited', data: '40GB', validity: '30 Days', price: 80000 },
  ],
};

export default function DataScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL'>('MTN');
  const [phone, setPhone] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!phone || phone.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (!selectedBundle) {
      Alert.alert('Error', 'Please select a data bundle');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${selectedBundle.data} (${selectedBundle.name}) for ${selectedBundle.price.toLocaleString()} UGX?\n\nPhone: ${phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: executePurchase }
      ]
    );
  };

  const executePurchase = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `${selectedBundle?.data} data bundle purchased successfully!`);
      setPhone('');
      setSelectedBundle(null);
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('data.title')}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Network Selection */}
        <View style={styles.networkRow}>
          <TouchableOpacity
            style={[styles.networkBtn, { backgroundColor: colors.card }, network === 'MTN' && styles.mtnActive]}
            onPress={() => { setNetwork('MTN'); setSelectedBundle(null); }}
          >
            <MTNLogo size={32} />
            <Text style={[styles.networkText, { color: colors.textSecondary }, network === 'MTN' && styles.networkTextActive]}>MTN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.networkBtn, { backgroundColor: colors.card }, network === 'AIRTEL' && styles.airtelActive]}
            onPress={() => { setNetwork('AIRTEL'); setSelectedBundle(null); }}
          >
            <AirtelLogo size={32} />
            <Text style={[styles.networkText, { color: colors.textSecondary }, network === 'AIRTEL' && styles.networkTextActive]}>Airtel</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="07XXXXXXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Data Bundles */}
        <View style={styles.bundlesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Bundle</Text>
          {DATA_BUNDLES[network].map(bundle => (
            <TouchableOpacity
              key={bundle.id}
              style={[styles.bundleCard, { backgroundColor: colors.card }, selectedBundle?.id === bundle.id && styles.bundleSelected]}
              onPress={() => setSelectedBundle(bundle)}
            >
              <View style={styles.bundleInfo}>
                <Text style={[styles.bundleData, { color: colors.text }]}>{bundle.data}</Text>
                <Text style={[styles.bundleName, { color: colors.textSecondary }]}>{bundle.name}</Text>
                <Text style={[styles.bundleValidity, { color: colors.textMuted }]}>Valid: {bundle.validity}</Text>
              </View>
              <View style={styles.bundlePriceBox}>
                <Text style={styles.bundlePrice}>{bundle.price.toLocaleString()}</Text>
                <Text style={[styles.bundleCurrency, { color: colors.textMuted }]}>UGX</Text>
              </View>
              {selectedBundle?.id === bundle.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, (!selectedBundle || loading) && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={!selectedBundle || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              Buy Data {selectedBundle ? `- ${selectedBundle.price.toLocaleString()} UGX` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  networkRow: { flexDirection: 'row', padding: 16, gap: 12 },
  networkBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  mtnActive: { borderColor: '#FBBF24', backgroundColor: '#422006' },
  airtelActive: { borderColor: '#EF4444', backgroundColor: '#450a0a' },
  networkText: { color: '#CCCCCC', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginTop: 8 },
  networkTextActive: { color: '#FFFFFF' },
  inputCard: { margin: 16, padding: 16, borderRadius: 12 },
  inputLabel: { color: '#CCCCCC', fontSize: 13, marginBottom: 8 },
  input: { borderRadius: 10, padding: 14, fontSize: 18 },
  bundlesSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  bundleCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  bundleSelected: { borderColor: '#0066FF', backgroundColor: '#1e1b4b' },
  bundleInfo: { flex: 1 },
  bundleData: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  bundleName: { color: '#CCCCCC', fontSize: 14, marginTop: 2 },
  bundleValidity: { color: '#AAAAAA', fontSize: 12, marginTop: 4 },
  bundlePriceBox: { alignItems: 'flex-end' },
  bundlePrice: { color: '#10B981', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  bundleCurrency: { color: '#AAAAAA', fontSize: 12 },
  checkmark: { position: 'absolute', top: 8, right: 8, backgroundColor: '#0066FF', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { color: '#FFFFFF', fontFamily: 'Montserrat_700Bold' },
  purchaseBtn: { backgroundColor: '#0066FF', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  purchaseBtnDisabled: { opacity: 0.5 },
  purchaseBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
