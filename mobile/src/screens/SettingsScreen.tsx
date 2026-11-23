// GMG Global - Settings/More Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useOnboarding } from '../context/OnboardingContext';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  screen?: string;
  action?: () => void;
  toggle?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { resetAllTours } = useOnboarding();
  const [biometrics, setBiometrics] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleResetTours = () => {
    Alert.alert(
      'Reset App Tours',
      'This will show all walkthrough tutorials again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => {
          resetAllTours();
          Alert.alert('Done', 'App tours have been reset. You\'ll see them again on each screen.');
        }}
      ]
    );
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System Default';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const settingsSections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        { icon: '👤', title: 'My Profile', subtitle: 'Personal information', screen: 'Profile' },
        { icon: '🔐', title: 'Security', subtitle: 'PIN, biometrics, 2FA', screen: 'Security' },
        { icon: '📊', title: 'Transaction Limits', subtitle: 'View your limits', screen: 'Limits' },
        { icon: '✅', title: 'KYC Verification', subtitle: user?.kycStatus || 'Verify your identity', screen: 'KYC' },
      ]
    },
    {
      title: 'Payments',
      items: [
        { icon: '👥', title: 'Saved Beneficiaries', subtitle: 'Manage recipients', screen: 'Beneficiaries' },
        { icon: '💳', title: 'Linked Cards', subtitle: 'Manage payment cards', screen: 'Cards' },
        { icon: '🏦', title: 'Bank Accounts', subtitle: 'Linked bank accounts', screen: 'Banks' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', title: 'Notifications', subtitle: notifications ? 'Enabled' : 'Disabled', toggle: true },
        { icon: '👆', title: 'Biometric Login', subtitle: biometrics ? 'Enabled' : 'Disabled', toggle: true },
        { icon: '🎨', title: 'Theme', subtitle: getThemeLabel(), action: () => setShowThemeModal(true) },
        { icon: '🌍', title: 'Language', subtitle: 'English', screen: 'Language' },
        { icon: '💱', title: 'Default Currency', subtitle: 'UGX', screen: 'Currency' },
        { icon: '🎓', title: 'Reset App Tours', subtitle: 'Show walkthroughs again', action: handleResetTours },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', title: 'Help & FAQ', subtitle: 'Get help', screen: 'Help' },
        { icon: '💬', title: 'Contact Support', subtitle: 'Chat with us', action: () => Alert.alert('Support', 'Call us at +256 700 000 000') },
        { icon: '📜', title: 'Terms & Conditions', screen: 'Terms' },
        { icon: '🔒', title: 'Privacy Policy', screen: 'Privacy' },
      ]
    },
    {
      title: 'About',
      items: [
        { icon: '📱', title: 'App Version', subtitle: '1.0.0' },
        { icon: '🐛', title: 'Crash Logs', subtitle: 'View error reports', screen: 'CrashLogs' },
        { icon: '⭐', title: 'Rate Us', action: () => Alert.alert('Rate Us', 'Thank you for your support!') },
        { icon: '📤', title: 'Share App', action: () => Alert.alert('Share', 'Share link copied!') },
      ]
    }
  ];

  const handleItemPress = (item: SettingItem) => {
    if (item.action) {
      item.action();
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light Mode', icon: '☀️' },
    { mode: 'dark', label: 'Dark Mode', icon: '🌙' },
    { mode: 'system', label: 'System Default', icon: '📱' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <TouchableOpacity style={[styles.userCard, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Profile')}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName} {user?.lastName}</Text>
            <Text style={[styles.userPhone, { color: colors.textMuted }]}>{user?.phone}</Text>
          </View>
          <Text style={[styles.arrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.settingItem, itemIndex < section.items.length - 1 && [styles.settingItemBorder, { borderBottomColor: colors.border }]]}
                  onPress={() => !item.toggle && handleItemPress(item)}
                  disabled={item.toggle}
                >
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                    {item.subtitle && <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>}
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.title.includes('Notification') ? notifications : biometrics}
                      onValueChange={(val) => {
                        if (item.title.includes('Notification')) setNotifications(val);
                        else setBiometrics(val);
                      }}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <Text style={[styles.arrow, { color: colors.textMuted }]}>→</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>
            
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: themeMode === option.mode ? colors.primary + '20' : 'transparent' },
                  { borderColor: themeMode === option.mode ? colors.primary : colors.border }
                ]}
                onPress={() => {
                  setThemeMode(option.mode);
                  setShowThemeModal(false);
                }}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
                {themeMode === option.mode && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.cancelBtn, { backgroundColor: colors.border }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  userCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, borderRadius: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Montserrat_700Bold' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  userPhone: { fontSize: 14, marginTop: 2 },
  arrow: { fontSize: 18 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', marginLeft: 16, marginBottom: 8, textTransform: 'uppercase' },
  sectionCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingItemBorder: { borderBottomWidth: 1 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16 },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: '#EF4444', marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#CCCCCC', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', textAlign: 'center', marginBottom: 20 },
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
  themeIcon: { fontSize: 28, marginRight: 16 },
  themeLabel: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  checkmark: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  cancelBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
