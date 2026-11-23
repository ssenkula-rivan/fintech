// GMG System - Bus Booking Screen (Coming Soon)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function BusScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const routes = [
    { from: 'Kampala', to: 'Nairobi', flag: '🇰🇪', duration: '12h' },
    { from: 'Kampala', to: 'Kigali', flag: '🇷🇼', duration: '8h' },
    { from: 'Kampala', to: 'Dar es Salaam', flag: '🇹🇿', duration: '18h' },
    { from: 'Kampala', to: 'Juba', flag: '🇸🇸', duration: '10h' },
    { from: 'Kampala', to: 'Mombasa', flag: '🇰🇪', duration: '14h' },
  ];

  const features = [
    '🚌 Search & compare bus routes',
    '🎫 Book tickets online',
    '💳 Pay with GMG wallet',
    '📱 E-tickets on your phone',
    '🔔 Trip reminders',
    '💰 Best price guarantee',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('bus.title') || 'Bus Booking'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.comingSoonBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.emoji}>🚌</Text>
          <Text style={styles.comingSoonTitle}>{t('bus.comingSoon') || 'Coming Soon'}</Text>
          <Text style={styles.comingSoonText}>{t('bus.bookBusTickets') || 'Book bus tickets across East Africa'}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>✨ {t('bus.features') || 'Features'}</Text>
          {features.map((f, i) => (
            <Text key={i} style={[styles.featureItem, { color: colors.textSecondary }]}>{f}</Text>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛣️ {t('bus.popularRoutes') || 'Popular Routes'}</Text>
          {routes.map((route, i) => (
            <View key={i} style={[styles.routeRow, { borderBottomColor: colors.border }]}>
              <Text style={styles.routeFlag}>{route.flag}</Text>
              <View style={styles.routeInfo}>
                <Text style={[styles.routeName, { color: colors.text }]}>{route.from} → {route.to}</Text>
                <Text style={[styles.routeDuration, { color: colors.textMuted }]}>{route.duration}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.notifyBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.notifyBtnText}>🔔 {t('bus.notifyMe') || 'Notify Me'}</Text>
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
  routeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  routeFlag: { fontSize: 24, marginRight: 12 },
  routeInfo: { flex: 1 },
  routeName: { fontSize: 16 },
  routeDuration: { fontSize: 14 },
  notifyBtn: { marginHorizontal: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  notifyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
