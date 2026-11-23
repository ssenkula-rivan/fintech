// GMG Global - Request Money Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

export default function RequestMoneyScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [requestLink, setRequestLink] = useState('');

  const generateRequestLink = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const link = `gmg://pay/${user?.phone}?amount=${amount}&note=${encodeURIComponent(note)}`;
    setRequestLink(link);
  };

  const shareRequest = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount first');
      return;
    }
    try {
      await Share.share({
        message: `${user?.firstName} is requesting ${formatCurrency(parseFloat(amount))} via GMG Global.\n\nNote: ${note || 'Payment request'}\n\nPay now: gmg://pay/${user?.phone}?amount=${amount}`,
        title: 'GMG Global Payment Request',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share request');
    }
  };

  const quickAmounts = [10000, 50000, 100000, 500000];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('requestMoney.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('requestMoney.amountToRequest')}</Text>
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
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, { backgroundColor: colors.card }, amount === amt.toString() && styles.quickBtnActive]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={[styles.quickBtnText, { color: colors.textSecondary }, amount === amt.toString() && styles.quickBtnTextActive]}>
                {formatCurrency(amt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('requestMoney.noteOptional')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={note}
            onChangeText={setNote}
            placeholder={t('requestMoney.whatsThisFor')}
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        {/* Request Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>{t('requestMoney.yourPhoneNumber')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.phone}</Text>
          </View>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('requestMoney.shareVia')}</Text>
          <View style={styles.shareOptions}>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.card }]} onPress={shareRequest}>
              <Text style={styles.shareIcon}>💬</Text>
              <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.card }]} onPress={shareRequest}>
              <Text style={styles.shareIcon}>📱</Text>
              <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.card }]} onPress={shareRequest}>
              <Text style={styles.shareIcon}>📧</Text>
              <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareOption, { backgroundColor: colors.card }]} onPress={shareRequest}>
              <Text style={styles.shareIcon}>📋</Text>
              <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate QR */}
        <TouchableOpacity 
          style={[styles.qrButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('QRCode', { amount, note })}
        >
          <Text style={styles.qrButtonIcon}>📱</Text>
          <Text style={[styles.qrButtonText, { color: colors.primary }]}>{t('requestMoney.generateQR')}</Text>
        </TouchableOpacity>

        {/* Send Request Button */}
        <TouchableOpacity style={styles.requestBtn} onPress={shareRequest}>
          <Text style={styles.requestBtnText}>{t('requestMoney.shareRequest')}</Text>
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
  content: { flex: 1, padding: 16 },
  amountSection: { marginBottom: 20 },
  label: { color: '#CCCCCC', fontSize: 14, marginBottom: 8 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
  currency: { color: '#0066FF', fontSize: 24, fontFamily: 'Montserrat_700Bold', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontFamily: 'Montserrat_700Bold' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  quickBtnActive: { backgroundColor: '#0066FF' },
  quickBtnText: { color: '#CCCCCC', fontSize: 14 },
  quickBtnTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 20 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  infoCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20 },
  infoIcon: { fontSize: 32, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { color: '#CCCCCC', fontSize: 12 },
  infoValue: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  shareSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  shareOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  shareOption: { alignItems: 'center', borderRadius: 16, padding: 16, width: '23%' },
  shareIcon: { fontSize: 24, marginBottom: 4 },
  shareLabel: { color: '#CCCCCC', fontSize: 10 },
  qrButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 16, marginBottom: 20 },
  qrButtonIcon: { fontSize: 24, marginRight: 8 },
  qrButtonText: { color: '#0066FF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  requestBtn: { backgroundColor: '#0066FF', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 20 },
  requestBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
});
