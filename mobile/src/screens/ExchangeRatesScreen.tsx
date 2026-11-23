// Exchange Rates Screen - Shows current currency exchange rates with country selector
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface Currency {
  code: string;
  name: string;
  country: string;
  flag: string;
  rate: number;
  symbol: string;
}

// All world currencies with exchange rates to UGX (Uganda Shilling)
const ALL_CURRENCIES: Currency[] = [
  // Africa
  { code: 'UGX', name: 'Uganda Shilling', country: 'Uganda', flag: '🇺🇬', rate: 1, symbol: 'UGX' },
  { code: 'KES', name: 'Kenyan Shilling', country: 'Kenya', flag: '🇰🇪', rate: 28.45, symbol: 'KES' },
  { code: 'TZS', name: 'Tanzanian Shilling', country: 'Tanzania', flag: '🇹🇿', rate: 1.53, symbol: 'TZS' },
  { code: 'RWF', name: 'Rwanda Franc', country: 'Rwanda', flag: '🇷🇼', rate: 2.92, symbol: 'RWF' },
  { code: 'BIF', name: 'Burundi Franc', country: 'Burundi', flag: '🇧🇮', rate: 1.32, symbol: 'BIF' },
  { code: 'SSP', name: 'South Sudanese Pound', country: 'South Sudan', flag: '🇸🇸', rate: 4.52, symbol: 'SSP' },
  { code: 'ETB', name: 'Ethiopian Birr', country: 'Ethiopia', flag: '🇪🇹', rate: 66.12, symbol: 'ETB' },
  { code: 'SDG', name: 'Sudanese Pound', country: 'Sudan', flag: '🇸🇩', rate: 6.25, symbol: 'SDG' },
  { code: 'EGP', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬', rate: 121.50, symbol: 'E£' },
  { code: 'ZAR', name: 'South African Rand', country: 'South Africa', flag: '🇿🇦', rate: 205.50, symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria', flag: '🇳🇬', rate: 2.48, symbol: '₦' },
  { code: 'GHS', name: 'Ghana Cedi', country: 'Ghana', flag: '🇬🇭', rate: 319.31, symbol: '₵' },
  { code: 'XOF', name: 'CFA Franc BCEAO', country: 'West Africa', flag: '🌍', rate: 6.12, symbol: 'CFA' },
  { code: 'XAF', name: 'CFA Franc BEAC', country: 'Central Africa', flag: '🌍', rate: 6.12, symbol: 'FCFA' },
  { code: 'MAD', name: 'Moroccan Dirham', country: 'Morocco', flag: '🇲🇦', rate: 375.20, symbol: 'MAD' },
  { code: 'DZD', name: 'Algerian Dinar', country: 'Algeria', flag: '🇩🇿', rate: 27.85, symbol: 'DA' },
  { code: 'TND', name: 'Tunisian Dinar', country: 'Tunisia', flag: '🇹🇳', rate: 1205.00, symbol: 'DT' },
  { code: 'LYD', name: 'Libyan Dinar', country: 'Libya', flag: '🇱🇾', rate: 775.00, symbol: 'LD' },
  { code: 'BWP', name: 'Botswana Pula', country: 'Botswana', flag: '🇧🇼', rate: 283.76, symbol: 'P' },
  { code: 'MWK', name: 'Malawian Kwacha', country: 'Malawi', flag: '🇲🇼', rate: 2.17, symbol: 'MK' },
  { code: 'ZMW', name: 'Zambian Kwacha', country: 'Zambia', flag: '🇿🇲', rate: 145.80, symbol: 'ZK' },
  { code: 'ZWL', name: 'Zimbabwe Dollar', country: 'Zimbabwe', flag: '🇿🇼', rate: 0.28, symbol: 'Z$' },
  { code: 'MZN', name: 'Mozambican Metical', country: 'Mozambique', flag: '🇲🇿', rate: 58.50, symbol: 'MT' },
  { code: 'AOA', name: 'Angolan Kwanza', country: 'Angola', flag: '🇦🇴', rate: 4.52, symbol: 'Kz' },
  { code: 'NAD', name: 'Namibian Dollar', country: 'Namibia', flag: '🇳🇦', rate: 205.50, symbol: 'N$' },
  { code: 'SZL', name: 'Swazi Lilangeni', country: 'Eswatini', flag: '🇸🇿', rate: 205.50, symbol: 'E' },
  { code: 'LSL', name: 'Lesotho Loti', country: 'Lesotho', flag: '🇱🇸', rate: 205.50, symbol: 'L' },
  { code: 'MUR', name: 'Mauritian Rupee', country: 'Mauritius', flag: '🇲🇺', rate: 82.50, symbol: 'Rs' },
  { code: 'SCR', name: 'Seychellois Rupee', country: 'Seychelles', flag: '🇸🇨', rate: 285.00, symbol: 'Rs' },
  { code: 'MGA', name: 'Malagasy Ariary', country: 'Madagascar', flag: '🇲🇬', rate: 0.82, symbol: 'Ar' },
  { code: 'KMF', name: 'Comorian Franc', country: 'Comoros', flag: '🇰🇲', rate: 8.25, symbol: 'CF' },
  { code: 'DJF', name: 'Djiboutian Franc', country: 'Djibouti', flag: '🇩🇯', rate: 21.10, symbol: 'Fdj' },
  { code: 'ERN', name: 'Eritrean Nakfa', country: 'Eritrea', flag: '🇪🇷', rate: 250.00, symbol: 'Nfk' },
  { code: 'SOS', name: 'Somali Shilling', country: 'Somalia', flag: '🇸🇴', rate: 6.58, symbol: 'Sh' },
  { code: 'GMD', name: 'Gambian Dalasi', country: 'Gambia', flag: '🇬🇲', rate: 55.20, symbol: 'D' },
  { code: 'GNF', name: 'Guinean Franc', country: 'Guinea', flag: '🇬🇳', rate: 0.44, symbol: 'FG' },
  { code: 'SLL', name: 'Sierra Leonean Leone', country: 'Sierra Leone', flag: '🇸🇱', rate: 0.17, symbol: 'Le' },
  { code: 'LRD', name: 'Liberian Dollar', country: 'Liberia', flag: '🇱🇷', rate: 19.85, symbol: 'L$' },
  { code: 'CVE', name: 'Cape Verdean Escudo', country: 'Cape Verde', flag: '🇨🇻', rate: 36.50, symbol: 'Esc' },
  { code: 'STN', name: 'Sao Tome Dobra', country: 'Sao Tome', flag: '🇸🇹', rate: 165.00, symbol: 'Db' },
  { code: 'CDF', name: 'Congolese Franc', country: 'DR Congo', flag: '🇨🇩', rate: 1.35, symbol: 'FC' },
  // Americas
  { code: 'USD', name: 'US Dollar', country: 'United States', flag: '🇺🇸', rate: 3750.00, symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', flag: '🇨🇦', rate: 2780.00, symbol: 'C$' },
  { code: 'MXN', name: 'Mexican Peso', country: 'Mexico', flag: '🇲🇽', rate: 218.50, symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', country: 'Brazil', flag: '🇧🇷', rate: 765.00, symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', country: 'Argentina', flag: '🇦🇷', rate: 4.25, symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', country: 'Chile', flag: '🇨🇱', rate: 4.15, symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', country: 'Colombia', flag: '🇨🇴', rate: 0.92, symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', country: 'Peru', flag: '🇵🇪', rate: 1005.00, symbol: 'S/' },
  { code: 'VES', name: 'Venezuelan Bolivar', country: 'Venezuela', flag: '🇻🇪', rate: 103.50, symbol: 'Bs' },
  { code: 'UYU', name: 'Uruguayan Peso', country: 'Uruguay', flag: '🇺🇾', rate: 95.80, symbol: '$U' },
  { code: 'PYG', name: 'Paraguayan Guarani', country: 'Paraguay', flag: '🇵🇾', rate: 0.51, symbol: 'Gs' },
  { code: 'BOB', name: 'Bolivian Boliviano', country: 'Bolivia', flag: '🇧🇴', rate: 543.00, symbol: 'Bs' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', country: 'Guatemala', flag: '🇬🇹', rate: 485.00, symbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', country: 'Honduras', flag: '🇭🇳', rate: 152.00, symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', country: 'Nicaragua', flag: '🇳🇮', rate: 102.50, symbol: 'C$' },
  { code: 'CRC', name: 'Costa Rican Colon', country: 'Costa Rica', flag: '🇨🇷', rate: 7.25, symbol: 'C' },
  { code: 'PAB', name: 'Panamanian Balboa', country: 'Panama', flag: '🇵🇦', rate: 3750.00, symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', country: 'Dominican Rep.', flag: '🇩🇴', rate: 63.50, symbol: 'RD$' },
  { code: 'CUP', name: 'Cuban Peso', country: 'Cuba', flag: '🇨🇺', rate: 156.25, symbol: '$' },
  { code: 'JMD', name: 'Jamaican Dollar', country: 'Jamaica', flag: '🇯🇲', rate: 24.25, symbol: 'J$' },
  { code: 'HTG', name: 'Haitian Gourde', country: 'Haiti', flag: '🇭🇹', rate: 28.50, symbol: 'G' },
  { code: 'TTD', name: 'Trinidad Dollar', country: 'Trinidad', flag: '🇹🇹', rate: 552.00, symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', country: 'Barbados', flag: '🇧🇧', rate: 1875.00, symbol: 'Bds$' },
  { code: 'BSD', name: 'Bahamian Dollar', country: 'Bahamas', flag: '🇧🇸', rate: 3750.00, symbol: 'B$' },
  { code: 'BZD', name: 'Belize Dollar', country: 'Belize', flag: '🇧🇿', rate: 1860.00, symbol: 'BZ$' },
  { code: 'SRD', name: 'Surinamese Dollar', country: 'Suriname', flag: '🇸🇷', rate: 105.00, symbol: '$' },
  { code: 'GYD', name: 'Guyanese Dollar', country: 'Guyana', flag: '🇬🇾', rate: 17.95, symbol: 'G$' },
  { code: 'AWG', name: 'Aruban Florin', country: 'Aruba', flag: '🇦🇼', rate: 2083.00, symbol: 'Afl' },
  { code: 'XCD', name: 'East Caribbean Dollar', country: 'Caribbean', flag: '🌴', rate: 1388.00, symbol: 'EC$' },
  // Europe
  { code: 'EUR', name: 'Euro', country: 'European Union', flag: '🇪🇺', rate: 4050.00, symbol: 'E' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧', rate: 4750.00, symbol: 'L' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', flag: '🇨🇭', rate: 4225.00, symbol: 'Fr' },
  { code: 'NOK', name: 'Norwegian Krone', country: 'Norway', flag: '🇳🇴', rate: 352.00, symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', country: 'Sweden', flag: '🇸🇪', rate: 358.00, symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', country: 'Denmark', flag: '🇩🇰', rate: 543.00, symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', country: 'Poland', flag: '🇵🇱', rate: 938.00, symbol: 'zl' },
  { code: 'CZK', name: 'Czech Koruna', country: 'Czech Republic', flag: '🇨🇿', rate: 165.00, symbol: 'Kc' },
  { code: 'HUF', name: 'Hungarian Forint', country: 'Hungary', flag: '🇭🇺', rate: 10.35, symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', country: 'Romania', flag: '🇷🇴', rate: 815.00, symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', country: 'Bulgaria', flag: '🇧🇬', rate: 2070.00, symbol: 'lv' },
  { code: 'HRK', name: 'Croatian Kuna', country: 'Croatia', flag: '🇭🇷', rate: 538.00, symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', country: 'Serbia', flag: '🇷🇸', rate: 34.50, symbol: 'din' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', country: 'Ukraine', flag: '🇺🇦', rate: 101.50, symbol: 'UAH' },
  { code: 'RUB', name: 'Russian Ruble', country: 'Russia', flag: '🇷🇺', rate: 37.50, symbol: 'RUB' },
  { code: 'BYN', name: 'Belarusian Ruble', country: 'Belarus', flag: '🇧🇾', rate: 1145.00, symbol: 'Br' },
  { code: 'MDL', name: 'Moldovan Leu', country: 'Moldova', flag: '🇲🇩', rate: 212.00, symbol: 'L' },
  { code: 'ALL', name: 'Albanian Lek', country: 'Albania', flag: '🇦🇱', rate: 40.25, symbol: 'L' },
  { code: 'MKD', name: 'Macedonian Denar', country: 'North Macedonia', flag: '🇲🇰', rate: 65.80, symbol: 'den' },
  { code: 'BAM', name: 'Bosnia Mark', country: 'Bosnia', flag: '🇧🇦', rate: 2070.00, symbol: 'KM' },
  { code: 'ISK', name: 'Icelandic Krona', country: 'Iceland', flag: '🇮🇸', rate: 27.25, symbol: 'kr' },
  { code: 'TRY', name: 'Turkish Lira', country: 'Turkey', flag: '🇹🇷', rate: 130.50, symbol: 'TL' },
  { code: 'GEL', name: 'Georgian Lari', country: 'Georgia', flag: '🇬🇪', rate: 1405.00, symbol: 'GEL' },
  { code: 'AMD', name: 'Armenian Dram', country: 'Armenia', flag: '🇦🇲', rate: 9.65, symbol: 'AMD' },
  { code: 'AZN', name: 'Azerbaijani Manat', country: 'Azerbaijan', flag: '🇦🇿', rate: 2205.00, symbol: 'AZN' },
  // Asia
  { code: 'CNY', name: 'Chinese Yuan', country: 'China', flag: '🇨🇳', rate: 518.00, symbol: 'CNY' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', flag: '🇯🇵', rate: 25.15, symbol: 'JPY' },
  { code: 'KRW', name: 'South Korean Won', country: 'South Korea', flag: '🇰🇷', rate: 2.82, symbol: 'KRW' },
  { code: 'INR', name: 'Indian Rupee', country: 'India', flag: '🇮🇳', rate: 45.00, symbol: 'INR' },
  { code: 'PKR', name: 'Pakistani Rupee', country: 'Pakistan', flag: '🇵🇰', rate: 13.45, symbol: 'PKR' },
  { code: 'BDT', name: 'Bangladeshi Taka', country: 'Bangladesh', flag: '🇧🇩', rate: 34.15, symbol: 'BDT' },
  { code: 'LKR', name: 'Sri Lankan Rupee', country: 'Sri Lanka', flag: '🇱🇰', rate: 11.55, symbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', country: 'Nepal', flag: '🇳🇵', rate: 28.15, symbol: 'Rs' },
  { code: 'MMK', name: 'Myanmar Kyat', country: 'Myanmar', flag: '🇲🇲', rate: 1.78, symbol: 'K' },
  { code: 'THB', name: 'Thai Baht', country: 'Thailand', flag: '🇹🇭', rate: 108.50, symbol: 'THB' },
  { code: 'VND', name: 'Vietnamese Dong', country: 'Vietnam', flag: '🇻🇳', rate: 0.15, symbol: 'VND' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', flag: '🇲🇾', rate: 845.00, symbol: 'RM' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', flag: '🇸🇬', rate: 2785.00, symbol: 'S$' },
  { code: 'IDR', name: 'Indonesian Rupiah', country: 'Indonesia', flag: '🇮🇩', rate: 0.24, symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', country: 'Philippines', flag: '🇵🇭', rate: 67.50, symbol: 'PHP' },
  { code: 'HKD', name: 'Hong Kong Dollar', country: 'Hong Kong', flag: '🇭🇰', rate: 480.00, symbol: 'HK$' },
  { code: 'TWD', name: 'Taiwan Dollar', country: 'Taiwan', flag: '🇹🇼', rate: 118.50, symbol: 'NT$' },
  { code: 'KHR', name: 'Cambodian Riel', country: 'Cambodia', flag: '🇰🇭', rate: 0.92, symbol: 'KHR' },
  { code: 'LAK', name: 'Lao Kip', country: 'Laos', flag: '🇱🇦', rate: 0.18, symbol: 'LAK' },
  { code: 'BND', name: 'Brunei Dollar', country: 'Brunei', flag: '🇧🇳', rate: 2785.00, symbol: 'B$' },
  { code: 'MOP', name: 'Macanese Pataca', country: 'Macau', flag: '🇲🇴', rate: 465.00, symbol: 'MOP$' },
  { code: 'MNT', name: 'Mongolian Tugrik', country: 'Mongolia', flag: '🇲🇳', rate: 1.10, symbol: 'MNT' },
  { code: 'KZT', name: 'Kazakhstani Tenge', country: 'Kazakhstan', flag: '🇰🇿', rate: 8.15, symbol: 'KZT' },
  { code: 'UZS', name: 'Uzbekistani Som', country: 'Uzbekistan', flag: '🇺🇿', rate: 0.30, symbol: 'UZS' },
  { code: 'KGS', name: 'Kyrgyzstani Som', country: 'Kyrgyzstan', flag: '🇰🇬', rate: 44.25, symbol: 'KGS' },
  { code: 'TJS', name: 'Tajikistani Somoni', country: 'Tajikistan', flag: '🇹🇯', rate: 343.00, symbol: 'SM' },
  { code: 'TMT', name: 'Turkmenistani Manat', country: 'Turkmenistan', flag: '🇹🇲', rate: 1071.00, symbol: 'm' },
  { code: 'AFN', name: 'Afghan Afghani', country: 'Afghanistan', flag: '🇦🇫', rate: 54.25, symbol: 'AFN' },
  // Middle East
  { code: 'AED', name: 'UAE Dirham', country: 'UAE', flag: '🇦🇪', rate: 1021.00, symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦', rate: 1000.00, symbol: 'SAR' },
  { code: 'QAR', name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦', rate: 1030.00, symbol: 'QAR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼', rate: 12195.00, symbol: 'KWD' },
  { code: 'BHD', name: 'Bahraini Dinar', country: 'Bahrain', flag: '🇧🇭', rate: 9947.00, symbol: 'BHD' },
  { code: 'OMR', name: 'Omani Rial', country: 'Oman', flag: '🇴🇲', rate: 9740.00, symbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', country: 'Jordan', flag: '🇯🇴', rate: 5290.00, symbol: 'JOD' },
  { code: 'LBP', name: 'Lebanese Pound', country: 'Lebanon', flag: '🇱🇧', rate: 0.04, symbol: 'LBP' },
  { code: 'SYP', name: 'Syrian Pound', country: 'Syria', flag: '🇸🇾', rate: 0.29, symbol: 'SYP' },
  { code: 'IQD', name: 'Iraqi Dinar', country: 'Iraq', flag: '🇮🇶', rate: 2.86, symbol: 'IQD' },
  { code: 'IRR', name: 'Iranian Rial', country: 'Iran', flag: '🇮🇷', rate: 0.09, symbol: 'IRR' },
  { code: 'ILS', name: 'Israeli Shekel', country: 'Israel', flag: '🇮🇱', rate: 1025.00, symbol: 'ILS' },
  { code: 'YER', name: 'Yemeni Rial', country: 'Yemen', flag: '🇾🇪', rate: 15.00, symbol: 'YER' },
  // Oceania
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', flag: '🇦🇺', rate: 2450.00, symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', country: 'New Zealand', flag: '🇳🇿', rate: 2265.00, symbol: 'NZ$' },
  { code: 'FJD', name: 'Fijian Dollar', country: 'Fiji', flag: '🇫🇯', rate: 1675.00, symbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinea Kina', country: 'Papua New Guinea', flag: '🇵🇬', rate: 985.00, symbol: 'K' },
  { code: 'SBD', name: 'Solomon Islands Dollar', country: 'Solomon Islands', flag: '🇸🇧', rate: 445.00, symbol: 'SI$' },
  { code: 'VUV', name: 'Vanuatu Vatu', country: 'Vanuatu', flag: '🇻🇺', rate: 31.50, symbol: 'VT' },
  { code: 'WST', name: 'Samoan Tala', country: 'Samoa', flag: '🇼🇸', rate: 1385.00, symbol: 'WS$' },
  { code: 'TOP', name: 'Tongan Paanga', country: 'Tonga', flag: '🇹🇴', rate: 1595.00, symbol: 'T$' },
  { code: 'XPF', name: 'CFP Franc', country: 'French Pacific', flag: '🇵🇫', rate: 33.95, symbol: 'XPF' },
];

// Ad Banner Component - Theme aware
const AdBanner = ({ position, colors }: { position: string; colors: any }) => (
  <View style={[styles.adBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[styles.adLabel, { color: colors.textMuted }]}>SPONSORED</Text>
    <View style={[styles.adPlaceholder, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      <Text style={[styles.adPlaceholderText, { color: colors.textSecondary }]}>📢 Ad Space</Text>
      <Text style={[styles.adPlaceholderSubtext, { color: colors.textMuted }]}>Banner {position}</Text>
    </View>
  </View>
);


export default function ExchangeRatesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [baseCurrency, setBaseCurrency] = useState<Currency>(ALL_CURRENCIES[0]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CURRENCIES;
    const query = searchQuery.toLowerCase();
    return ALL_CURRENCIES.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const displayRates = useMemo(() => {
    return ALL_CURRENCIES.filter(c => c.code !== baseCurrency.code).map(currency => ({
      ...currency,
      convertedRate: currency.rate / baseCurrency.rate,
    }));
  }, [baseCurrency]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatRate = (rate: number) => {
    if (rate >= 1000) return rate.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (rate >= 1) return rate.toFixed(2);
    if (rate >= 0.01) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={[styles.pickerItem, { backgroundColor: colors.card }]}
      onPress={() => {
        setBaseCurrency(item);
        setShowCurrencyPicker(false);
        setSearchQuery('');
      }}
    >
      <Text style={styles.pickerFlag}>{item.flag}</Text>
      <View style={styles.pickerInfo}>
        <Text style={[styles.pickerCode, { color: colors.text }]}>{item.code}</Text>
        <Text style={[styles.pickerName, { color: colors.textSecondary }]}>{item.country}</Text>
      </View>
      {item.code === baseCurrency.code && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('exchange.rates')}</Text>
        <View style={styles.placeholder} />
      </View>

      <AdBanner position="top" colors={colors} />

      <TouchableOpacity
        style={[styles.currencySelector, { backgroundColor: colors.card }]}
        onPress={() => setShowCurrencyPicker(true)}
      >
        <View style={styles.selectorLeft}>
          <Text style={styles.selectorFlag}>{baseCurrency.flag}</Text>
          <View>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Base Currency</Text>
            <Text style={[styles.selectorValue, { color: colors.text }]}>
              {baseCurrency.code} - {baseCurrency.name}
            </Text>
          </View>
        </View>
        <Text style={[styles.selectorArrow, { color: colors.primary }]}>▼</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated Today at {formatTime(lastUpdated)}
        </Text>
        <Text style={[styles.ratesCount, { color: colors.textSecondary }]}>
          {displayRates.length} currencies available
        </Text>

        {displayRates.slice(0, 25).map((rate) => (
          <View key={rate.code} style={[styles.rateCard, { backgroundColor: colors.card }]}>
            <Text style={styles.flag}>{rate.flag}</Text>
            <View style={styles.rateInfo}>
              <Text style={[styles.currencyName, { color: colors.text }]}>{rate.name}</Text>
              <Text style={[styles.countryName, { color: colors.textSecondary }]}>
                {rate.country} ({rate.code})
              </Text>
            </View>
            <View style={styles.rateValueContainer}>
              <Text style={[styles.rateValue, { color: colors.text }]}>
                {rate.symbol} {formatRate(rate.convertedRate)}
              </Text>
              <Text style={[styles.rateBase, { color: colors.textSecondary }]}>= 1 {baseCurrency.code}</Text>
            </View>
          </View>
        ))}

        <AdBanner position="middle" colors={colors} />

        {displayRates.slice(25).map((rate) => (
          <View key={rate.code} style={[styles.rateCard, { backgroundColor: colors.card }]}>
            <Text style={styles.flag}>{rate.flag}</Text>
            <View style={styles.rateInfo}>
              <Text style={[styles.currencyName, { color: colors.text }]}>{rate.name}</Text>
              <Text style={[styles.countryName, { color: colors.textSecondary }]}>
                {rate.country} ({rate.code})
              </Text>
            </View>
            <View style={styles.rateValueContainer}>
              <Text style={[styles.rateValue, { color: colors.text }]}>
                {rate.symbol} {formatRate(rate.convertedRate)}
              </Text>
              <Text style={[styles.rateBase, { color: colors.textSecondary }]}>= 1 {baseCurrency.code}</Text>
            </View>
          </View>
        ))}

        <AdBanner position="bottom" colors={colors} />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('exchange.ratesDisclaimer')}
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary, marginTop: 4 }]}>
            {t('exchange.pullToRefresh')}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showCurrencyPicker} animationType="slide" transparent onRequestClose={() => setShowCurrencyPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('exchange.selectBaseCurrency')}</Text>
              <TouchableOpacity onPress={() => { setShowCurrencyPicker(false); setSearchQuery(''); }}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('exchange.searchCurrency')}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              renderItem={renderCurrencyItem}
              showsVerticalScrollIndicator={false}
              style={styles.currencyList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 32, fontFamily: 'Montserrat_300Light' },
  headerTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  placeholder: { width: 40 },
  adBanner: { marginHorizontal: 16, marginVertical: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  adLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  adPlaceholder: { height: 60, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  adPlaceholderText: { fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  adPlaceholderSubtext: { fontSize: 11, marginTop: 2 },
  currencySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 12 },
  selectorLeft: { flexDirection: 'row', alignItems: 'center' },
  selectorFlag: { fontSize: 32, marginRight: 12 },
  selectorLabel: { fontSize: 12 },
  selectorValue: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginTop: 2 },
  selectorArrow: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  content: { flex: 1, paddingHorizontal: 16 },
  lastUpdated: { fontSize: 13, marginBottom: 4 },
  ratesCount: { fontSize: 12, marginBottom: 16 },
  rateCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  flag: { fontSize: 32, marginRight: 12 },
  rateInfo: { flex: 1 },
  currencyName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', marginBottom: 2 },
  countryName: { fontSize: 12 },
  rateValueContainer: { alignItems: 'flex-end' },
  rateValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold' },
  rateBase: { fontSize: 11, marginTop: 2 },
  footer: { padding: 20, alignItems: 'center', marginBottom: 20 },
  footerText: { fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  modalClose: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', padding: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  clearSearch: { fontSize: 16, color: '#888', padding: 4 },
  currencyList: { paddingHorizontal: 16 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 8 },
  pickerFlag: { fontSize: 28, marginRight: 12 },
  pickerInfo: { flex: 1 },
  pickerCode: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  pickerName: { fontSize: 13, marginTop: 2 },
  checkmark: { fontSize: 18, color: '#0066FF', fontFamily: 'Montserrat_700Bold' },
});
