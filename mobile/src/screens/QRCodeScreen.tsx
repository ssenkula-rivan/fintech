// GMG Global - QR Code Screen with Real QR Code & Auto-Regeneration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share, TextInput, 
  ScrollView, Modal, FlatList, Animated, Alert, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface Currency {
  code: string;
  symbol: string;
  flag: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: 'UGX', symbol: 'UGX', flag: '🇺🇬', name: 'Uganda Shilling' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
  { code: 'KES', symbol: 'KES', flag: '🇰🇪', name: 'Kenyan Shilling' },
  { code: 'TZS', symbol: 'TZS', flag: '🇹🇿', name: 'Tanzanian Shilling' },
  { code: 'RWF', symbol: 'RWF', flag: '🇷🇼', name: 'Rwanda Franc' },
  { code: 'NGN', symbol: '₦', flag: '🇳🇬', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', flag: '🇿🇦', name: 'South African Rand' },
  { code: 'GHS', symbol: '₵', flag: '🇬🇭', name: 'Ghana Cedi' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
];

const PAYMENT_TYPES = [
  { id: 'personal', icon: '👤', label: 'Personal', desc: 'Receive from friends & family' },
  { id: 'merchant', icon: '🏪', label: 'Merchant', desc: 'Accept business payments' },
  { id: 'bills', icon: '📄', label: 'Bills', desc: 'Pay utilities & services' },
  { id: 'international', icon: '🌍', label: 'International', desc: 'Cross-border payments' },
];

const QR_EXPIRY_TIME = 60; // 60 seconds
const MAX_REGENERATIONS = 3;


export default function QRCodeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'receive' | 'scan' | 'pay'>('receive');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [paymentType, setPaymentType] = useState('personal');
  const [showPaymentTypes, setShowPaymentTypes] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  // QR Code regeneration state
  const [qrToken, setQrToken] = useState(Date.now().toString());
  const [timeLeft, setTimeLeft] = useState(QR_EXPIRY_TIME);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  
  const pulseAnim = useState(new Animated.Value(1))[0];
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR data with unique token
  const generateQRData = useCallback(() => {
    const token = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    return JSON.stringify({
      type: 'gmg_payment',
      version: '2.0',
      phone: user?.phone,
      name: `${user?.firstName} ${user?.lastName}`,
      amount: amount || undefined,
      currency: selectedCurrency.code,
      paymentType,
      note: note || undefined,
      token,
      expiresAt: Date.now() + (QR_EXPIRY_TIME * 1000),
    });
  }, [user, amount, selectedCurrency, paymentType, note]);

  const [qrData, setQrData] = useState(generateQRData());

  // Regenerate QR code
  const regenerateQR = useCallback(() => {
    if (regenerationCount >= MAX_REGENERATIONS) {
      setShowExpiredAlert(true);
      setIsExpired(true);
      return;
    }
    setQrToken(Date.now().toString());
    setQrData(generateQRData());
    setTimeLeft(QR_EXPIRY_TIME);
    setRegenerationCount(prev => prev + 1);
    setIsExpired(false);
  }, [regenerationCount, generateQRData]);

  // Manual regenerate (resets count)
  const manualRegenerate = useCallback(() => {
    setRegenerationCount(0);
    setShowExpiredAlert(false);
    setQrToken(Date.now().toString());
    setQrData(generateQRData());
    setTimeLeft(QR_EXPIRY_TIME);
    setIsExpired(false);
  }, [generateQRData]);

  // Timer for QR expiry
  useEffect(() => {
    if (activeTab !== 'receive' || isExpired) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          regenerateQR();
          return QR_EXPIRY_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab, isExpired, regenerateQR]);

  // Update QR data when inputs change
  useEffect(() => {
    if (!isExpired) {
      setQrData(generateQRData());
    }
  }, [amount, note, selectedCurrency, paymentType]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Scan line animation
  useEffect(() => {
    if (activeTab === 'scan') {
      const scanLine = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      scanLine.start();
      return () => scanLine.stop();
    }
  }, [activeTab]);

  // Camera permission
  useEffect(() => {
    if (activeTab === 'scan' && !permission?.granted) {
      requestPermission();
    }
    if (activeTab === 'scan') setScanned(false);
  }, [activeTab]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);
    
    try {
      const qrInfo = JSON.parse(data);
      if (qrInfo.type === 'gmg_payment') {
        Alert.alert(
          '💰 Payment Request',
          `Pay ${qrInfo.name}\n📱 ${qrInfo.phone}${qrInfo.amount ? `\n💵 ${qrInfo.currency || 'UGX'} ${parseInt(qrInfo.amount).toLocaleString()}` : ''}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
            { text: 'Pay Now', onPress: () => navigation.navigate('Send', { recipient: qrInfo.phone, amount: qrInfo.amount }) },
          ]
        );
      } else {
        Alert.alert('QR Code Scanned', data, [{ text: 'OK', onPress: () => setScanned(false) }]);
      }
    } catch {
      Alert.alert('QR Code Scanned', data, [{ text: 'OK', onPress: () => setScanned(false) }]);
    }
  };

  const handleShare = async () => {
    const amountText = amount ? `\nAmount: ${selectedCurrency.symbol} ${parseInt(amount).toLocaleString()}` : '';
    try {
      await Share.share({
        message: `💰 Pay me via GMG Global!\n\n👤 ${user?.firstName} ${user?.lastName}\n📱 ${user?.phone}${amountText}\n\n🔗 Download GMG Global app.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseInt(num).toLocaleString() : '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedPaymentType = PAYMENT_TYPES.find(p => p.id === paymentType) || PAYMENT_TYPES[0];


  // Camera Scanner Component
  const renderScanner = () => {
    if (!permission) {
      return (
        <View style={styles.scanContent}>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>Requesting camera permission...</Text>
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.scanContent}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>We need camera access to scan QR codes</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" enableTorch={flashOn} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}>
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTop} />
            <View style={styles.scannerMiddle}>
              <View style={styles.scannerSide} />
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 230] }) }] }]} />
              </View>
              <View style={styles.scannerSide} />
            </View>
            <View style={styles.scannerBottom}>
              <Text style={styles.scannerHint}>Position QR code within the frame</Text>
              <View style={styles.cameraControls}>
                <TouchableOpacity style={[styles.controlBtn, flashOn && styles.controlBtnActive]} onPress={() => setFlashOn(!flashOn)}>
                  <Text style={styles.controlIcon}>{flashOn ? '🔦' : '💡'}</Text>
                  <Text style={styles.controlText}>Flash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={() => setScanned(false)}>
                  <Text style={styles.controlIcon}>🔄</Text>
                  <Text style={styles.controlText}>Reset</Text>
                </TouchableOpacity>
              </View>
              {scanned && (
                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
                  <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>QR Pay</Text>
        <TouchableOpacity style={styles.helpButton}><Text style={styles.helpIcon}>❓</Text></TouchableOpacity>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {[{ id: 'receive', icon: '📥', label: 'Receive' }, { id: 'scan', icon: '📷', label: 'Scan' }, { id: 'pay', icon: '💳', label: 'Pay Bills' }].map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.tabActive]} onPress={() => setActiveTab(tab.id as any)}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'scan' ? renderScanner() : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'receive' && (
            <>
              <TouchableOpacity style={[styles.paymentTypeSelector, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowPaymentTypes(true)}>
                <View style={styles.paymentTypeLeft}>
                  <Text style={styles.paymentTypeIcon}>{selectedPaymentType.icon}</Text>
                  <View>
                    <Text style={[styles.paymentTypeLabel, { color: colors.text }]}>{selectedPaymentType.label}</Text>
                    <Text style={[styles.paymentTypeDesc, { color: colors.textSecondary }]}>{selectedPaymentType.desc}</Text>
                  </View>
                </View>
                <Text style={[styles.dropdownArrow, { color: colors.primary }]}>▼</Text>
              </TouchableOpacity>

              {/* QR Code Card with Real QR */}
              <Animated.View style={[styles.qrCard, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.qrGradient}>
                  <View style={styles.qrHeader}>
                    <Text style={styles.qrHeaderText}>GMG GLOBAL</Text>
                    <View style={[styles.timerBadge, timeLeft <= 10 && styles.timerBadgeWarning]}>
                      <Text style={styles.timerText}>⏱️ {formatTime(timeLeft)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.qrCodeContainer}>
                    {isExpired || showExpiredAlert ? (
                      <View style={styles.expiredOverlay}>
                        <TouchableOpacity style={styles.reloadButton} onPress={manualRegenerate}>
                          <Text style={styles.reloadIcon}>🔄</Text>
                          <Text style={styles.reloadText}>Tap to Regenerate</Text>
                        </TouchableOpacity>
                        <Text style={styles.expiredText}>QR Code Expired</Text>
                      </View>
                    ) : (
                      <View style={styles.qrCodeFrame}>
                        <QRCode
                          value={qrData}
                          size={160}
                          color="#0066FF"
                          backgroundColor="#fff"
                          logo={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }}
                          logoSize={30}
                          logoBackgroundColor="#0066FF"
                          logoMargin={2}
                          logoBorderRadius={4}
                        />
                        <View style={styles.qrLogoOverlay}>
                          <Text style={styles.qrLogoText}>GMG</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.qrUserInfo}>
                    <Text style={styles.qrUserName}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.qrUserPhone}>{user?.phone}</Text>
                  </View>

                  {amount && !isExpired && (
                    <View style={styles.qrAmountBadge}>
                      <Text style={styles.qrAmountText}>{selectedCurrency.flag} {selectedCurrency.symbol} {formatAmount(amount)}</Text>
                    </View>
                  )}

                  <View style={styles.regenerationInfo}>
                    <Text style={styles.regenerationText}>
                      {isExpired ? 'Session expired' : `Auto-refresh ${regenerationCount}/${MAX_REGENERATIONS}`}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <TouchableOpacity style={[styles.currencySelector, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowCurrencyPicker(true)}>
                <Text style={styles.currencyFlag}>{selectedCurrency.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={[styles.currencyCode, { color: colors.text }]}>{selectedCurrency.code}</Text>
                  <Text style={[styles.currencyName, { color: colors.textSecondary }]}>{selectedCurrency.name}</Text>
                </View>
                <Text style={[styles.currencyArrow, { color: colors.primary }]}>▼</Text>
              </TouchableOpacity>

              <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Request Amount (Optional)</Text>
                <View style={styles.amountInputRow}>
                  <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>{selectedCurrency.symbol}</Text>
                  <TextInput style={[styles.amountInput, { color: colors.text }]} value={formatAmount(amount)} onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
                </View>
              </View>

              <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>Add Note (Optional)</Text>
                <TextInput style={[styles.noteInput, { color: colors.text }]} value={note} onChangeText={setNote} placeholder="What's this for?" placeholderTextColor={colors.textMuted} maxLength={100} />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Text style={styles.shareButtonIcon}>📤</Text>
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.downloadButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={manualRegenerate}>
                  <Text style={styles.downloadButtonIcon}>🔄</Text>
                  <Text style={[styles.downloadButtonText, { color: colors.text }]}>Refresh</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.features}>
                {[{ icon: '⚡', text: 'Instant' }, { icon: '🔒', text: 'Secure' }, { icon: '🌍', text: 'Global' }, { icon: '💸', text: 'Low Fees' }].map((f, i) => (
                  <View key={i} style={[styles.featureItem, { backgroundColor: colors.card }]}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === 'pay' && (
            <View style={styles.payContent}>
              <Text style={[styles.payTitle, { color: colors.text }]}>Pay Bills with QR</Text>
              <Text style={[styles.paySubtitle, { color: colors.textSecondary }]}>Scan merchant QR codes to pay for services worldwide</Text>
              <View style={styles.billCategories}>
                {[{ icon: '💡', label: 'Electricity', color: '#FFB020' }, { icon: '💧', label: 'Water', color: '#00C48C' }, { icon: '📺', label: 'TV/Cable', color: '#FF6B6B' }, { icon: '📶', label: 'Internet', color: '#0066FF' }, { icon: '🏠', label: 'Rent', color: '#9B59B6' }, { icon: '🏥', label: 'Healthcare', color: '#E74C3C' }, { icon: '🎓', label: 'Education', color: '#3498DB' }, { icon: '✈️', label: 'Travel', color: '#1ABC9C' }].map((cat, i) => (
                  <TouchableOpacity key={i} style={[styles.billCategory, { backgroundColor: colors.card }]}>
                    <View style={[styles.billCategoryIcon, { backgroundColor: cat.color + '20' }]}><Text style={styles.billCategoryEmoji}>{cat.icon}</Text></View>
                    <Text style={[styles.billCategoryLabel, { color: colors.text }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.internationalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.internationalHeader}>
                  <Text style={styles.internationalIcon}>🌍</Text>
                  <View>
                    <Text style={[styles.internationalTitle, { color: colors.text }]}>International Payments</Text>
                    <Text style={[styles.internationalDesc, { color: colors.textSecondary }]}>Pay bills in 100+ countries</Text>
                  </View>
                </View>
                <View style={styles.internationalFlags}>
                  {['🇺🇸', '🇬🇧', '🇪🇺', '🇨🇳', '🇮🇳', '🇦🇪', '🇳🇬', '🇿🇦'].map((flag, i) => <Text key={i} style={styles.internationalFlag}>{flag}</Text>)}
                  <Text style={[styles.moreCountries, { color: colors.primary }]}>+92</Text>
                </View>
              </View>
              <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Merchants</Text>
              <View style={styles.recentMerchants}>
                {[{ name: 'UEDCL', icon: '💡', amount: '45,000' }, { name: 'Water', icon: '💧', amount: '32,500' }, { name: 'DStv', icon: '📺', amount: '89,000' }].map((m, i) => (
                  <TouchableOpacity key={i} style={[styles.merchantItem, { backgroundColor: colors.card }]}>
                    <Text style={styles.merchantIcon}>{m.icon}</Text>
                    <View style={styles.merchantInfo}>
                      <Text style={[styles.merchantName, { color: colors.text }]}>{m.name}</Text>
                      <Text style={[styles.merchantAmount, { color: colors.textSecondary }]}>Last: UGX {m.amount}</Text>
                    </View>
                    <Text style={[styles.merchantArrow, { color: colors.primary }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showCurrencyPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}><Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={CURRENCIES} keyExtractor={(item) => item.code} renderItem={({ item }) => (
              <TouchableOpacity style={[styles.currencyItem, { backgroundColor: colors.card }]} onPress={() => { setSelectedCurrency(item); setShowCurrencyPicker(false); }}>
                <Text style={styles.currencyItemFlag}>{item.flag}</Text>
                <View style={styles.currencyItemInfo}>
                  <Text style={[styles.currencyItemCode, { color: colors.text }]}>{item.code}</Text>
                  <Text style={[styles.currencyItemName, { color: colors.textSecondary }]}>{item.name}</Text>
                </View>
                {selectedCurrency.code === item.code && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentTypes} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Type</Text>
              <TouchableOpacity onPress={() => setShowPaymentTypes(false)}><Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text></TouchableOpacity>
            </View>
            {PAYMENT_TYPES.map((type) => (
              <TouchableOpacity key={type.id} style={[styles.paymentTypeItem, { backgroundColor: colors.card }]} onPress={() => { setPaymentType(type.id); setShowPaymentTypes(false); }}>
                <Text style={styles.paymentTypeItemIcon}>{type.icon}</Text>
                <View style={styles.paymentTypeItemInfo}>
                  <Text style={[styles.paymentTypeItemLabel, { color: colors.text }]}>{type.label}</Text>
                  <Text style={[styles.paymentTypeItemDesc, { color: colors.textSecondary }]}>{type.desc}</Text>
                </View>
                {paymentType === type.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showExpiredAlert} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, { backgroundColor: colors.background }]}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Session Expired</Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>QR code has expired after 3 auto-refreshes. Tap below to generate a new one.</Text>
            <TouchableOpacity style={styles.alertButton} onPress={manualRegenerate}>
              <Text style={styles.alertButtonText}>Generate New QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 32, fontFamily: 'Montserrat_300Light' },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  helpButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  helpIcon: { fontSize: 20 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#0066FF' },
  tabIcon: { fontSize: 16 },
  tabText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#888' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  // Camera
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  scannerOverlay: { flex: 1 },
  scannerTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerMiddle: { flexDirection: 'row' },
  scannerSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerFrame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#0066FF', borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 3, backgroundColor: '#0066FF', borderRadius: 2 },
  scannerBottom: { flex: 1.5, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 30 },
  scannerHint: { color: '#fff', fontSize: 15, fontFamily: 'Montserrat_500Medium', marginBottom: 24 },
  cameraControls: { flexDirection: 'row', gap: 40, marginBottom: 20 },
  controlBtn: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  controlBtnActive: { backgroundColor: '#0066FF' },
  controlIcon: { fontSize: 24, marginBottom: 4 },
  controlText: { color: '#fff', fontSize: 12 },
  scanAgainBtn: { backgroundColor: '#0066FF', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  scanAgainText: { color: '#fff', fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  permissionIcon: { fontSize: 64, marginBottom: 16 },
  permissionTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  permissionText: { fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40 },
  permissionBtn: { backgroundColor: '#0066FF', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  scanContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // QR Card
  paymentTypeSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  paymentTypeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTypeIcon: { fontSize: 24 },
  paymentTypeLabel: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  paymentTypeDesc: { fontSize: 12, marginTop: 2 },
  dropdownArrow: { fontSize: 12 },
  qrCard: { marginBottom: 16 },
  qrGradient: { backgroundColor: '#0066FF', borderRadius: 24, padding: 20, alignItems: 'center' },
  qrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  qrHeaderText: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_700Bold', letterSpacing: 1 },
  timerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerBadgeWarning: { backgroundColor: '#FF4757' },
  timerText: { color: '#fff', fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
  qrCodeContainer: { marginVertical: 12 },
  qrCodeFrame: { width: 180, height: 180, backgroundColor: '#fff', borderRadius: 16, padding: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  qrLogoOverlay: { position: 'absolute', backgroundColor: '#0066FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  qrLogoText: { color: '#fff', fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  expiredOverlay: { width: 180, height: 180, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reloadButton: { alignItems: 'center', padding: 16 },
  reloadIcon: { fontSize: 40, marginBottom: 8 },
  reloadText: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  expiredText: { color: '#FF4757', fontSize: 12, marginTop: 8 },
  qrUserInfo: { alignItems: 'center', marginTop: 12 },
  qrUserName: { color: '#fff', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  qrUserPhone: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  qrAmountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  qrAmountText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  regenerationInfo: { marginTop: 12 },
  regenerationText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  // Inputs
  currencySelector: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  currencyFlag: { fontSize: 28, marginRight: 12 },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  currencyName: { fontSize: 12, marginTop: 2 },
  currencyArrow: { fontSize: 12 },
  amountCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  amountLabel: { fontSize: 13, marginBottom: 8 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 24, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontFamily: 'Montserrat_700Bold' },
  noteCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  noteLabel: { fontSize: 13, marginBottom: 8 },
  noteInput: { fontSize: 16 },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  shareButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0066FF', paddingVertical: 16, borderRadius: 14, gap: 8 },
  shareButtonIcon: { fontSize: 18 },
  shareButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  downloadButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  downloadButtonIcon: { fontSize: 18 },
  downloadButtonText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  features: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  featureItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  featureIcon: { fontSize: 20, marginBottom: 4 },
  featureText: { fontSize: 11 },
  // Pay Bills
  payContent: { paddingTop: 8 },
  payTitle: { fontSize: 22, fontFamily: 'Montserrat_700Bold', marginBottom: 4 },
  paySubtitle: { fontSize: 14, marginBottom: 20 },
  billCategories: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  billCategory: { width: '23%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  billCategoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  billCategoryEmoji: { fontSize: 22 },
  billCategoryLabel: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
  internationalSection: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  internationalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  internationalIcon: { fontSize: 32 },
  internationalTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  internationalDesc: { fontSize: 12, marginTop: 2 },
  internationalFlags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  internationalFlag: { fontSize: 24 },
  moreCountries: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  recentTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  recentMerchants: { marginBottom: 30 },
  merchantItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  merchantIcon: { fontSize: 28, marginRight: 14 },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  merchantAmount: { fontSize: 12, marginTop: 2 },
  merchantArrow: { fontSize: 24 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  modalClose: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold' },
  currencyItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  currencyItemFlag: { fontSize: 28, marginRight: 14 },
  currencyItemInfo: { flex: 1 },
  currencyItemCode: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  currencyItemName: { fontSize: 12, marginTop: 2 },
  checkmark: { fontSize: 18, color: '#0066FF', fontFamily: 'Montserrat_700Bold' },
  paymentTypeItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  paymentTypeItemIcon: { fontSize: 28, marginRight: 14 },
  paymentTypeItemInfo: { flex: 1 },
  paymentTypeItemLabel: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  paymentTypeItemDesc: { fontSize: 12, marginTop: 2 },
  // Alert Modal
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  alertBox: { borderRadius: 20, padding: 30, alignItems: 'center', width: '100%' },
  alertIcon: { fontSize: 50, marginBottom: 16 },
  alertTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  alertMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertButton: { backgroundColor: '#0066FF', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  alertButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
