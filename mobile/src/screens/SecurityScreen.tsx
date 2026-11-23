// GMG Global - Security Settings Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function SecurityScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleChangePin = () => {
    if (currentPin.length !== 6) {
      Alert.alert('Error', 'Enter your current 6-digit PIN');
      return;
    }
    if (newPin.length !== 6) {
      Alert.alert('Error', 'Enter a new 6-digit PIN');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    // API call would go here
    Alert.alert('Success', 'PIN changed successfully');
    setShowPinModal(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Biometric Login',
        'Use fingerprint or face recognition to login?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => setBiometricEnabled(true) }
        ]
      );
    } else {
      setBiometricEnabled(false);
    }
  };

  const toggle2FA = (value: boolean) => {
    if (value) {
      Alert.alert('2FA', 'Two-factor authentication setup coming soon!');
    } else {
      setTwoFactorEnabled(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('security.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('security.title')}</Text>
        </View>

        {/* PIN Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 PIN & Password</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPinModal(true)}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Change PIN</Text>
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Update your 6-digit transaction PIN</Text>
            </View>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👆 Biometric Login</Text>
          <View style={[styles.toggleItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Fingerprint / Face ID</Text>
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Quick login with biometrics</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Two-Factor Auth */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛡️ Two-Factor Authentication</Text>
          <View style={[styles.toggleItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Enable 2FA</Text>
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Extra security for your account</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={toggle2FA}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Alerts Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔔 Security Alerts</Text>
          <View style={[styles.toggleItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Login Alerts</Text>
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Get notified of new logins</Text>
            </View>
            <Switch
              value={loginAlerts}
              onValueChange={setLoginAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.toggleItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Transaction Alerts</Text>
              <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>Get notified of all transactions</Text>
            </View>
            <Switch
              value={transactionAlerts}
              onValueChange={setTransactionAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Active Sessions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📱 Active Sessions</Text>
          <View style={styles.sessionItem}>
            <View style={[styles.sessionIcon, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.sessionEmoji}>📱</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionDevice, { color: colors.text }]}>This Device</Text>
              <Text style={[styles.sessionDetails, { color: colors.textSecondary }]}>Active now • Uganda</Text>
            </View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Current</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutAllBtn}>
            <Text style={styles.logoutAllText}>Logout All Other Devices</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={showPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change PIN</Text>
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setShowPinModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleChangePin}>
                <Text style={styles.confirmBtnText}>Change PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#0066FF', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuLabel: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  menuDesc: { fontSize: 13, marginTop: 2 },
  menuArrow: { fontSize: 18 },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  sessionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sessionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sessionEmoji: { fontSize: 20 },
  sessionInfo: { flex: 1 },
  sessionDevice: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  sessionDetails: { fontSize: 13, marginTop: 2 },
  currentBadge: { backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  currentText: { color: '#10b981', fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  logoutAllBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  logoutAllText: { color: '#ef4444', fontFamily: 'Montserrat_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, marginBottom: 8, marginTop: 12 },
  pinInput: { borderRadius: 12, padding: 16, fontSize: 18, textAlign: 'center', letterSpacing: 8 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontFamily: 'Montserrat_600SemiBold' },
  confirmBtn: { flex: 1, backgroundColor: '#0066FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold' },
});
