// GMG Global Mobile App - Deposit Screen (International)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useNotification } from '../utils/useNotification';
import { formatCurrency } from '../utils/format';

// Deposit method types
type DepositMethod = 'mobile' | 'bank' | 'card';

// International Mobile Money Providers
const mobileMoneyProviders = [
  // East Africa
  { id: 'mtn_ug', name: 'MTN Mobile Money', country: 'Uganda', code: 'MTN', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'airtel_ug', name: 'Airtel Money', country: 'Uganda', code: 'AIRTEL', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'mpesa_ke', name: 'M-Pesa', country: 'Kenya', code: 'MPESA', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'airtel_ke', name: 'Airtel Money', country: 'Kenya', code: 'AIRTEL', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'mpesa_tz', name: 'M-Pesa', country: 'Tanzania', code: 'MPESA', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'tigopesa_tz', name: 'Tigo Pesa', country: 'Tanzania', code: 'TIGO', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'airtel_tz', name: 'Airtel Money', country: 'Tanzania', code: 'AIRTEL', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'mtn_rw', name: 'MTN Mobile Money', country: 'Rwanda', code: 'MTN', flag: '🇷🇼', currency: 'RWF', prefix: '+250' },
  { id: 'airtel_rw', name: 'Airtel Money', country: 'Rwanda', code: 'AIRTEL', flag: '🇷🇼', currency: 'RWF', prefix: '+250' },
  // West Africa
  { id: 'mtn_gh', name: 'MTN Mobile Money', country: 'Ghana', code: 'MTN', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'vodafone_gh', name: 'Vodafone Cash', country: 'Ghana', code: 'VODAFONE', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'airteltigo_gh', name: 'AirtelTigo Money', country: 'Ghana', code: 'AIRTELTIGO', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'mtn_ng', name: 'MTN MoMo', country: 'Nigeria', code: 'MTN', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'opay_ng', name: 'OPay', country: 'Nigeria', code: 'OPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'palmpay_ng', name: 'PalmPay', country: 'Nigeria', code: 'PALMPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'orange_sn', name: 'Orange Money', country: 'Senegal', code: 'ORANGE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'wave_sn', name: 'Wave', country: 'Senegal', code: 'WAVE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'orange_ci', name: 'Orange Money', country: 'Ivory Coast', code: 'ORANGE', flag: '🇨🇮', currency: 'XOF', prefix: '+225' },
  { id: 'mtn_ci', name: 'MTN Mobile Money', country: 'Ivory Coast', code: 'MTN', flag: '🇨🇮', currency: 'XOF', prefix: '+225' },
  // Southern Africa
  { id: 'mpesa_za', name: 'M-Pesa', country: 'South Africa', code: 'MPESA', flag: '🇿🇦', currency: 'ZAR', prefix: '+27' },
  { id: 'ecocash_zw', name: 'EcoCash', country: 'Zimbabwe', code: 'ECOCASH', flag: '🇿🇼', currency: 'USD', prefix: '+263' },
  { id: 'mpesa_mz', name: 'M-Pesa', country: 'Mozambique', code: 'MPESA', flag: '🇲🇿', currency: 'MZN', prefix: '+258' },
  { id: 'airtel_zm', name: 'Airtel Money', country: 'Zambia', code: 'AIRTEL', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  { id: 'mtn_zm', name: 'MTN Mobile Money', country: 'Zambia', code: 'MTN', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  // Central Africa
  { id: 'orange_cm', name: 'Orange Money', country: 'Cameroon', code: 'ORANGE', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
  { id: 'mtn_cm', name: 'MTN Mobile Money', country: 'Cameroon', code: 'MTN', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
  { id: 'airtel_cd', name: 'Airtel Money', country: 'DR Congo', code: 'AIRTEL', flag: '🇨🇩', currency: 'CDF', prefix: '+243' },
  { id: 'orange_cd', name: 'Orange Money', country: 'DR Congo', code: 'ORANGE', flag: '🇨🇩', currency: 'CDF', prefix: '+243' },
];

// International Banks
const internationalBanks = [
  { id: 'stanbic_ug', name: 'Stanbic Bank', country: 'Uganda', code: 'SBICUGKX', flag: '🇺🇬' },
  { id: 'equity_ke', name: 'Equity Bank', country: 'Kenya', code: 'EABORUGKA', flag: '🇰🇪' },
  { id: 'kcb_ke', name: 'KCB Bank', country: 'Kenya', code: 'KCBLKENX', flag: '🇰🇪' },
  { id: 'gtbank_ng', name: 'GTBank', country: 'Nigeria', code: 'GTBINGLA', flag: '🇳🇬' },
  { id: 'firstbank_ng', name: 'First Bank', country: 'Nigeria', code: 'FBNINGLA', flag: '🇳🇬' },
  { id: 'standardbank_za', name: 'Standard Bank', country: 'South Africa', code: 'SBZAZAJJ', flag: '🇿🇦' },
  { id: 'fnb_za', name: 'FNB', country: 'South Africa', code: 'FIABORUGKA', flag: '🇿🇦' },
  { id: 'ecobank_gh', name: 'Ecobank', country: 'Ghana', code: 'EABORUGKA', flag: '🇬🇭' },
];

export default function DepositScreen() {
  const navigation = useNavigation<any>();
  const { refreshUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { country: userCountry } = useRegion();
  const { showSuccess, showError } = useNotification();
  
  // Find default provider based on user's region
  const getDefaultProvider = () => {
    const regionProvider = mobileMoneyProviders.find(p => 
      p.country.toLowerCase() === userCountry.name.toLowerCase()
    );
    return regionProvider || mobileMoneyProviders[0];
  };

  const [depositMethod, setDepositMethod] = useState<DepositMethod>('mobile');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProvider());
  const [selectedBank, setSelectedBank] = useState(internationalBanks[0]);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update default when region changes
  useEffect(() => {
    setSelectedProvider(getDefaultProvider());
  }, [userCountry]);

  const amountNum = parseFloat(amount) || 0;
  const quickAmounts = [10000, 50000, 100000, 500000, 1000000];

  const filteredProviders = mobileMoneyProviders.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeposit = async () => {
    if (amountNum < 1000) {
      showError('Invalid Amount', 'Minimum deposit is 1,000');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDeposit = async () => {
    setLoading(true);
    
    const depositData = depositMethod === 'mobile' 
      ? {
          amount: amountNum,
          method: selectedProvider.code as 'MTN' | 'AIRTEL',
          phone: phoneNumber || selectedProvider.prefix,
          provider: selectedProvider.id,
          country: selectedProvider.country,
        }
      : {
          amount: amountNum,
          method: 'BANK' as any,
          bankId: selectedBank.id,
        };

    const result = await api.deposit(depositData);
    setLoading(false);

    if (result.success && result.data) {
      setShowConfirmModal(false);
      setReceiptData({
        transactionId: result.data.transactionId?.toString() || `DEP${Date.now()}`,
        reference: result.data.reference || `GMG${Date.now()}`,
        amount: amountNum,
        method: depositMethod === 'mobile' ? selectedProvider.name : selectedBank.name,
        country: depositMethod === 'mobile' ? selectedProvider.country : selectedBank.country,
        date: new Date().toLocaleString(),
        status: 'PENDING',
      });
      setShowReceipt(true);
      showSuccess('Deposit Initiated', 'Check your phone for payment prompt');
    } else {
      showError('Deposit Failed', result.error || 'Please try again');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Deposit</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Deposit Method Tabs */}
        <View style={[styles.methodTabs, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.methodTab, depositMethod === 'mobile' && styles.methodTabActive]}
            onPress={() => setDepositMethod('mobile')}
          >
            <Text style={[styles.methodTabText, depositMethod === 'mobile' && styles.methodTabTextActive]}>
              Mobile Money
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodTab, depositMethod === 'bank' && styles.methodTabActive]}
            onPress={() => setDepositMethod('bank')}
          >
            <Text style={[styles.methodTabText, depositMethod === 'bank' && styles.methodTabTextActive]}>
              Bank Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mobile Money Section */}
        {depositMethod === 'mobile' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Provider</Text>
              <TouchableOpacity
                style={[styles.providerSelector, { backgroundColor: colors.card }]}
                onPress={() => setShowProviderPicker(true)}
              >
                <Text style={styles.providerFlag}>{selectedProvider.flag}</Text>
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { color: colors.text }]}>{selectedProvider.name}</Text>
                  <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                    {selectedProvider.country} • {selectedProvider.currency}
                  </Text>
                </View>
                <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              <View style={[styles.phoneInputContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.phonePrefix, { color: colors.textMuted }]}>{selectedProvider.prefix}</Text>
                <TextInput
                  style={[styles.phoneInput, { color: colors.text }]}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={12}
                />
              </View>
            </View>
          </>
        )}

        {/* Bank Section */}
        {depositMethod === 'bank' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Bank</Text>
            <TouchableOpacity
              style={[styles.providerSelector, { backgroundColor: colors.card }]}
              onPress={() => setShowBankPicker(true)}
            >
              <Text style={styles.providerFlag}>{selectedBank.flag}</Text>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.text }]}>{selectedBank.name}</Text>
                <Text style={[styles.providerCountry, { color: colors.textMuted }]}>
                  {selectedBank.country} • {selectedBank.code}
                </Text>
              </View>
              <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Amount</Text>
          <TextInput
            style={[styles.amountInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickAmountBtn, { backgroundColor: colors.card }, amountNum === amt && styles.quickAmountSelected]}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={[styles.quickAmountText, { color: colors.textSecondary }, amountNum === amt && styles.quickAmountTextSelected]}>
                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          style={[styles.button, amountNum < 1000 && styles.buttonDisabled]}
          onPress={handleDeposit}
          disabled={amountNum < 1000}
        >
          <Text style={styles.buttonText}>
            {amountNum > 0 ? `Deposit ${formatCurrency(amountNum)}` : 'Deposit'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {depositMethod === 'mobile' 
              ? '1. Enter your mobile money number\n2. Enter amount and confirm\n3. Approve payment on your phone\n4. Funds credited instantly'
              : '1. Select your bank\n2. Transfer to our account\n3. Enter reference number\n4. Funds credited within 24hrs'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Provider Picker Modal */}
      <Modal visible={showProviderPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Provider</Text>
              <TouchableOpacity onPress={() => setShowProviderPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Search country or provider..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <FlatList
              data={filteredProviders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedProvider(item);
                    setShowProviderPicker(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.providerItemFlag}>{item.flag}</Text>
                  <View style={styles.providerItemInfo}>
                    <Text style={[styles.providerItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.providerItemCountry, { color: colors.textMuted }]}>
                      {item.country} • {item.currency}
                    </Text>
                  </View>
                  {selectedProvider.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={internationalBanks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedBank(item);
                    setShowBankPicker(false);
                  }}
                >
                  <Text style={styles.providerItemFlag}>{item.flag}</Text>
                  <View style={styles.providerItemInfo}>
                    <Text style={[styles.providerItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.providerItemCountry, { color: colors.textMuted }]}>
                      {item.country} • {item.code}
                    </Text>
                  </View>
                  {selectedBank.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.background }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm Deposit</Text>
            
            <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={styles.confirmAmount}>{formatCurrency(amountNum)}</Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Method</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {depositMethod === 'mobile' ? selectedProvider.name : selectedBank.name}
                </Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Country</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {depositMethod === 'mobile' ? `${selectedProvider.flag} ${selectedProvider.country}` : `${selectedBank.flag} ${selectedBank.country}`}
                </Text>
              </View>
              {depositMethod === 'mobile' && (
                <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedProvider.prefix}{phoneNumber}</Text>
                </View>
              )}
            </View>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmDeposit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptModal, { backgroundColor: colors.background }]}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptIcon}>✓</Text>
              <Text style={[styles.receiptTitle, { color: colors.text }]}>Deposit Initiated</Text>
            </View>

            <View style={[styles.receiptCard, { backgroundColor: colors.card }]}>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.transactionId}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={styles.receiptAmountValue}>{formatCurrency(receiptData?.amount || 0)}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Provider</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.method}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.receiptNote, { color: colors.textSecondary }]}>
              {depositMethod === 'mobile' 
                ? 'Check your phone for payment prompt. Approve to complete deposit.'
                : 'Transfer funds to complete deposit. Credited within 24 hours.'
              }
            </Text>

            <TouchableOpacity
              style={styles.receiptDoneBtn}
              onPress={async () => {
                setShowReceipt(false);
                await refreshUser();
                navigation.goBack();
              }}
            >
              <Text style={styles.receiptDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(10) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(16) },
  backBtn: { fontSize: scale(15) },
  title: { fontSize: scale(18), fontFamily: 'Montserrat_600SemiBold' },
  // Method Tabs
  methodTabs: { flexDirection: 'row', borderRadius: scale(10), padding: scale(3), marginBottom: verticalScale(16) },
  methodTab: { flex: 1, paddingVertical: verticalScale(10), alignItems: 'center', borderRadius: scale(8) },
  methodTabActive: { backgroundColor: '#0066FF' },
  methodTabText: { color: '#888', fontSize: scale(13), fontFamily: 'Montserrat_500Medium' },
  methodTabTextActive: { color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
  // Sections
  section: { marginBottom: verticalScale(16) },
  sectionLabel: { fontSize: scale(13), marginBottom: verticalScale(8) },
  // Provider Selector
  providerSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(12) },
  providerFlag: { fontSize: scale(24), marginRight: scale(10) },
  providerInfo: { flex: 1 },
  providerName: { fontSize: scale(14), fontFamily: 'Montserrat_600SemiBold' },
  providerCountry: { fontSize: scale(11), marginTop: 2 },
  dropdownArrow: { fontSize: scale(10) },
  // Phone Input
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: scale(10), paddingHorizontal: scale(12) },
  phonePrefix: { fontSize: scale(14), marginRight: scale(8), fontFamily: 'Montserrat_500Medium' },
  phoneInput: { flex: 1, paddingVertical: verticalScale(12), fontSize: scale(14) },
  // Amount
  amountInput: { borderRadius: scale(10), paddingHorizontal: scale(16), paddingVertical: verticalScale(14), fontSize: scale(isSmallDevice ? 22 : 26), textAlign: 'center' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: verticalScale(8), justifyContent: 'space-between' },
  quickAmountBtn: { width: '18%', borderRadius: scale(8), paddingVertical: verticalScale(8), alignItems: 'center', marginBottom: verticalScale(6) },
  quickAmountSelected: { backgroundColor: '#0066FF' },
  quickAmountText: { fontFamily: 'Montserrat_600SemiBold', fontSize: scale(11) },
  quickAmountTextSelected: { color: '#fff' },
  // Button
  button: { backgroundColor: '#0066FF', borderRadius: scale(10), paddingVertical: verticalScale(14), alignItems: 'center', marginTop: verticalScale(8) },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: scale(16), fontFamily: 'Montserrat_600SemiBold' },
  // Info Box
  infoBox: { borderRadius: scale(10), paddingVertical: verticalScale(14), paddingHorizontal: scale(14), marginTop: verticalScale(16) },
  infoTitle: { fontSize: scale(13), fontFamily: 'Montserrat_600SemiBold', marginBottom: verticalScale(6) },
  infoText: { fontSize: scale(12), lineHeight: scale(18) },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), maxHeight: '80%', paddingVertical: verticalScale(14), paddingHorizontal: scale(14) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(10) },
  modalTitle: { fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  modalClose: { fontSize: scale(20), padding: scale(4) },
  searchInput: { borderRadius: scale(10), paddingHorizontal: scale(12), paddingVertical: verticalScale(10), fontSize: scale(14), marginBottom: verticalScale(10) },
  // Provider Item
  providerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(10), borderBottomWidth: 1 },
  providerItemFlag: { fontSize: scale(22), marginRight: scale(10) },
  providerItemInfo: { flex: 1 },
  providerItemName: { fontSize: scale(14), fontFamily: 'Montserrat_500Medium' },
  providerItemCountry: { fontSize: scale(10), marginTop: 2 },
  checkmark: { color: '#0066FF', fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  // Confirm Modal
  confirmModal: { borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingVertical: verticalScale(16), paddingHorizontal: scale(16) },
  confirmTitle: { fontSize: scale(16), fontFamily: 'Montserrat_700Bold', textAlign: 'center', marginBottom: verticalScale(14) },
  confirmCard: { borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(12), marginBottom: verticalScale(14) },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8), borderBottomWidth: 1 },
  confirmLabel: { fontSize: scale(12) },
  confirmValue: { fontSize: scale(12), fontFamily: 'Montserrat_500Medium', maxWidth: '60%', textAlign: 'right' },
  confirmAmount: { color: '#0066FF', fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  confirmButtons: { flexDirection: 'row', gap: scale(10) },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: scale(10), paddingVertical: verticalScale(12), alignItems: 'center' },
  cancelBtnText: { fontSize: scale(14), fontFamily: 'Montserrat_500Medium' },
  confirmBtn: { flex: 1, backgroundColor: '#0066FF', borderRadius: scale(10), paddingVertical: verticalScale(12), alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: scale(14), fontFamily: 'Montserrat_600SemiBold' },
  // Receipt
  receiptModal: { borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingVertical: verticalScale(16), paddingHorizontal: scale(16) },
  receiptHeader: { alignItems: 'center', marginBottom: verticalScale(14) },
  receiptIcon: { fontSize: scale(36), color: '#4CAF50', backgroundColor: '#0a2a1a', width: scale(60), height: scale(60), lineHeight: scale(60), textAlign: 'center', borderRadius: scale(30), marginBottom: verticalScale(8), overflow: 'hidden' },
  receiptTitle: { fontSize: scale(16), fontFamily: 'Montserrat_700Bold' },
  receiptCard: { borderRadius: scale(10), paddingVertical: verticalScale(12), paddingHorizontal: scale(12), marginBottom: verticalScale(10) },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8), borderBottomWidth: 1 },
  receiptLabel: { fontSize: scale(12) },
  receiptValue: { fontSize: scale(12), fontFamily: 'Montserrat_500Medium', maxWidth: '55%', textAlign: 'right' },
  receiptAmountValue: { color: '#4CAF50', fontSize: scale(14), fontFamily: 'Montserrat_700Bold' },
  statusBadge: { backgroundColor: '#332200', paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: scale(8) },
  statusText: { color: '#FFAA00', fontSize: scale(10), fontFamily: 'Montserrat_600SemiBold' },
  receiptNote: { fontSize: scale(11), textAlign: 'center', marginBottom: verticalScale(12) },
  receiptDoneBtn: { backgroundColor: '#0066FF', borderRadius: scale(10), paddingVertical: verticalScale(12), alignItems: 'center' },
  receiptDoneBtnText: { color: '#fff', fontSize: scale(14), fontFamily: 'Montserrat_600SemiBold' },
});
