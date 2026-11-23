import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// All African Countries
const COUNTRIES = [
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
];

type Step = 'loading' | 'phone' | 'verification' | 'success';

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('loading');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initial loading animation
  useEffect(() => {
    if (step === 'loading') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      const timeout = setTimeout(() => setStep('phone'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  // Countdown timer for resend
  useEffect(() => {
    if (step === 'verification' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  // Handle OTP input
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyOTP(newCode.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (phoneNumber.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;
      const result = await api.sendOTP(fullPhone);

      if (result.success) {
        setStep('verification');
        setTimer(45);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumber.replace(/^0+/, '')}`;
      const result = await api.verifyOTP(fullPhone, code);

      if (result.success && result.data) {
        setStep('success');
        // The API already stored tokens, just need to trigger navigation
        // The auth context will pick up the authenticated state
        setTimeout(() => {
          // Force refresh - tokens are already stored by api.verifyOTP
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as never }],
          });
        }, 1500);
      } else {
        setError(result.error || 'Invalid verification code');
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendCode = () => {
    if (!canResend) return;
    setVerificationCode(['', '', '', '', '', '']);
    setTimer(45);
    setCanResend(false);
    handleSendOTP();
  };

  // Loading Screen
  if (step === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🇺🇬</Text>
            <Text style={[styles.logoText, { color: colors.primary }]}>GMG Global</Text>
          </View>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('onboarding.personalizing')}</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Phone Input Screen
  if (step === 'phone') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backText, { color: colors.text }]}>←</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.enterPhone')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('onboarding.sendCode')}</Text>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('auth.phoneNumber')}</Text>
              <View style={styles.phoneInputRow}>
                <TouchableOpacity style={[styles.countrySelector, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={[styles.countryCode, { color: colors.text }]}>{selectedCountry.dialCode}</Text>
                  <Text style={[styles.dropdownArrow, { color: colors.textMuted }]}>▼</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.phoneInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="771 234 567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (phoneNumber.length < 9 || isLoading) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSendOTP}
              disabled={phoneNumber.length < 9 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{t('onboarding.continue')}</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: colors.textMuted }]}>
              {t('onboarding.termsAgree')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Verification Screen
  if (step === 'verification') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setStep('phone')}
            >
              <Text style={[styles.backText, { color: colors.text }]}>←</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.verifyCode')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('onboarding.codeSent')}{'\n'}
              <Text style={[styles.phoneHighlight, { color: colors.primary }]}>
                {selectedCountry.dialCode} {phoneNumber}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  style={[
                    styles.otpInput,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text },
                    digit && [styles.otpInputFilled, { borderColor: colors.primary, backgroundColor: colors.card }],
                    error && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.verifyLoader} />
            )}

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={!canResend}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, { color: colors.textMuted }, canResend && [styles.resendTextActive, { color: colors.primary }]]}>
                {canResend 
                  ? t('onboarding.resendCode')
                  : `${t('onboarding.resendCode')} (00:${timer.toString().padStart(2, '0')})`
                }
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Success Screen
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.card }]}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{t('onboarding.welcome')}</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>{t('onboarding.accountReady')}</Text>
          <ActivityIndicator size="small" color={colors.primary} style={styles.successLoader} />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#7C3AED',
  },
  loader: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#374151',
    fontFamily: 'Montserrat_500Medium',
  },
  // Navigation
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: -8,
  },
  backText: {
    fontSize: 28,
    color: '#374151',
  },
  // Typography
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 32,
    lineHeight: 24,
  },
  phoneHighlight: {
    color: '#7C3AED',
    fontFamily: 'Montserrat_600SemiBold',
  },
  // Phone Input
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#CCCCCC',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 18,
    color: '#111827',
  },
  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 52,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
  },
  otpInputFilled: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  // Buttons
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Montserrat_500Medium',
  },
  resendTextActive: {
    color: '#7C3AED',
  },
  // Error
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  errorTextCenter: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  // Terms
  termsText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Verify Loader
  verifyLoader: {
    marginBottom: 16,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  successLoader: {
    marginTop: 16,
  },
});
