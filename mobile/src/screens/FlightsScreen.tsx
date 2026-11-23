// GMG System - Flight Booking Screen (Coming Soon)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function FlightsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const airlines = [
    { name: 'Uganda Airlines', flag: '🇺🇬', code: 'UR' },
    { name: 'Kenya Airways', flag: '🇰🇪', code: 'KQ' },
    { name: 'Ethiopian Airlines', flag: '🇪🇹', code: 'ET' },
    { name: 'RwandAir', flag: '🇷🇼', code: 'WB' },
    { name: 'South African Airways', flag: '🇿🇦', code: 'SA' },
    { name: 'EgyptAir', flag: '🇪🇬', code: 'MS' },
    { name: 'Air Tanzania', flag: '🇹🇿', code: 'TC' },
  ];

  const features = [
    '✈️ Search & compare flights',
    '🎫 Book one-way, round-trip, multi-city',
    '💳 Pay with GMG wallet or cards',
    '📱 E-tickets delivered instantly',
    '🔔 Flight status notifications',
    '💰 Best price guarantee',
    '🎁 Earn GMG rewards points',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('flights.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Coming Soon Banner */}
        <View style={[styles.comingSoonBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.rocketEmoji}>🚀</Text>
          <Text style={styles.comingSoonTitle}>{t('flights.comingSoon')}</Text>
          <Text style={styles.comingSoonText}>
            {t('flights.bookFlightsAcrossAfrica')}
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>✨ {t('flights.plannedFeatures')}</Text>
          {features.map((feature, i) => (
            <Text key={i} style={[styles.featureItem, { color: colors.textSecondary }]}>{feature}</Text>
          ))}
        </View>

        {/* Airlines */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛫 {t('flights.supportedAirlines')}</Text>
          {airlines.map((airline, i) => (
            <View key={i} style={[styles.airlineRow, { borderBottomColor: colors.border }]}>
              <Text style={styles.airlineFlag}>{airline.flag}</Text>
              <Text style={[styles.airlineName, { color: colors.text }]}>{airline.name}</Text>
              <Text style={[styles.airlineCode, { color: colors.textMuted }]}>{airline.code}</Text>
            </View>
          ))}
        </View>

        {/* Notify Me */}
        <TouchableOpacity style={[styles.notifyBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.notifyBtnText}>🔔 {t('flights.notifyMe')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  comingSoonBanner: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
  rocketEmoji: { fontSize: 48, marginBottom: 12 },
  comingSoonTitle: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  comingSoonText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, textAlign: 'center' },
  section: { marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 12 },
  featureItem: { fontSize: 14, paddingVertical: 6 },
  airlineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  airlineFlag: { fontSize: 24, marginRight: 12 },
  airlineName: { flex: 1, fontSize: 16 },
  airlineCode: { fontSize: 14 },
  notifyBtn: { marginHorizontal: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  notifyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
