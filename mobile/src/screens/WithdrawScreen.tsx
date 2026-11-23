// GMG Global - Withdraw Screen (International)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isLargeDevice = SCREEN_WIDTH >= 414;
const scale = (size: number) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRegion } from '../context/RegionContext';
import { useNotification } from '../utils/useNotification';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

// International Mobile Money Providers
const mobileMoneyProviders = [
  // East Africa
  { id: 'mtn_ug', name: 'MTN Mobile Money', country: 'Uganda', code: 'MTN', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'airtel_ug', name: 'Airtel Money', country: 'Uganda', code: 'AIRTEL', flag: '🇺🇬', currency: 'UGX', prefix: '+256' },
  { id: 'mpesa_ke', name: 'M-Pesa', country: 'Kenya', code: 'MPESA', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'airtel_ke', name: 'Airtel Money', country: 'Kenya', code: 'AIRTEL', flag: '🇰🇪', currency: 'KES', prefix: '+254' },
  { id: 'mpesa_tz', name: 'M-Pesa', country: 'Tanzania', code: 'MPESA', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'tigopesa_tz', name: 'Tigo Pesa', country: 'Tanzania', code: 'TIGO', flag: '🇹🇿', currency: 'TZS', prefix: '+255' },
  { id: 'mtn_rw', name: 'MTN Mobile Money', country: 'Rwanda', code: 'MTN', flag: '🇷🇼', currency: 'RWF', prefix: '+250' },
  // West Africa
  { id: 'mtn_gh', name: 'MTN Mobile Money', country: 'Ghana', code: 'MTN', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'vodafone_gh', name: 'Vodafone Cash', country: 'Ghana', code: 'VODAFONE', flag: '🇬🇭', currency: 'GHS', prefix: '+233' },
  { id: 'mtn_ng', name: 'MTN MoMo', country: 'Nigeria', code: 'MTN', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'opay_ng', name: 'OPay', country: 'Nigeria', code: 'OPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'palmpay_ng', name: 'PalmPay', country: 'Nigeria', code: 'PALMPAY', flag: '🇳🇬', currency: 'NGN', prefix: '+234' },
  { id: 'orange_sn', name: 'Orange Money', country: 'Senegal', code: 'ORANGE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'wave_sn', name: 'Wave', country: 'Senegal', code: 'WAVE', flag: '🇸🇳', currency: 'XOF', prefix: '+221' },
  { id: 'orange_ci', name: 'Orange Money', country: 'Ivory Coast', code: 'ORANGE', flag: '🇨🇮', currency: 'XOF', prefix: '+225' },
  // Southern Africa
  { id: 'mpesa_za', name: 'M-Pesa', country: 'South Africa', code: 'MPESA', flag: '🇿🇦', currency: 'ZAR', prefix: '+27' },
  { id: 'ecocash_zw', name: 'EcoCash', country: 'Zimbabwe', code: 'ECOCASH', flag: '🇿🇼', currency: 'USD', prefix: '+263' },
  { id: 'airtel_zm', name: 'Airtel Money', country: 'Zambia', code: 'AIRTEL', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  { id: 'mtn_zm', name: 'MTN Mobile Money', country: 'Zambia', code: 'MTN', flag: '🇿🇲', currency: 'ZMW', prefix: '+260' },
  // Central Africa
  { id: 'orange_cm', name: 'Orange Money', country: 'Cameroon', code: 'ORANGE', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
  { id: 'mtn_cm', name: 'MTN Mobile Money', country: 'Cameroon', code: 'MTN', flag: '🇨🇲', currency: 'XAF', prefix: '+237' },
];

// International Banks
const internationalBanks = [
  { id: 'stanbic_ug', name: 'Stanbic Bank', country: 'Uganda', code: 'SBICUGKX', flag: '🇺🇬' },
  { id: 'dfcu_ug', name: 'DFCU Bank', country: 'Uganda', code: 'DFCUUGKA', flag: '🇺🇬' },
  { id: 'equity_ke', name: 'Equity Bank', country: 'Kenya', code: 'EQBLKENA', flag: '🇰🇪' },
  { id: 'kcb_ke', name: 'KCB Bank', country: 'Kenya', code: 'KCBLKENX', flag: '🇰🇪' },
  { id: 'gtbank_ng', name: 'GTBank', country: 'Nigeria', code: 'GTBINGLA', flag: '🇳🇬' },
  { id: 'firstbank_ng', name: 'First Bank', country: 'Nigeria', code: 'FBNINGLA', flag: '🇳🇬' },
  { id: 'standardbank_za', name: 'Standard Bank', country: 'South Africa', code: 'SBZAZAJJ', flag: '🇿🇦' },
  { id: 'fnb_za', name: 'FNB', country: 'South Africa', code: 'FIABORUGKA', flag: '🇿🇦' },
  { id: 'ecobank_gh', name: 'Ecobank', country: 'Ghana', code: 'EABORUGKA', flag: '🇬🇭' },
  { id: 'barclays_gb', name: 'Barclays', country: 'United Kingdom', code: 'BABORUGKA', flag: '🇬🇧' },
  { id: 'chase_us', name: 'Chase Bank', country: 'United States', code: 'CHASUS33', flag: '🇺🇸' },
  { id: 'bofa_us', name: 'Bank of America', country: 'United States', code: 'BOFAUS3N', flag: '🇺🇸' },
];

type WithdrawMethod = 'mobile' | 'bank';


export default function WithdrawScreen({ navigation }: { navigation: any }) {
  const { wallets, refreshUser } = useAuth();
  const { colors } = useTheme();
  const { country: userCountry } = useRegion();
  const { showSuccess, showError } = useNotification();
  
  // Find default provider based on user's region
  const getDefaultProvider = () => {
    const regionProvider = mobileMoneyProviders.find(p => 
      p.country.toLowerCase() === userCountry.name.toLowerCase()
    );
    return regionProvider || mobileMoneyProviders[0];
  };

  const [method, setMethod] = useState<WithdrawMethod>('mobile');
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProvider());
  const [selectedBank, setSelectedBank] = useState(internationalBanks[0]);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update default when region changes
  useEffect(() => {
    setSelectedProvider(getDefaultProvider());
  }, [userCountry]);

  const balance = wallets.find((w) => w.currency === 'UGX')?.balance || 0;
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum > 0 ? Math.max(500, amountNum * 0.015) : 0;
  const totalDeduction = amountNum + fee;
  const quickAmounts = [10000, 50000, 100000, 500000];

  const filteredProviders = mobileMoneyProviders.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBanks = internationalBanks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (method === 'mobile' && (!phone || phone.length < 6)) {
      showError('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    if (method === 'bank' && (!accountNumber || accountNumber.length < 6)) {
      showError('Invalid Account', 'Please enter a valid account number');
      return;
    }
    if (amountNum < 1000) {
      showError('Minimum Amount', 'Minimum withdrawal is 1,000');
      return;
    }
    if (totalDeduction > balance) {
      showError('Insufficient Balance', 'You don\'t have enough funds in your wallet');
      return;
    }
    setStep('confirm');
  };

  const handleWithdraw = async () => {
    if (pin.length !== 6) {
      showError('Invalid PIN', 'Please enter your 6-digit PIN');
      return;
    }

    setLoading(true);
    
    const result = await api.withdraw({
      amount: amountNum,
      method: method === 'mobile' ? selectedProvider.code as 'MTN' | 'AIRTEL' : 'BANK' as any,
      phone: method === 'mobile' ? `${selectedProvider.prefix}${phone.replace(/^0+/, '')}` : '',
      pin,
    });
    
    setLoading(false);

    if (result.success) {
      await refreshUser();
      setReceiptData({
        transactionId: result.data?.transactionId || `WD${Date.now()}`,
        method: method === 'mobile' ? selectedProvider.name : selectedBank.name,
        country: method === 'mobile' ? selectedProvider.country : selectedBank.country,
        flag: method === 'mobile' ? selectedProvider.flag : selectedBank.flag,
        destination: method === 'mobile' ? `${selectedProvider.prefix}${phone}` : `${accountNumber}`,
        amount: amountNum,
        fee: fee,
        total: totalDeduction,
        date: new Date().toLocaleString(),
        status: 'PENDING',
      });
      setShowReceipt(true);
      showSuccess('Withdrawal Initiated', 'Your funds are being processed');
    } else {
      showError('Withdrawal Failed', result.error || 'Please try again');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 'confirm' ? setStep('details') : navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Withdraw</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>GMG Wallet Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        </View>

        {step === 'details' ? (
          <>
            {/* Method Tabs */}
            <View style={[styles.methodTabs, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.methodTab, method === 'mobile' && styles.methodTabActive]}
                onPress={() => setMethod('mobile')}
              >
                <Text style={[styles.methodTabText, method === 'mobile' && styles.methodTabTextActive]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodTab, method === 'bank' && styles.methodTabActive]}
                onPress={() => setMethod('bank')}
              >
                <Text style={[styles.methodTabText, method === 'bank' && styles.methodTabTextActive]}>
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Money Section */}
            {method === 'mobile' && (
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
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={12}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Bank Section */}
            {method === 'bank' && (
              <>
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

                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Enter account holder name"
                    placeholderTextColor={colors.textMuted}
                    value={accountName}
                    onChangeText={setAccountName}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Enter account number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>
              </>
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

            <TouchableOpacity
              style={[styles.button, (amountNum < 1000 || totalDeduction > balance) && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={amountNum < 1000 || totalDeduction > balance}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Confirmation */}
            <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm Withdrawal</Text>
              
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {method === 'mobile' 
                    ? `${selectedProvider.flag} ${selectedProvider.prefix}${phone}`
                    : `${selectedBank.flag} ${accountNumber}`
                  }
                </Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Provider</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {method === 'mobile' ? selectedProvider.name : selectedBank.name}
                </Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{formatCurrency(amountNum)}</Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>Fee (1.5%)</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{formatCurrency(fee)}</Text>
              </View>
              <View style={[styles.confirmRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Deduction</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalDeduction)}</Text>
              </View>
            </View>

            {/* PIN */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Enter PIN to Confirm</Text>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                secureTextEntry={true}
                value={pin}
                onChangeText={setPin}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.withdrawButton, loading && styles.buttonDisabled]}
              onPress={handleWithdraw}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Withdraw {formatCurrency(amountNum)}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
            
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Search bank..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.providerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedBank(item);
                    setShowBankPicker(false);
                    setSearchQuery('');
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

      {/* Receipt Modal */}
      <Modal visible={showReceipt} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptModal, { backgroundColor: colors.background }]}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptIcon}>✓</Text>
              <Text style={[styles.receiptTitle, { color: colors.text }]}>Withdrawal Initiated</Text>
            </View>

            <View style={[styles.receiptCard, { backgroundColor: colors.card }]}>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.transactionId}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.destination}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Provider</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{receiptData?.flag} {receiptData?.method}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={styles.receiptAmountValue}>{formatCurrency(receiptData?.amount || 0)}</Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.receiptNote, { color: colors.textSecondary }]}>
              Your withdrawal is being processed. Funds will arrive within 1-24 hours.
            </Text>

            <TouchableOpacity
              style={styles.receiptDoneBtn}
              onPress={() => {
                setShowReceipt(false);
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  backBtn: {
    fontSize: scale(15),
    fontWeight: '600',
  },
  title: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: '#1E88E5',
    borderRadius: scale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: scale(13),
    marginBottom: verticalScale(6),
  },
  balanceValue: {
    color: '#fff',
    fontSize: scale(isSmallDevice ? 24 : 28),
    fontWeight: '700',
  },
  methodTabs: {
    flexDirection: 'row',
    borderRadius: scale(10),
    padding: scale(3),
    marginBottom: verticalScale(16),
  },
  methodTab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    borderRadius: scale(8),
  },
  methodTabActive: {
    backgroundColor: '#1E88E5',
  },
  methodTabText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#888',
  },
  methodTabTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: verticalScale(16),
  },
  sectionLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  providerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
  },
  providerFlag: {
    fontSize: scale(24),
    marginRight: scale(10),
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: scale(14),
    fontWeight: '600',
    marginBottom: 2,
  },
  providerCountry: {
    fontSize: scale(12),
  },
  dropdownArrow: {
    fontSize: scale(10),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(10),
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(14),
    fontSize: scale(14),
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(14),
    fontSize: scale(14),
  },
  input: {
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(14),
    fontSize: scale(14),
  },
  amountInput: {
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(14),
    fontSize: scale(isSmallDevice ? 20 : 24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickAmountBtn: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(isSmallDevice ? 10 : 14),
    borderRadius: scale(16),
    minWidth: scale(60),
    alignItems: 'center',
  },
  quickAmountSelected: {
    backgroundColor: '#1E88E5',
  },
  quickAmountText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  quickAmountTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#1E88E5',
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(15),
    fontWeight: '700',
  },
  withdrawButton: {
    backgroundColor: '#E53935',
  },
  confirmCard: {
    borderRadius: scale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
  },
  confirmTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: verticalScale(14),
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
  },
  confirmLabel: {
    fontSize: scale(13),
    flex: 1,
  },
  confirmValue: {
    fontSize: scale(13),
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: verticalScale(6),
  },
  totalLabel: {
    fontSize: scale(14),
    fontWeight: '700',
  },
  totalValue: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#E53935',
  },
  pinInput: {
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(14),
    fontSize: scale(20),
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: scale(6),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  modalTitle: {
    fontSize: scale(16),
    fontWeight: '700',
  },
  modalClose: {
    fontSize: scale(18),
    padding: scale(4),
  },
  searchInput: {
    borderRadius: scale(10),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    fontSize: scale(14),
    marginBottom: verticalScale(12),
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  providerItemFlag: {
    fontSize: scale(24),
    marginRight: scale(10),
  },
  providerItemInfo: {
    flex: 1,
  },
  providerItemName: {
    fontSize: scale(14),
    fontWeight: '600',
    marginBottom: 2,
  },
  providerItemCountry: {
    fontSize: scale(11),
  },
  checkmark: {
    fontSize: scale(18),
    color: '#1E88E5',
    fontWeight: '700',
  },
  receiptModal: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  receiptIcon: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: scale(28),
    textAlign: 'center',
    lineHeight: scale(56),
    marginBottom: verticalScale(12),
    overflow: 'hidden',
  },
  receiptTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  receiptCard: {
    borderRadius: scale(14),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(12),
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
  },
  receiptLabel: {
    fontSize: scale(12),
    flex: 1,
  },
  receiptValue: {
    fontSize: scale(12),
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  receiptAmountValue: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#E53935',
  },
  statusBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: scale(10),
  },
  statusText: {
    color: '#fff',
    fontSize: scale(10),
    fontWeight: '700',
  },
  receiptNote: {
    fontSize: scale(12),
    textAlign: 'center',
    marginBottom: verticalScale(16),
    lineHeight: scale(18),
  },
  receiptDoneBtn: {
    backgroundColor: '#1E88E5',
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
  },
  receiptDoneBtnText: {
    color: '#fff',
    fontSize: scale(15),
    fontWeight: '700',
  },
});
