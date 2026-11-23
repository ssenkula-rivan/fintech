// GMG Global - Help & Support Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const FAQ_DATA = [
  {
    question: 'How do I send money?',
    answer: 'Go to Home > Send Money, enter the recipient\'s phone number, amount, and your PIN to complete the transfer.'
  },
  {
    question: 'What are the transaction limits?',
    answer: 'Limits depend on your KYC tier. Tier 1: UGX 500K/day, Tier 2: UGX 5M/day, Tier 3: UGX 50M/day. Upgrade your KYC to increase limits.'
  },
  {
    question: 'How do I upgrade my KYC?',
    answer: 'Go to Profile > KYC Verification. Upload your National ID and take a selfie to upgrade to higher tiers.'
  },
  {
    question: 'How long do transfers take?',
    answer: 'GMG to GMG transfers are instant. Mobile Money withdrawals take 1-5 minutes. Bank transfers take 1-3 business days.'
  },
  {
    question: 'What are the fees?',
    answer: 'GMG to GMG transfers are free. Mobile Money deposits/withdrawals have a small fee shown before confirmation.'
  },
  {
    question: 'How do I reset my PIN?',
    answer: 'Go to Profile > Security Settings > Change PIN. You\'ll need your current PIN to set a new one.'
  },
  {
    question: 'Is my money safe?',
    answer: 'Yes! GMG uses bank-level encryption and is regulated by Bank of Uganda. Your funds are held in secure trust accounts.'
  },
];

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const contactSupport = (method: string) => {
    switch (method) {
      case 'phone':
        Linking.openURL('tel:+256800100200');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/256700000000?text=Hello%20GMG%20Support');
        break;
      case 'email':
        Linking.openURL('mailto:support@gmgglobal.com');
        break;
    }
  };

  const submitTicket = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    Alert.alert(
      'Ticket Submitted',
      'We\'ve received your message and will respond within 24 hours.',
      [{ text: 'OK', onPress: () => setMessage('') }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('help.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('help.title')}</Text>
        </View>

        {/* Quick Contact */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📞 Contact Us</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => contactSupport('phone')}>
              <Text style={styles.contactIcon}>📱</Text>
              <Text style={[styles.contactLabel, { color: colors.text }]}>Call Us</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>0800 100 200</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={() => contactSupport('whatsapp')}>
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>Chat Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#0066FF' }]} onPress={() => contactSupport('email')}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@gmg</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>❓ Frequently Asked Questions</Text>
          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqItem, { borderBottomColor: colors.border }]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                <Text style={[styles.faqArrow, { color: colors.primary }]}>{expandedFaq === index ? '−' : '+'}</Text>
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Ticket */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Submit a Ticket</Text>
          <Text style={[styles.ticketDesc, { color: colors.textSecondary }]}>Can't find what you're looking for? Send us a message.</Text>
          <TextInput
            style={[styles.messageInput, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
            placeholder="Describe your issue..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={submitTicket}>
            <Text style={styles.submitBtnText}>Submit Ticket</Text>
          </TouchableOpacity>
        </View>

        {/* Useful Links */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔗 Useful Links</Text>
          <TouchableOpacity style={[styles.linkItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.linkIcon}>📜</Text>
            <Text style={[styles.linkText, { color: colors.text }]}>Terms of Service</Text>
            <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.linkIcon}>🔒</Text>
            <Text style={[styles.linkText, { color: colors.text }]}>Privacy Policy</Text>
            <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.linkIcon}>💰</Text>
            <Text style={[styles.linkText, { color: colors.text }]}>Fee Schedule</Text>
            <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.linkIcon}>📊</Text>
            <Text style={[styles.linkText, { color: colors.text }]}>Transaction Limits</Text>
            <Text style={[styles.linkArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>GMG Global v1.0.0</Text>
          <Text style={[styles.appCopyright, { color: colors.textMuted }]}>© 2025 GMG Global Limited</Text>
          <Text style={[styles.appRegulated, { color: colors.textMuted }]}>Regulated by Bank of Uganda</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { backgroundColor: '#0066FF', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  contactGrid: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  contactIcon: { fontSize: 24, marginBottom: 6 },
  contactLabel: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  contactValue: { color: '#888', fontSize: 10, marginTop: 2 },
  faqItem: { borderBottomWidth: 1, paddingVertical: 14 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 15, fontFamily: 'Montserrat_500Medium' },
  faqArrow: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginLeft: 10 },
  faqAnswer: { color: '#888', fontSize: 14, marginTop: 10, lineHeight: 20 },
  ticketDesc: { color: '#888', fontSize: 14, marginBottom: 12 },
  messageInput: { borderRadius: 12, padding: 14, fontSize: 15, minHeight: 100 },
  submitBtn: { backgroundColor: '#0066FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  linkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  linkIcon: { fontSize: 20, marginRight: 12 },
  linkText: { flex: 1, fontSize: 15 },
  linkArrow: { color: '#666', fontSize: 16 },
  appInfo: { alignItems: 'center', padding: 24 },
  appVersion: { color: '#666', fontSize: 14 },
  appCopyright: { color: '#444', fontSize: 12, marginTop: 4 },
  appRegulated: { color: '#444', fontSize: 11, marginTop: 2 },
});
