import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// Network provider configurations by country
const NETWORKS: Record<string, Array<{id: string; name: string; logo: string; color: string; apiCode: string}>> = {
  // Uganda
  UG: [
    { id: 'mtn_ug', name: 'MTN Uganda', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'airtel_ug', name: 'Airtel Uganda', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'utl', name: 'Uganda Telecom', logo: '📱', color: '#0066CC', apiCode: 'UTL' },
    { id: 'africell_ug', name: 'Africell Uganda', logo: '🟠', color: '#FF6600', apiCode: 'AFRICELL' },
    { id: 'lyca_ug', name: 'Lycamobile Uganda', logo: '🔵', color: '#0099CC', apiCode: 'LYCA' },
  ],
  // Kenya
  KE: [
    { id: 'safaricom', name: 'Safaricom', logo: '🟢', color: '#00A651', apiCode: 'SAFARICOM' },
    { id: 'airtel_ke', name: 'Airtel Kenya', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'telkom_ke', name: 'Telkom Kenya', logo: '🔵', color: '#0066CC', apiCode: 'TELKOM' },
    { id: 'faiba_ke', name: 'Faiba 4G', logo: '🟣', color: '#6B2D7B', apiCode: 'FAIBA' },
  ],
  // Tanzania
  TZ: [
    { id: 'vodacom_tz', name: 'Vodacom Tanzania', logo: '🔴', color: '#E60000', apiCode: 'VODACOM' },
    { id: 'airtel_tz', name: 'Airtel Tanzania', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'tigo_tz', name: 'Tigo Tanzania', logo: '🔵', color: '#004B93', apiCode: 'TIGO' },
    { id: 'halotel', name: 'Halotel', logo: '🟢', color: '#00A651', apiCode: 'HALOTEL' },
    { id: 'zantel', name: 'Zantel', logo: '🟠', color: '#FF6600', apiCode: 'ZANTEL' },
    { id: 'ttcl', name: 'TTCL', logo: '🔵', color: '#003399', apiCode: 'TTCL' },
  ],
  // Nigeria
  NG: [
    { id: 'mtn_ng', name: 'MTN Nigeria', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'airtel_ng', name: 'Airtel Nigeria', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'glo', name: 'Glo Nigeria', logo: '🟢', color: '#00A651', apiCode: 'GLO' },
    { id: '9mobile', name: '9mobile', logo: '🟢', color: '#006B3F', apiCode: '9MOBILE' },
    { id: 'ntel', name: 'ntel', logo: '🔵', color: '#0066CC', apiCode: 'NTEL' },
  ],
  // Ghana
  GH: [
    { id: 'mtn_gh', name: 'MTN Ghana', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'vodafone_gh', name: 'Vodafone Ghana', logo: '🔴', color: '#E60000', apiCode: 'VODAFONE' },
    { id: 'airtel_gh', name: 'AirtelTigo Ghana', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'glo_gh', name: 'Glo Ghana', logo: '🟢', color: '#00A651', apiCode: 'GLO' },
  ],
  // South Africa
  ZA: [
    { id: 'vodacom_za', name: 'Vodacom', logo: '🔴', color: '#E60000', apiCode: 'VODACOM' },
    { id: 'mtn_za', name: 'MTN South Africa', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'cell_c', name: 'Cell C', logo: '⚫', color: '#000000', apiCode: 'CELLC' },
    { id: 'telkom_za', name: 'Telkom SA', logo: '🔵', color: '#0066CC', apiCode: 'TELKOM' },
    { id: 'rain_za', name: 'Rain', logo: '🔵', color: '#00BFFF', apiCode: 'RAIN' },
  ],
  // Rwanda
  RW: [
    { id: 'mtn_rw', name: 'MTN Rwanda', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'airtel_rw', name: 'Airtel Rwanda', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'ktrn', name: 'KT Rwanda', logo: '🔴', color: '#FF0000', apiCode: 'KTRN' },
  ],
  // Zambia
  ZM: [
    { id: 'mtn_zm', name: 'MTN Zambia', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'airtel_zm', name: 'Airtel Zambia', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'zamtel', name: 'Zamtel', logo: '🟢', color: '#00A651', apiCode: 'ZAMTEL' },
  ],
  // Zimbabwe
  ZW: [
    { id: 'econet', name: 'Econet', logo: '🔵', color: '#003399', apiCode: 'ECONET' },
    { id: 'netone', name: 'NetOne', logo: '🟢', color: '#00A651', apiCode: 'NETONE' },
    { id: 'telecel', name: 'Telecel', logo: '🔴', color: '#ED1C24', apiCode: 'TELECEL' },
  ],
  // DR Congo
  CD: [
    { id: 'vodacom_cd', name: 'Vodacom Congo', logo: '🔴', color: '#E60000', apiCode: 'VODACOM' },
    { id: 'airtel_cd', name: 'Airtel Congo', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'orange_cd', name: 'Orange Congo', logo: '🟠', color: '#FF6600', apiCode: 'ORANGE' },
    { id: 'africell_cd', name: 'Africell Congo', logo: '🟠', color: '#FF6600', apiCode: 'AFRICELL' },
  ],
  // Egypt
  EG: [
    { id: 'vodafone_eg', name: 'Vodafone Egypt', logo: '🔴', color: '#E60000', apiCode: 'VODAFONE' },
    { id: 'orange_eg', name: 'Orange Egypt', logo: '🟠', color: '#FF6600', apiCode: 'ORANGE' },
    { id: 'etisalat_eg', name: 'Etisalat Egypt', logo: '🟢', color: '#00A651', apiCode: 'ETISALAT' },
    { id: 'we_eg', name: 'WE', logo: '🟣', color: '#6B2D7B', apiCode: 'WE' },
  ],
  // India
  IN: [
    { id: 'jio', name: 'Jio', logo: '🔵', color: '#0066CC', apiCode: 'JIO' },
    { id: 'airtel_in', name: 'Airtel India', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'vi', name: 'Vi (Vodafone Idea)', logo: '🔴', color: '#E60000', apiCode: 'VI' },
    { id: 'bsnl', name: 'BSNL', logo: '🟢', color: '#00A651', apiCode: 'BSNL' },
    { id: 'mtnl', name: 'MTNL', logo: '🟠', color: '#FF6600', apiCode: 'MTNL' },
  ],
  // Bangladesh
  BD: [
    { id: 'grameenphone', name: 'Grameenphone', logo: '🔵', color: '#0066CC', apiCode: 'GP' },
    { id: 'robi', name: 'Robi', logo: '🔴', color: '#ED1C24', apiCode: 'ROBI' },
    { id: 'banglalink', name: 'Banglalink', logo: '🟠', color: '#FF6600', apiCode: 'BANGLALINK' },
    { id: 'teletalk', name: 'Teletalk', logo: '🟢', color: '#00A651', apiCode: 'TELETALK' },
    { id: 'airtel_bd', name: 'Airtel Bangladesh', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
  ],
  // Pakistan
  PK: [
    { id: 'jazz', name: 'Jazz', logo: '🔴', color: '#ED1C24', apiCode: 'JAZZ' },
    { id: 'telenor_pk', name: 'Telenor Pakistan', logo: '🔵', color: '#0066CC', apiCode: 'TELENOR' },
    { id: 'zong', name: 'Zong', logo: '🟢', color: '#00A651', apiCode: 'ZONG' },
    { id: 'ufone', name: 'Ufone', logo: '🟠', color: '#FF6600', apiCode: 'UFONE' },
    { id: 'scom', name: 'SCO', logo: '🔵', color: '#003399', apiCode: 'SCO' },
  ],
  // Philippines
  PH: [
    { id: 'globe', name: 'Globe', logo: '🔵', color: '#0066CC', apiCode: 'GLOBE' },
    { id: 'smart', name: 'Smart', logo: '🟢', color: '#00A651', apiCode: 'SMART' },
    { id: 'dito', name: 'DITO', logo: '🟢', color: '#00FF00', apiCode: 'DITO' },
    { id: 'sun', name: 'Sun Cellular', logo: '🟠', color: '#FF6600', apiCode: 'SUN' },
  ],
  // Indonesia
  ID: [
    { id: 'telkomsel', name: 'Telkomsel', logo: '🔴', color: '#ED1C24', apiCode: 'TELKOMSEL' },
    { id: 'indosat', name: 'Indosat Ooredoo', logo: '🟡', color: '#FFD700', apiCode: 'INDOSAT' },
    { id: 'xl', name: 'XL Axiata', logo: '🔵', color: '#0066CC', apiCode: 'XL' },
    { id: 'tri', name: 'Tri', logo: '🟣', color: '#6B2D7B', apiCode: 'TRI' },
    { id: 'smartfren', name: 'Smartfren', logo: '🔴', color: '#FF0000', apiCode: 'SMARTFREN' },
  ],
  // UK
  GB: [
    { id: 'ee', name: 'EE', logo: '🟢', color: '#00A651', apiCode: 'EE' },
    { id: 'vodafone_uk', name: 'Vodafone UK', logo: '🔴', color: '#E60000', apiCode: 'VODAFONE' },
    { id: 'three_uk', name: 'Three UK', logo: '⚫', color: '#000000', apiCode: 'THREE' },
    { id: 'o2_uk', name: 'O2 UK', logo: '🔵', color: '#0066CC', apiCode: 'O2' },
    { id: 'giffgaff', name: 'giffgaff', logo: '⚫', color: '#000000', apiCode: 'GIFFGAFF' },
  ],
  // USA
  US: [
    { id: 'att', name: 'AT&T', logo: '🔵', color: '#0066CC', apiCode: 'ATT' },
    { id: 'verizon', name: 'Verizon', logo: '🔴', color: '#ED1C24', apiCode: 'VERIZON' },
    { id: 'tmobile', name: 'T-Mobile', logo: '🟣', color: '#E20074', apiCode: 'TMOBILE' },
    { id: 'sprint', name: 'Sprint', logo: '🟡', color: '#FFD700', apiCode: 'SPRINT' },
    { id: 'metro', name: 'Metro by T-Mobile', logo: '🟣', color: '#6B2D7B', apiCode: 'METRO' },
    { id: 'cricket', name: 'Cricket', logo: '🟢', color: '#00A651', apiCode: 'CRICKET' },
  ],
  // UAE
  AE: [
    { id: 'etisalat', name: 'Etisalat', logo: '🟢', color: '#00A651', apiCode: 'ETISALAT' },
    { id: 'du', name: 'du', logo: '🟢', color: '#00FF00', apiCode: 'DU' },
    { id: 'virgin_ae', name: 'Virgin Mobile UAE', logo: '🔴', color: '#ED1C24', apiCode: 'VIRGIN' },
  ],
  // Saudi Arabia
  SA: [
    { id: 'stc', name: 'STC', logo: '🟣', color: '#6B2D7B', apiCode: 'STC' },
    { id: 'mobily', name: 'Mobily', logo: '🟢', color: '#00A651', apiCode: 'MOBILY' },
    { id: 'zain_sa', name: 'Zain KSA', logo: '🟢', color: '#00FF00', apiCode: 'ZAIN' },
  ],
  // Default for other countries
  DEFAULT: [
    { id: 'mtn', name: 'MTN', logo: '🟨', color: '#FFCC00', apiCode: 'MTN' },
    { id: 'airtel', name: 'Airtel', logo: '🔴', color: '#ED1C24', apiCode: 'AIRTEL' },
    { id: 'orange', name: 'Orange', logo: '🟠', color: '#FF6600', apiCode: 'ORANGE' },
    { id: 'vodafone', name: 'Vodafone', logo: '🔴', color: '#E60000', apiCode: 'VODAFONE' },
    { id: 'tigo', name: 'Tigo', logo: '🔵', color: '#004B93', apiCode: 'TIGO' },
    { id: 'etisalat', name: 'Etisalat', logo: '🟢', color: '#00A651', apiCode: 'ETISALAT' },
  ],
};

// Get networks for a country
const getNetworksForCountry = (countryCode: string) => {
  return NETWORKS[countryCode] || NETWORKS.DEFAULT;
};

// International Countries with dial codes and flags
const COUNTRIES = [
  // East Africa
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '+211' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
  // West Africa
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', dialCode: '+222' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238' },
  // Central Africa
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', dialCode: '+243' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240' },
  { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫', dialCode: '+236' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
  { code: 'ST', name: 'São Tomé & Príncipe', flag: '🇸🇹', dialCode: '+239' },
  // Southern Africa
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
  // North Africa
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  // South Asia
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  // Southeast Asia
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  // Middle East
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  // Americas
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
];

// Preset airtime amounts
const AIRTIME_AMOUNTS = [
  { ugx: 500, usd: 0.13, label: 'USh 500', popular: false },
  { ugx: 1000, usd: 0.27, label: 'USh 1,000', popular: false },
  { ugx: 2000, usd: 0.53, label: 'USh 2,000', popular: true },
  { ugx: 5000, usd: 1.33, label: 'USh 5,000', popular: true },
  { ugx: 10000, usd: 2.67, label: 'USh 10,000', popular: false },
  { ugx: 20000, usd: 5.33, label: 'USh 20,000', popular: false },
];

const CASHBACK_RATE = 0.10; // 10% cashback
const UGX_TO_USD = 3750; // Exchange rate

interface AirtimeScreenProps {
  navigation: any;
}

export default function AirtimeScreen({ navigation }: AirtimeScreenProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  // Form state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [availableNetworks, setAvailableNetworks] = useState(getNetworksForCountry('UG'));
  const [selectedNetwork, setSelectedNetwork] = useState(getNetworksForCountry('UG')[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<typeof AIRTIME_AMOUNTS[0] | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  
  // UI state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [phoneError, setPhoneError] = useState('');

  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    loadWalletBalance();
  }, []);

  // Handle country change - update networks
  const handleCountryChange = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    const networks = getNetworksForCountry(country.code);
    setAvailableNetworks(networks);
    setSelectedNetwork(networks[0]);
    setShowCountryModal(false);
    setCountrySearch('');
    setPhoneNumber(''); // Reset phone when country changes
  };

  // Filter countries by search
  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dialCode.includes(countrySearch)
      )
    : COUNTRIES;

  const loadWalletBalance = async () => {
    try {
      const result = await api.getBalance();
      if (result.success && result.data?.wallets) {
        const ugxWallet = result.data.wallets.find(w => w.currency === 'UGX');
        setWalletBalance(ugxWallet?.balance || 0);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  // Validate Uganda phone number
  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    const cleaned = phone.replace(/\s/g, '');
    // Uganda: 07XXXXXXXX or 7XXXXXXXX
    const ugandaRegex = /^(0?[37]\d{8})$/;
    
    if (!ugandaRegex.test(cleaned)) {
      setPhoneError('Enter valid Uganda number (e.g., 0771234567)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  // Format phone for API
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) {
      return '+256' + cleaned.slice(1);
    }
    if (cleaned.startsWith('256')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    return '+256' + cleaned;
  };

  // Get final amount
  const getFinalAmount = () => {
    if (customAmount) {
      const ugx = parseInt(customAmount) || 0;
      return { ugx, usd: ugx / UGX_TO_USD, label: `USh ${ugx.toLocaleString()}` };
    }
    return selectedAmount;
  };

  // Calculate cashback
  const getCashback = () => {
    const amount = getFinalAmount();
    if (!amount) return 0;
    return amount.ugx * CASHBACK_RATE;
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!validatePhone(phoneNumber)) return;
    
    const amount = getFinalAmount();
    if (!amount || amount.ugx < 500) {
      Alert.alert('Error', 'Minimum amount is USh 500');
      return;
    }

    if (amount.ugx > walletBalance) {
      Alert.alert('Insufficient Balance', 'Please top up your wallet first');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy USh ${amount.ugx.toLocaleString()} airtime for ${formatPhone(phoneNumber)}?\n\nYou'll earn USh ${getCashback().toLocaleString()} cashback!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: executePurchase },
      ]
    );
  };

  const executePurchase = async () => {
    setIsProcessing(true);
    
    try {
      const amount = getFinalAmount();
      if (!amount) throw new Error('No amount selected');

      const result = await api.purchaseAirtime({
        phoneNumber: formatPhone(phoneNumber),
        network: selectedNetwork.apiCode,
        amount: amount.ugx,
        country: selectedCountry.code,
      });

      if (result.success) {
        Alert.alert(
          '✅ Success!',
          `Airtime sent to ${formatPhone(phoneNumber)}\n\nAmount: USh ${amount.ugx.toLocaleString()}\nCashback: USh ${getCashback().toLocaleString()}\n\nRef: ${result.data?.reference || 'N/A'}`,
          [{ text: 'OK', onPress: () => {
            setPhoneNumber('');
            setSelectedAmount(null);
            setCustomAmount('');
            loadWalletBalance();
          }}]
        );
      } else {
        throw new Error(result.message || 'Purchase failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to purchase airtime');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('airtime.title')}</Text>
        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackText}>{t('airtime.cashback')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('airtime.walletBalance')}</Text>
          <Text style={styles.balanceAmount}>USh {walletBalance.toLocaleString()}</Text>
        </View>

        {/* Country & Network Selection */}
        <View style={styles.selectionRow}>
          <TouchableOpacity 
            style={[styles.countrySelector, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowCountryModal(true)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={[styles.selectorArrow, { color: colors.textMuted }]}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.selector, { backgroundColor: selectedNetwork.color + '20', borderColor: colors.border, flex: 1 }]}
            onPress={() => setShowNetworkModal(true)}
          >
            <Text style={styles.selectorFlag}>{selectedNetwork.logo}</Text>
            <Text style={[styles.selectorText, { color: selectedNetwork.color }]}>
              {selectedNetwork.name}
            </Text>
            <Text style={[styles.selectorArrow, { color: colors.textMuted }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>{t('airtime.phoneNumber')}</Text>
          <View style={[styles.phoneInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dialCode, { backgroundColor: colors.surfaceVariant, borderRightColor: colors.border }]}>
              <Text style={[styles.dialCodeText, { color: colors.text }]}>{selectedCountry.dialCode}</Text>
            </View>
            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder="771234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setPhoneError('');
              }}
              maxLength={10}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        {/* Amount Selection */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>{t('airtime.selectAmount')}</Text>
          <View style={styles.amountGrid}>
            {AIRTIME_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount.ugx}
                style={[
                  styles.amountBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedAmount?.ugx === amount.ugx && !customAmount && styles.amountBtnSelected,
                  amount.popular && styles.amountBtnPopular,
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
              >
                <Text style={[
                  styles.amountText,
                  { color: colors.text },
                  selectedAmount?.ugx === amount.ugx && !customAmount && styles.amountTextSelected,
                ]}>
                  {amount.label}
                </Text>
                {amount.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount */}
          <View style={[styles.customAmountContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.customLabel, { color: colors.textMuted }]}>Or enter custom amount:</Text>
            <View style={styles.customInputRow}>
              <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>USh</Text>
              <TextInput
                style={[styles.customInput, { color: colors.text }]}
                placeholder="5000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedAmount(null);
                }}
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        {getFinalAmount() && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>USh {getFinalAmount()?.ugx.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cashback (10%)</Text>
              <Text style={styles.cashbackValue}>+USh {getCashback().toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>You Pay</Text>
              <Text style={styles.totalValue}>USh {getFinalAmount()?.ugx.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Purchase Button */}
        <TouchableOpacity
          style={[
            styles.purchaseBtn,
            (!phoneNumber || !getFinalAmount()) && styles.purchaseBtnDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || !phoneNumber || !getFinalAmount()}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.purchaseBtnText}>Buy Airtime</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Country Modal with Search */}
      <Modal visible={showCountryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%', backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country ({COUNTRIES.length})</Text>
              <TouchableOpacity onPress={() => { setShowCountryModal(false); setCountrySearch(''); }}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search country or dial code..."
                placeholderTextColor={colors.textMuted}
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
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                    selectedCountry.code === item.code && styles.modalItemSelected,
                  ]}
                  onPress={() => handleCountryChange(item)}
                >
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.dialCodeSmall, { color: colors.textSecondary }]}>{item.dialCode}</Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={[styles.emptySearchText, { color: colors.textMuted }]}>No countries found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Network Modal */}
      <Modal visible={showNetworkModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Network - {selectedCountry.name}</Text>
              <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableNetworks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                    selectedNetwork.id === item.id && styles.modalItemSelected,
                    { backgroundColor: item.color + '10' },
                  ]}
                  onPress={() => {
                    setSelectedNetwork(item);
                    setShowNetworkModal(false);
                  }}
                >
                  <Text style={styles.modalItemFlag}>{item.logo}</Text>
                  <Text style={[styles.modalItemText, { color: item.color }]}>{item.name}</Text>
                  {selectedNetwork.id === item.id && (
                    <Text style={[styles.checkmark, { color: item.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={[styles.processingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={[styles.processingText, { color: colors.text }]}>Processing purchase...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  cashbackBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cashbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    marginTop: 4,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginRight: 12,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 6,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  selectorFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  selectorArrow: {
    fontSize: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  dialCode: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  dialCodeText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountBtn: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  amountBtnSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  amountBtnPopular: {
    borderColor: '#10B981',
  },
  amountText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
  },
  amountTextSelected: {
    color: '#7C3AED',
  },
  popularBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
  },
  customAmountContainer: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#CCCCCC',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
  },
  cashbackValue: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#10B981',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#7C3AED',
  },
  purchaseBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  purchaseBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  purchaseBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 20,
    color: '#AAAAAA',
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#F5F3FF',
  },
  modalItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#374151',
  },
  checkmark: {
    fontSize: 18,
    color: '#7C3AED',
    fontFamily: 'Montserrat_700Bold',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#374151',
  },
  // Search styles
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  countryInfo: {
    flex: 1,
  },
  dialCodeSmall: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
});
