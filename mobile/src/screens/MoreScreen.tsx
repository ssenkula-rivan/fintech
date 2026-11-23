// GMG Global Mobile App - More Screen
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import SettingsIcon from '../components/icons/SettingsIcon';

// Light theme colors
const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FA',
  primary: '#0066FF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E8ECF0',
  card: '#F5F7FA',
};

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const moreServices = [
    { icon: '📱', label: t('actions.qrCode'), screen: 'QRCode', gradient: ['#3498DB', '#54B8FB'] },
    { icon: '📥', label: t('actions.request'), screen: 'RequestMoney', gradient: ['#1ABC9C', '#3ADCBC'] },
    { icon: '👥', label: t('actions.contacts'), screen: 'Beneficiaries', gradient: ['#9B59B6', '#BB79D6'] },
    { icon: '💱', label: 'Exchange Rates', screen: 'ExchangeRates', gradient: ['#F39C12', '#F5BC52'] },
    { icon: '🔔', label: t('actions.notifications') || 'Notifications', screen: 'Notifications', gradient: ['#E74C3C', '#F76C5C'] },
    { icon: '🛡️', label: 'Security', screen: 'Security', gradient: ['#27AE60', '#47CE80'] },
    { icon: '📊', label: 'Limits', screen: 'Limits', gradient: ['#8E44AD', '#AE64CD'] },
    { icon: '❓', label: 'Help & Support', screen: 'Help', gradient: ['#3498DB', '#54B8FB'] },
    { icon: '⚙️', label: t('actions.settings'), screen: 'Settings', gradient: ['#7F8C8D', '#9FACAD'], customIcon: <SettingsIcon size={28} color="#6B7280" /> },
  ];

  const renderServiceItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.serviceItem}
      onPress={() => item.screen && navigation.navigate(item.screen)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceIconContainer}>
        {item.customIcon ? item.customIcon : <Text style={styles.serviceEmoji}>{item.icon}</Text>}
      </View>
      <Text style={styles.serviceLabel}>{item.label}</Text>
      <Text style={styles.serviceArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.servicesContainer}>
          {moreServices.map(renderServiceItem)}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>GMG Global v1.0.0</Text>
          <Text style={styles.footerSubtext}>Mobile Money & Financial Services</Text>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
  },
  scrollContent: {
    padding: 20,
  },
  servicesContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  serviceEmoji: {
    fontSize: 28,
  },
  serviceLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  serviceArrow: {
    fontSize: 24,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 4,
  },
});
