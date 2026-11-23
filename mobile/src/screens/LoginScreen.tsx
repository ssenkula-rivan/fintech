// GMG Global Mobile App - Login Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import GlitchText from '../components/GlitchText';
import ENV from '../config/environment';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = ENV.webClientId;
const GOOGLE_ANDROID_CLIENT_ID = ENV.androidClientId;
const GOOGLE_IOS_CLIENT_ID = ENV.iosClientId;

const ALL_COUNTRIES = [
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256', continent: 'Africa' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', continent: 'Africa' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', continent: 'Africa' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250', continent: 'Africa' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', continent: 'Africa' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', continent: 'Africa' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', continent: 'Africa' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', continent: 'Africa' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', continent: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', continent: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', continent: 'Europe' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', continent: 'Americas' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', continent: 'Americas' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', continent: 'Asia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', continent: 'Asia' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', continent: 'Asia' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', continent: 'Oceania' },
];

type Step = 'phone' | 'otp' | 'google_phone' | 'google_otp' | 'apple_phone' | 'apple_otp';

interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

interface AppleUserData {
  email: string;
  name: string;
  appleId: string;
}

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { login, googleLogin, appleLogin, devLogin } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(ALL_COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<GoogleUserData | null>(null);
  const [appleUserData, setAppleUserData] = useState<AppleUserData | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    const checkAppleAvailability = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    };
    checkAppleAvailability();
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_ANDROID_CLIENT_ID ? { androidClientId: GOOGLE_ANDROID_CLIENT_ID } : {}),
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) handleGoogleIdToken(idToken);
    }
  }, [response]);

  const filteredCountries = countrySearch
    ? ALL_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dialCode.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : ALL_COUNTRIES;

  const decodeIdToken = (token: string) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const handleGoogleIdToken = async (idToken: string) => {
    setLoading(true);
    try {
      const userInfo = decodeIdToken(idToken);
      if (!userInfo || !userInfo.email) {
        Alert.alert('Error', 'Failed to get user info from Google');
        setLoading(false);
        return;
      }
      setGoogleUserData({
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        picture: userInfo.picture,
        googleId: userInfo.sub,
      });
      setStep('google_phone');
      setPhone('');
      setOtp('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const email = credential.email || `apple_${credential.user}@privaterelay.appleid.com`;
      const name = credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
        : email.split('@')[0];
      setAppleUserData({ email, name, appleId: credential.user });
      setStep('apple_phone');
      setPhone('');
      setOtp('');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', error.message || 'Apple sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleWebSignIn = async () => {
    Alert.alert(
      'Apple Account Access',
      'If you created your account with Apple Sign In on iPhone, you can access it using the same phone number you verified.',
      [{ text: 'OK' }]
    );
  };

  const handleSendOTP = async () => {
    if (phone.length < 7) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    const fullPhone = `${selectedCountry.dialCode}${phone.replace(/^0+/, '')}`;
    const isGoogleFlow = step === 'google_phone';
    const isAppleFlow = step === 'apple_phone';
    const isSocialFlow = isGoogleFlow || isAppleFlow;
    const channel = isSocialFlow ? 'whatsapp' : 'sms';
    const result = await api.sendOTP(fullPhone, channel);
    setLoading(false);
    if (result.success) {
      if (isGoogleFlow) setStep('google_otp');
      else if (isAppleFlow) setStep('apple_otp');
      else setStep('otp');
      startCountdown(60);
      Alert.alert('OTP Sent', `Check your ${isSocialFlow ? 'WhatsApp' : 'SMS'} for the code`);
    } else {
      Alert.alert('Failed', result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    const fullPhone = `${selectedCountry.dialCode}${phone.replace(/^0+/, '')}`;
    let result;
    if (step === 'google_otp' && googleUserData) {
      result = await api.googleSignInWithPhone({ ...googleUserData, phone: fullPhone, otp });
      if (result.success && result.data) await googleLogin(googleUserData);
    } else if (step === 'apple_otp' && appleUserData) {
      result = await api.appleSignInWithPhone({ ...appleUserData, phone: fullPhone, otp });
      if (result.success && result.data) await appleLogin(appleUserData);
    } else {
      result = await login(fullPhone, otp);
    }
    setLoading(false);
    if (result.success) {
      Alert.alert('Welcome!', 'Login successful');
    } else {
      Alert.alert('Verification Failed', result.error || 'Please check your OTP and try again');
    }
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCountrySelect = (country: typeof ALL_COUNTRIES[0]) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    setCountrySearch('');
  };

  const handleDevLogin = () => {
    if (__DEV__ && devLogin) devLogin();
  };

  const isPhoneStep = step === 'phone' || step === 'google_phone' || step === 'apple_phone';
  const isGoogleFlow = step === 'google_phone' || step === 'google_otp';
  const isAppleFlow = step === 'apple_phone' || step === 'apple_otp';
  const isSocialFlow = isGoogleFlow || isAppleFlow;

  return (
    <ImageBackground 
      source={require('../../assets/LOD.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/SVGs 1-01.png')} style={styles.logoImage} resizeMode="contain" />
            <GlitchText text="Global Mobile Gateway" style={[styles.logo, { color: '#1A1A2E' }]} intensity="medium" />
            <Text style={[styles.logoSubtitle, { color: '#1A1A2E' }]}>Mobile Money & Financial Services</Text>
          </View>

          {/* Google User Info Banner */}
          {isGoogleFlow && googleUserData && (
            <View style={[styles.userBanner, { backgroundColor: '#10B981' }]}>
              <Text style={styles.userBannerIcon}>✓</Text>
              <View style={styles.userBannerInfo}>
                <Text style={styles.userBannerName}>{googleUserData.name}</Text>
                <Text style={styles.userBannerEmail}>{googleUserData.email}</Text>
              </View>
            </View>
          )}

          {/* Apple User Info Banner */}
          {isAppleFlow && appleUserData && (
            <View style={[styles.userBanner, { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E8ECF0' }]}>
              <Text style={[styles.userBannerIcon, { color: '#1A1A2E' }]}></Text>
              <View style={styles.userBannerInfo}>
                <Text style={[styles.userBannerName, { color: '#1A1A2E' }]}>{appleUserData.name}</Text>
                <Text style={[styles.userBannerEmail, { color: '#6B7280' }]}>{appleUserData.email}</Text>
              </View>
            </View>
          )}

          <Text style={[styles.title, { color: '#1A1A2E' }]}>
            {step === 'phone' && 'Welcome'}
            {step === 'otp' && 'Enter OTP'}
            {step === 'google_phone' && 'Verify Your Phone'}
            {step === 'google_otp' && 'WhatsApp OTP'}
            {step === 'apple_phone' && 'Verify Your Phone'}
            {step === 'apple_otp' && 'WhatsApp OTP'}
          </Text>
          <Text style={[styles.subtitle, { color: '#1A1A2E' }]}>
            {step === 'phone' && 'Sign in with your phone number'}
            {step === 'otp' && `We sent a 6-digit code via SMS to ${selectedCountry.dialCode} ${phone}`}
            {step === 'google_phone' && 'Enter your phone number to complete registration'}
            {step === 'google_otp' && `We sent a 6-digit code via WhatsApp to ${selectedCountry.dialCode} ${phone}`}
            {step === 'apple_phone' && 'Enter your phone number to complete registration'}
            {step === 'apple_otp' && `We sent a 6-digit code via WhatsApp to ${selectedCountry.dialCode} ${phone}`}
          </Text>

          {isPhoneStep ? (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: '#1A1A2E' }]}>Phone Number</Text>
              <View style={[styles.phoneInput, { backgroundColor: '#FFFFFF', borderColor: '#E8ECF0' }]}>
                <TouchableOpacity
                  style={[styles.countrySelector, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={[styles.countryCode, { color: '#1A1A2E' }]}>{selectedCountry.dialCode}</Text>
                  <Text style={[styles.dropdownArrow, { color: '#6B7280' }]}>▼</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { backgroundColor: '#FFFFFF', color: '#1A1A2E' }]}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={15}
                />
              </View>
              {isSocialFlow && (
                <Text style={[styles.whatsappNote, { color: '#1A1A2E' }]}>📱 OTP will be sent to your WhatsApp</Text>
              )}
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: '#1A1A2E' }]}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: '#FFFFFF', borderColor: '#E8ECF0', color: '#1A1A2E' }]}
                placeholder="• • • • • •"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                autoFocus={true}
              />
              {countdown > 0 ? (
                <Text style={[styles.countdown, { color: '#1A1A2E' }]}>Resend code in {countdown}s</Text>
              ) : (
                <TouchableOpacity onPress={handleSendOTP}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (loading || (isPhoneStep && !termsAccepted)) && styles.buttonDisabled]}
            onPress={isPhoneStep ? handleSendOTP : handleVerifyOTP}
            disabled={loading || (isPhoneStep && !termsAccepted)}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.buttonText}>{isPhoneStep ? 'Send OTP' : 'Verify & Login'}</Text>
            )}
          </TouchableOpacity>

          {(step === 'otp' || step === 'google_otp' || step === 'apple_otp') && (
            <TouchableOpacity
              onPress={() => {
                if (isGoogleFlow) setStep('google_phone');
                else if (isAppleFlow) setStep('apple_phone');
                else setStep('phone');
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Change Number</Text>
            </TouchableOpacity>
          )}

          {/* Terms Checkbox - Only on phone steps */}
          {isPhoneStep && (
            <TouchableOpacity style={styles.termsContainer} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7}>
              <View style={[styles.checkbox, { borderColor: termsAccepted ? '#0066FF' : '#E8ECF0' }, termsAccepted && { backgroundColor: '#0066FF' }]}>
                {termsAccepted && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={[styles.termsText, { color: '#1A1A2E' }]}>
                I agree to the <Text style={[styles.termsLink, { color: '#0066FF' }]}>Terms of Service</Text> and <Text style={[styles.termsLink, { color: '#0066FF' }]}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* SOCIAL LOGIN BUTTONS - Google and Apple */}
          {step === 'phone' && (
            <View style={styles.socialContainer}>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: '#1A1A2E' }]} />
                <Text style={[styles.dividerText, { color: '#1A1A2E' }]}>or continue with</Text>
                <View style={[styles.dividerLine, { backgroundColor: '#1A1A2E' }]} />
              </View>

              <View style={styles.socialButtonsRow}>
                {/* Google Sign-In */}
                <TouchableOpacity
                  style={[styles.socialIconButton, { backgroundColor: '#fff', borderColor: '#E8ECF0' }, (!request || loading) && styles.socialButtonDisabled]}
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                >
                  <Image source={require('../../assets/search_281764.png')} style={styles.socialIcon} resizeMode="contain" />
                </TouchableOpacity>

                {/* Apple Sign-In - Always show */}
                <TouchableOpacity
                  style={[styles.socialIconButton, { backgroundColor: '#fff', borderColor: '#E8ECF0' }, loading && styles.socialButtonDisabled]}
                  onPress={Platform.OS === 'ios' && isAppleAvailable ? handleAppleSignIn : handleAppleWebSignIn}
                  disabled={loading}
                >
                  <Image source={require('../../assets/apple_152752.png')} style={[styles.socialIcon, { tintColor: '#000' }]} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* DEV MODE BYPASS */}
          {__DEV__ && step === 'phone' && (
            <TouchableOpacity style={[styles.devButton, { backgroundColor: '#FFFFFF' }]} onPress={handleDevLogin}>
              <Text style={[styles.devButtonText, { color: '#1A1A2E' }]}>🔧 Dev Mode - Skip Login</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: '#E8ECF0' }]}>
              <Text style={[styles.modalTitle, { color: '#1A1A2E' }]}>Select Country</Text>
              <TouchableOpacity onPress={() => { setShowCountryModal(false); setCountrySearch(''); }}>
                <Text style={[styles.modalClose, { color: '#6B7280' }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchContainer, { borderBottomColor: '#E8ECF0' }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: '#F5F7FA', color: '#1A1A2E' }]}
                placeholder="Search country or dial code..."
                placeholderTextColor="#9CA3AF"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { borderBottomColor: '#E8ECF0' }, selectedCountry.code === item.code && { backgroundColor: '#F5F7FA' }]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={[styles.countryItemName, { color: '#1A1A2E' }]}>{item.name}</Text>
                    <Text style={[styles.countryItemDialCode, { color: '#6B7280' }]}>{item.dialCode}</Text>
                  </View>
                  {selectedCountry.code === item.code && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={[styles.emptySearchText, { color: '#9CA3AF' }]}>No countries found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ImageBackground>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// iPhone SE, iPhone 8: ~667px, iPhone 12 mini: ~780px, iPhone 14: ~844px, iPhone 14 Pro Max: ~932px
const isVerySmallScreen = screenHeight < 670; // iPhone SE, iPhone 8
const isSmallScreen = screenHeight < 750; // iPhone 12 mini and smaller
const isMediumScreen = screenHeight >= 750 && screenHeight < 850;

// Dynamic scaling based on screen height
const scale = (size: number) => {
  if (isVerySmallScreen) return size * 0.75;
  if (isSmallScreen) return size * 0.85;
  return size;
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: isVerySmallScreen ? 14 : isSmallScreen ? 18 : 24, 
    paddingTop: isVerySmallScreen ? 8 : isSmallScreen ? 12 : 20,
    paddingBottom: 20, 
    flexGrow: 1 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: isVerySmallScreen ? 10 : isSmallScreen ? 16 : 28, 
    marginTop: isVerySmallScreen ? 4 : isSmallScreen ? 8 : 16 
  },
  logoImage: { 
    width: isVerySmallScreen ? 55 : isSmallScreen ? 70 : 100, 
    height: isVerySmallScreen ? 55 : isSmallScreen ? 70 : 100, 
    marginBottom: 4 
  },
  logo: { 
    fontSize: isVerySmallScreen ? 18 : isSmallScreen ? 22 : 28, 
    fontFamily: 'Montserrat_700Bold', 
    textAlign: 'center' 
  },
  logoSubtitle: { 
    fontSize: isVerySmallScreen ? 10 : isSmallScreen ? 12 : 14, 
    fontFamily: 'Montserrat_400Regular', 
    marginTop: 2 
  },
  userBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: isVerySmallScreen ? 8 : 12, marginBottom: isVerySmallScreen ? 12 : 20 },
  userBannerIcon: { fontSize: isVerySmallScreen ? 16 : 20, color: '#fff', marginRight: isVerySmallScreen ? 8 : 12, fontFamily: 'Montserrat_700Bold' },
  userBannerInfo: { flex: 1 },
  userBannerName: { color: '#fff', fontSize: isVerySmallScreen ? 14 : 16, fontFamily: 'Montserrat_600SemiBold' },
  userBannerEmail: { color: 'rgba(255,255,255,0.8)', fontSize: isVerySmallScreen ? 10 : 12 },
  title: { 
    fontSize: isVerySmallScreen ? 18 : isSmallScreen ? 22 : 28, 
    fontFamily: 'Montserrat_700Bold', 
    marginBottom: isVerySmallScreen ? 4 : 6 
  },
  subtitle: { 
    fontSize: isVerySmallScreen ? 12 : isSmallScreen ? 14 : 16, 
    fontFamily: 'Montserrat_400Regular', 
    marginBottom: isVerySmallScreen ? 14 : isSmallScreen ? 20 : 32, 
    lineHeight: isVerySmallScreen ? 16 : isSmallScreen ? 18 : 22 
  },
  inputContainer: { marginBottom: isVerySmallScreen ? 12 : isSmallScreen ? 16 : 24 },
  inputLabel: { 
    fontSize: isVerySmallScreen ? 11 : isSmallScreen ? 12 : 14, 
    fontFamily: 'Montserrat_500Medium', 
    marginBottom: isVerySmallScreen ? 4 : 6 
  },
  phoneInput: { flexDirection: 'row', alignItems: 'center' },
  countrySelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: isVerySmallScreen ? 8 : 10, 
    paddingVertical: isVerySmallScreen ? 10 : isSmallScreen ? 12 : 16, 
    borderRadius: 12, 
    marginRight: 8 
  },
  countryFlag: { fontSize: isVerySmallScreen ? 14 : isSmallScreen ? 16 : 18, marginRight: 4 },
  countryCode: { fontSize: isVerySmallScreen ? 12 : isSmallScreen ? 14 : 16, fontFamily: 'Montserrat_600SemiBold' },
  dropdownArrow: { fontSize: isVerySmallScreen ? 8 : 10, marginLeft: 3 },
  input: { 
    flex: 1, 
    borderRadius: 12, 
    paddingHorizontal: isVerySmallScreen ? 10 : 14, 
    paddingVertical: isVerySmallScreen ? 10 : isSmallScreen ? 12 : 16, 
    fontSize: isVerySmallScreen ? 14 : isSmallScreen ? 16 : 18, 
    fontFamily: 'Montserrat_400Regular' 
  },
  otpInput: { textAlign: 'center', letterSpacing: isVerySmallScreen ? 4 : 6, fontSize: isVerySmallScreen ? 18 : isSmallScreen ? 20 : 24 },
  whatsappNote: { color: '#10B981', fontSize: isVerySmallScreen ? 11 : 13, fontFamily: 'Montserrat_500Medium', marginTop: isVerySmallScreen ? 6 : 8 },
  countdown: { marginTop: isVerySmallScreen ? 8 : 12, textAlign: 'center', fontSize: isVerySmallScreen ? 12 : 14 },
  resendLink: { color: '#0066FF', fontFamily: 'Montserrat_600SemiBold', marginTop: isVerySmallScreen ? 8 : 12, textAlign: 'center', fontSize: isVerySmallScreen ? 13 : 14 },
  button: { 
    backgroundColor: '#0066FF', 
    borderRadius: 12, 
    paddingVertical: isVerySmallScreen ? 10 : isSmallScreen ? 12 : 16, 
    alignItems: 'center', 
    marginTop: isVerySmallScreen ? 8 : isSmallScreen ? 12 : 16 
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: isVerySmallScreen ? 14 : isSmallScreen ? 16 : 18, fontFamily: 'Montserrat_600SemiBold' },
  backButton: { marginTop: isVerySmallScreen ? 12 : isSmallScreen ? 16 : 24, alignItems: 'center' },
  backButtonText: { color: '#0066FF', fontSize: isVerySmallScreen ? 14 : 16 },
  termsContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginTop: isVerySmallScreen ? 12 : isSmallScreen ? 16 : 24, 
    paddingHorizontal: 4 
  },
  checkbox: { 
    width: isVerySmallScreen ? 18 : 20, 
    height: isVerySmallScreen ? 18 : 20, 
    borderRadius: 6, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: isVerySmallScreen ? 8 : 10, 
    marginTop: 2 
  },
  checkboxTick: { color: '#fff', fontSize: isVerySmallScreen ? 10 : 12, fontFamily: 'Montserrat_700Bold' },
  termsText: { 
    flex: 1, 
    fontSize: isVerySmallScreen ? 10 : isSmallScreen ? 11 : 13, 
    lineHeight: isVerySmallScreen ? 14 : isSmallScreen ? 16 : 20, 
    fontFamily: 'Montserrat_400Regular' 
  },
  termsLink: { fontFamily: 'Montserrat_600SemiBold' },
  socialContainer: { marginTop: isVerySmallScreen ? 14 : isSmallScreen ? 20 : 32 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: isVerySmallScreen ? 10 : isSmallScreen ? 14 : 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: isVerySmallScreen ? 10 : 16, fontSize: isVerySmallScreen ? 12 : 14, fontFamily: 'Montserrat_400Regular' },
  socialButtonsRow: { flexDirection: 'row', justifyContent: 'center', gap: isVerySmallScreen ? 12 : isSmallScreen ? 16 : 20 },
  socialIconButton: { 
    width: isVerySmallScreen ? 48 : isSmallScreen ? 56 : 70, 
    height: isVerySmallScreen ? 48 : isSmallScreen ? 56 : 70, 
    borderRadius: isVerySmallScreen ? 24 : isSmallScreen ? 28 : 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  socialIcon: { 
    width: isVerySmallScreen ? 22 : isSmallScreen ? 26 : 32, 
    height: isVerySmallScreen ? 22 : isSmallScreen ? 26 : 32 
  },
  appleIcon: { fontSize: 32, color: '#fff' },
  socialButtonDisabled: { opacity: 0.5 },
  devButton: { marginTop: isSmallScreen ? 16 : 24, padding: isSmallScreen ? 10 : 14, borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B', borderStyle: 'dashed' },
  devButtonText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  modalClose: { fontSize: 20, padding: 4 },
  searchContainer: { padding: 12, borderBottomWidth: 1 },
  searchInput: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontFamily: 'Montserrat_400Regular' },
  countryItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  countryItemFlag: { fontSize: 24, marginRight: 12 },
  countryItemInfo: { flex: 1 },
  countryItemName: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  countryItemDialCode: { fontSize: 12, marginTop: 2 },
  checkmark: { fontSize: 18, color: '#0066FF', fontFamily: 'Montserrat_700Bold' },
  emptySearch: { padding: 40, alignItems: 'center' },
  emptySearchText: { fontSize: 16 },
});
