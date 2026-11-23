// GMG System - Hotel Booking Screen (Coming Soon)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function HotelsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const cities = [
    { name: 'Kampala', country: '🇺🇬', hotels: '200+' },
    { name: 'Nairobi', country: '🇰🇪', hotels: '350+' },
    { name: 'Dar es Salaam', country: '🇹🇿', hotels: '180+' },
    { name: 'Kigali', country: '🇷🇼', hotels: '120+' },
    { name: 'Johannesburg', country: '🇿🇦', hotels: '500+' },
    { name: 'Lagos', country: '🇳🇬', hotels: '400+' },
    { name: 'Addis Ababa', country: '🇪🇹', hotels: '150+' },
  ];

  const features = [
    '🏨 Search hotels in African cities',
    '⭐ Compare prices & ratings',
    '📸 View photos & amenities',
    '💳 Pay with GMG wallet',
    '📧 Instant booking confirmation',
    '🔄 Free cancellation options',
    '🎁 Earn loyalty points',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('hotels.title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.comingSoonBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.emoji}>🏨</Text>
          <Text style={styles.comingSoonTitle}>{t('hotels.comingSoon')}</Text>
          <Text style={styles.comingSoonText}>{t('hotels.bookHotelsAcrossAfrica')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>✨ {t('hotels.features')}</Text>
          {features.map((f, i) => (
            <Text key={i} style={[styles.featureItem, { color: colors.textSecondary }]}>{f}</Text>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌍 {t('hotels.popularDestinations')}</Text>
          {cities.map((city, i) => (
            <View key={i} style={[styles.cityRow, { borderBottomColor: colors.border }]}>
              <Text style={styles.cityFlag}>{city.country}</Text>
              <Text style={[styles.cityName, { color: colors.text }]}>{city.name}</Text>
              <Text style={[styles.cityHotels, { color: colors.textMuted }]}>{city.hotels} hotels</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.notifyBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.notifyBtnText}>🔔 {t('hotels.notifyMe')}</Text>
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
  emoji: { fontSize: 48, marginBottom: 12 },
  comingSoonTitle: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  comingSoonText: { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  section: { marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', marginBottom: 12 },
  featureItem: { fontSize: 14, paddingVertical: 6 },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  cityFlag: { fontSize: 24, marginRight: 12 },
  cityName: { flex: 1, fontSize: 16 },
  cityHotels: { fontSize: 14 },
  notifyBtn: { marginHorizontal: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  notifyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
