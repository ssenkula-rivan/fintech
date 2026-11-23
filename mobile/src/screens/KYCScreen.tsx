// GMG Global - KYC Verification Screen
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { requestKYCPermissions } from '../utils/permissions';
import { useTheme } from '../context/ThemeContext';

type KYCStep = 'overview' | 'personal' | 'documents' | 'selfie' | 'review';

interface KYCData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  district: string;
  idFront: string | null;
  idBack: string | null;
  selfie: string | null;
}

const TIERS = [
  {
    tier: 1, name: 'Basic', color: '#f59e0b', icon: '📱',
    desc: 'Phone verification only',
    dailySend: '500,000', dailyReceive: '1,000,000', maxBalance: '2,000,000'
  },
  {
    tier: 2, name: 'Verified', color: '#3b82f6', icon: '🪪',
    desc: 'National ID + Selfie required',
    dailySend: '5,000,000', dailyReceive: '10,000,000', maxBalance: '20,000,000'
  },
  {
    tier: 3, name: 'Premium', color: '#10b981', icon: '⭐',
    desc: 'Full verification + Proof of address',
    dailySend: '50,000,000', dailyReceive: 'Unlimited', maxBalance: 'Unlimited'
  },
];

export default function KYCScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  const [step, setStep] = useState<KYCStep>(route.params?.startKYC ? 'personal' : 'overview');
  const [targetTier, setTargetTier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  
  const [kycData, setKycData] = useState<KYCData>({
    fullName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    district: '',
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const currentTier = user?.kycTier || 1;
  const progress = currentTier === 1 ? 25 : currentTier === 2 ? 66 : 100;

  const updateField = (field: keyof KYCData, value: string) => {
    setKycData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async (type: 'idFront' | 'idBack' | 'selfie') => {
    const { camera, photos } = await requestKYCPermissions();
    if (!camera && !photos) {
      Alert.alert('Permission needed', 'Camera or photo library access is required for KYC verification');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setKycData(prev => ({ ...prev, [type]: base64 }));
    }
  };

  const validatePersonal = (): boolean => {
    const { fullName, dateOfBirth, gender, nationalId, district } = kycData;
    if (!fullName || fullName.length < 3) {
      Alert.alert('Error', 'Enter your full name'); return false;
    }
    if (!dateOfBirth) {
      Alert.alert('Error', 'Enter date of birth'); return false;
    }
    if (!gender) {
      Alert.alert('Error', 'Select gender'); return false;
    }
    if (!nationalId || nationalId.length !== 14) {
      Alert.alert('Error', 'Enter valid 14-character National ID'); return false;
    }
    if (!district) {
      Alert.alert('Error', 'Enter your district'); return false;
    }
    return true;
  };

  const validateDocuments = (): boolean => {
    if (!kycData.idFront || !kycData.idBack) {
      Alert.alert('Error', 'Upload both sides of your ID'); return false;
    }
    return true;
  };

  const validateSelfie = (): boolean => {
    if (!kycData.selfie) {
      Alert.alert('Error', 'Take a selfie'); return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 'personal' && validatePersonal()) setStep('documents');
    else if (step === 'documents' && validateDocuments()) setStep('selfie');
    else if (step === 'selfie' && validateSelfie()) setStep('review');
  };

  const goBack = () => {
    if (step === 'personal') setStep('overview');
    else if (step === 'documents') setStep('personal');
    else if (step === 'selfie') setStep('documents');
    else if (step === 'review') setStep('selfie');
  };

  const startUpgrade = (tier: number) => {
    setTargetTier(tier);
    setStep('personal');
  };

  const submitKYC = async () => {
    if (!consent) {
      Alert.alert('Error', 'Please confirm the consent checkbox');
      return;
    }
    setLoading(true);
    try {
      const result = await api.submitKYC({
        tier: targetTier,
        personalInfo: {
          fullName: kycData.fullName,
          dateOfBirth: kycData.dateOfBirth,
          gender: kycData.gender,
          nationalId: kycData.nationalId,
          district: kycData.district,
        },
        documents: {
          idFront: kycData.idFront,
          idBack: kycData.idBack,
          selfie: kycData.selfie,
        },
      });

      if (result.success) {
        await refreshUser();
        Alert.alert(
          '✅ KYC Submitted!',
          'We\'ll review your documents and notify you within 24-48 hours.',
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'Submission failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'personal': return 1;
      case 'documents': return 2;
      case 'selfie': return 3;
      case 'review': return 4;
      default: return 0;
    }
  };

  // Overview Screen
  if (step === 'overview') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('kyc.title') || 'Identity Verification'}</Text>
            <Text style={styles.headerSubtitle}>Increase your limits by verifying your identity</Text>
          </View>

          {/* Current Status */}
          <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Current KYC Level</Text>
                <View style={[styles.tierBadge, { backgroundColor: TIERS[currentTier - 1]?.color || '#f59e0b' }]}>
                  <Text style={styles.tierBadgeText}>TIER {currentTier} - {TIERS[currentTier - 1]?.name}</Text>
                </View>
              </View>
              <Text style={styles.statusIcon}>📋</Text>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Verification Progress</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>

          {/* Tier Cards */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>KYC Tiers & Limits</Text>
          {TIERS.map((tier) => (
            <View key={tier.tier} style={[styles.tierCard, { borderColor: tier.color, backgroundColor: colors.card }]}>
              <View style={styles.tierHeader}>
                <View>
                  <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.tierBadgeText}>TIER {tier.tier} - {tier.name}</Text>
                  </View>
                  <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>{tier.desc}</Text>
                </View>
                <Text style={styles.tierIcon}>{tier.icon}</Text>
              </View>
              <View style={styles.limitsGrid}>
                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Daily Send:</Text>
                  <Text style={[styles.limitValue, { color: colors.text }]}>UGX {tier.dailySend}</Text>
                </View>
                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Daily Receive:</Text>
                  <Text style={[styles.limitValue, { color: colors.text }]}>{tier.dailyReceive === 'Unlimited' ? tier.dailyReceive : `UGX ${tier.dailyReceive}`}</Text>
                </View>
                <View style={styles.limitRow}>
                  <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Max Balance:</Text>
                  <Text style={[styles.limitValue, { color: colors.text }]}>{tier.maxBalance === 'Unlimited' ? tier.maxBalance : `UGX ${tier.maxBalance}`}</Text>
                </View>
              </View>
              {tier.tier > currentTier && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: tier.color }]}
                  onPress={() => startUpgrade(tier.tier)}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade to Tier {tier.tier} →</Text>
                </TouchableOpacity>
              )}
              {tier.tier === currentTier && (
                <View style={[styles.currentBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={styles.currentBadgeText}>✓ Current Level</Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // KYC Flow Steps
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <Text style={styles.headerSubtitle}>Upgrading to Tier {targetTier}</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {['Personal', 'ID Upload', 'Selfie', 'Review'].map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: colors.surfaceVariant },
                getStepNumber() > i && styles.stepCompleted,
                getStepNumber() === i + 1 && styles.stepActive
              ]}>
                <Text style={[
                  styles.stepNumber,
                  { color: colors.textMuted },
                  (getStepNumber() > i || getStepNumber() === i + 1) && styles.stepNumberActive
                ]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{label}</Text>
              {i < 3 && <View style={[styles.stepLine, { backgroundColor: colors.border }, getStepNumber() > i + 1 && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        {/* Step Content */}
        <View style={[styles.stepContent, { backgroundColor: colors.card }]}>
          {step === 'personal' && (
            <>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Personal Information</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Full Legal Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                  placeholder="As per National ID"
                  placeholderTextColor={colors.textMuted}
                  value={kycData.fullName}
                  onChangeText={(v) => updateField('fullName', v)}
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={kycData.dateOfBirth}
                    onChangeText={(v) => updateField('dateOfBirth', v)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Gender *</Text>
                  <View style={styles.genderRow}>
                    {['M', 'F'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderBtn, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }, kycData.gender === g && styles.genderBtnActive]}
                        onPress={() => updateField('gender', g)}
                      >
                        <Text style={[styles.genderText, { color: colors.textSecondary }, kycData.gender === g && styles.genderTextActive]}>
                          {g === 'M' ? 'Male' : 'Female'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>National ID Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                  placeholder="CM12345678910XYZ"
                  placeholderTextColor={colors.textMuted}
                  value={kycData.nationalId}
                  onChangeText={(v) => updateField('nationalId', v.toUpperCase())}
                  maxLength={14}
                  autoCapitalize="characters"
                />
                <Text style={[styles.inputHint, { color: colors.textMuted }]}>14-character Ugandan National ID</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>District *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                  placeholder="e.g., Kampala"
                  placeholderTextColor={colors.textMuted}
                  value={kycData.district}
                  onChangeText={(v) => updateField('district', v)}
                />
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                <Text style={styles.primaryBtnText}>Continue to ID Upload →</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'documents' && (
            <>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Upload ID Document</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Upload clear photos of your National ID</Text>
              
              <Text style={[styles.uploadLabel, { color: colors.text }]}>ID Card - Front Side *</Text>
              <TouchableOpacity style={[styles.uploadZone, { backgroundColor: colors.inputBackground, borderColor: colors.border }]} onPress={() => pickImage('idFront')}>
                {kycData.idFront ? (
                  <Image source={{ uri: kycData.idFront }} style={styles.previewImage} />
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={[styles.uploadText, { color: colors.text }]}>Tap to take photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.uploadLabel, { color: colors.text }]}>ID Card - Back Side *</Text>
              <TouchableOpacity style={[styles.uploadZone, { backgroundColor: colors.inputBackground, borderColor: colors.border }]} onPress={() => pickImage('idBack')}>
                {kycData.idBack ? (
                  <Image source={{ uri: kycData.idBack }} style={styles.previewImage} />
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={[styles.uploadText, { color: colors.text }]}>Tap to take photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surfaceVariant }]} onPress={goBack}>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                  <Text style={styles.primaryBtnText}>Continue →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'selfie' && (
            <>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Take a Selfie</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Take a clear selfie holding your National ID</Text>
              
              <TouchableOpacity style={[styles.uploadZoneLarge, { backgroundColor: colors.inputBackground, borderColor: colors.border }]} onPress={() => pickImage('selfie')}>
                {kycData.selfie ? (
                  <Image source={{ uri: kycData.selfie }} style={styles.selfiePreview} />
                ) : (
                  <>
                    <Text style={styles.uploadIconLarge}>🤳</Text>
                    <Text style={[styles.uploadText, { color: colors.text }]}>Tap to take selfie</Text>
                    <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>Hold your ID next to your face</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surfaceVariant }]} onPress={goBack}>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                  <Text style={styles.primaryBtnText}>Review →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'review' && (
            <>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Review & Submit</Text>
              <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Verify all details are correct</Text>
              
              <View style={[styles.reviewCard, { backgroundColor: colors.inputBackground }]}>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Full Name:</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{kycData.fullName}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Date of Birth:</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{kycData.dateOfBirth}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>National ID:</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{kycData.nationalId}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>District:</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{kycData.district}</Text>
                </View>
              </View>

              <View style={styles.imageGrid}>
                <View style={styles.imageThumb}>
                  {kycData.idFront && <Image source={{ uri: kycData.idFront }} style={[styles.thumbImage, { backgroundColor: colors.surfaceVariant }]} />}
                  <Text style={[styles.thumbLabel, { color: colors.textSecondary }]}>ID Front</Text>
                </View>
                <View style={styles.imageThumb}>
                  {kycData.idBack && <Image source={{ uri: kycData.idBack }} style={[styles.thumbImage, { backgroundColor: colors.surfaceVariant }]} />}
                  <Text style={[styles.thumbLabel, { color: colors.textSecondary }]}>ID Back</Text>
                </View>
                <View style={styles.imageThumb}>
                  {kycData.selfie && <Image source={{ uri: kycData.selfie }} style={[styles.thumbImage, { backgroundColor: colors.surfaceVariant }]} />}
                  <Text style={[styles.thumbLabel, { color: colors.textSecondary }]}>Selfie</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(!consent)}>
                <View style={[styles.checkbox, { borderColor: colors.border }, consent && styles.checkboxActive]}>
                  {consent && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.consentText, { color: colors.textSecondary }]}>
                  I confirm all information is accurate and consent to identity verification.
                </Text>
              </TouchableOpacity>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surfaceVariant }]} onPress={goBack}>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, !consent && styles.submitBtnDisabled]}
                  onPress={submitKYC}
                  disabled={!consent || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
  
  statusCard: { margin: 16, borderRadius: 20, padding: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  statusIcon: { fontSize: 48 },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  tierBadgeText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  progressSection: { marginTop: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#888', fontSize: 14 },
  progressValue: { fontFamily: 'Montserrat_600SemiBold' },
  progressBar: { height: 8, backgroundColor: '#333', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#0066FF', borderRadius: 4 },
  
  sectionTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginHorizontal: 16, marginTop: 24, marginBottom: 16 },
  
  tierCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20, borderWidth: 2 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  tierDesc: { color: '#888', fontSize: 13, marginTop: 8 },
  tierIcon: { fontSize: 32 },
  limitsGrid: { gap: 8 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  limitLabel: { color: '#888', fontSize: 14 },
  limitValue: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },
  upgradeBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  currentBadge: { marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#333' },
  currentBadgeText: { color: '#10b981', fontFamily: 'Montserrat_600SemiBold' },
  
  stepIndicator: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 24 },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  stepActive: { backgroundColor: '#0066FF' },
  stepCompleted: { backgroundColor: '#10b981' },
  stepNumber: { color: '#888', fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  stepNumberActive: { color: '#FFFFFF' },
  stepLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  stepLine: { position: 'absolute', top: 18, left: '60%', right: '-40%', height: 2, backgroundColor: '#333', zIndex: -1 },
  stepLineActive: { backgroundColor: '#10b981' },
  
  stepContent: { marginHorizontal: 16, borderRadius: 20, padding: 20 },
  stepTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  stepSubtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontFamily: 'Montserrat_500Medium', marginBottom: 8 },
  input: { backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#374151' },
  inputHint: { color: '#666', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, backgroundColor: '#2a2a2a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  genderBtnActive: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  genderText: { color: '#888', fontFamily: 'Montserrat_500Medium' },
  genderTextActive: { color: '#FFFFFF' },
  
  uploadLabel: { fontSize: 14, fontFamily: 'Montserrat_500Medium', marginBottom: 12, marginTop: 8 },
  uploadZone: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: '#374151', borderStyle: 'dashed', marginBottom: 16 },
  uploadZoneLarge: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 48, alignItems: 'center', borderWidth: 2, borderColor: '#374151', borderStyle: 'dashed', marginBottom: 24 },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadIconLarge: { fontSize: 64, marginBottom: 16 },
  uploadText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  uploadHint: { color: '#888', fontSize: 13, marginTop: 8 },
  previewImage: { width: '100%', height: 180, borderRadius: 12 },
  selfiePreview: { width: 200, height: 200, borderRadius: 100 },
  
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  primaryBtn: { flex: 1, backgroundColor: '#0066FF', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  secondaryBtn: { flex: 1, backgroundColor: '#2a2a2a', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  submitBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#333' },
  submitBtnText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },
  
  reviewCard: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 16, marginBottom: 20 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  reviewLabel: { color: '#888', fontSize: 14 },
  reviewValue: { fontFamily: 'Montserrat_500Medium', fontSize: 14 },
  
  imageGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  imageThumb: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  thumbImage: { width: '100%', height: 70, borderRadius: 8, backgroundColor: '#333' },
  thumbLabel: { color: '#888', fontSize: 11, marginTop: 6 },
  
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#444', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  checkmark: { color: '#FFFFFF', fontFamily: 'Montserrat_700Bold' },
  consentText: { flex: 1, color: '#888', fontSize: 14, lineHeight: 20 },
});
