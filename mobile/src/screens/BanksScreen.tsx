// GMG Uganda - Banks/Bank Transfer Screen
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Bank logo images
const bankLogos: { [key: string]: any } = {
  'stanbic': require('../../assets/stanbic-bank-logo-png_seeklogo-571354.png'),
  'dfcu': require('../../assets/dfcu-bank-uganda-logo-png_seeklogo-550578.png'),
  'centenary': require('../../assets/centenary-bank-logo-png_seeklogo-410313.png'),
  'equity': require('../../assets/equity-bank-logo-png_seeklogo-223338.png'),
  'absa': require('../../assets/absa-bank-uganda-logo-png_seeklogo-550566.png'),
  'brac': require('../../assets/brac-uganda-bank-logo-png_seeklogo-550574.png'),
  'dutchbangla': require('../../assets/dutch-bangla-bank-limited-logo-png_seeklogo-289529.png'),
  'standardbank': require('../../assets/standard-bank-limited-logo-png_seeklogo-365832.png'),
  'sbi': require('../../assets/state-bank-of-india-new-logo-png_seeklogo-304818.png'),
  'boi': require('../../assets/boi-bank-of-india-logo-png_seeklogo-259662.png'),
  'hdfc': require('../../assets/hdfc-bank-logo-png_seeklogo-329217.png'),
  'westernunion': require('../../assets/western-union-logo-png_seeklogo-152417.png'),
  'moneygram': require('../../assets/money-gram-logo-png_seeklogo-273287.png'),
  'worldremit': require('../../assets/worldremit-logo-png_seeklogo-356521.png'),
  'gcb': require('../../assets/gcb-logo-png_seeklogo-518487.png'),
  'ecobank': require('../../assets/eco-bank-uganda-logo-png_seeklogo-550581.png'),
  'zenith': require('../../assets/zenith-bank-logo-png_seeklogo-316671.png'),
  'access': require('../../assets/access-bank-plc-logo-png_seeklogo-492413.png'),
  'gtbank': require('../../assets/guaranty-trust-gt-bank-uganda-logo-png_seeklogo-550680.png'),
  'kcb': require('../../assets/kcb-bank-uganda-logo-png_seeklogo-556999.png'),
  'coop': require('../../assets/co-operative-bank-of-kenya-logo-png_seeklogo-172668.png'),
  'crdb': require('../../assets/crdb-bank-tanzania-logo-png_seeklogo-356585.png'),
  'nmb': require('../../assets/nmb-bank-logo-png_seeklogo-526995.png'),
  'bankofchina': require('../../assets/bank-of-china-limited-logo-png_seeklogo-289769.png'),
  'commonwealth': require('../../assets/commonwealth-bank-logo-png_seeklogo-219412.png'),
  'anz': require('../../assets/australia-and-new-zealand-banking-group-limited-logo-png_seeklogo-396080.png'),
  'westpac': require('../../assets/westpac-logo-png_seeklogo-152472.png'),
  'rbc': require('../../assets/rbc-royal-bank-of-canada-logo-png_seeklogo-291804.png'),
  'td': require('../../assets/td-bank-logo-png_seeklogo-324608.png'),
  'spiro': require('../../assets/spiro-electric-motorbikes-uganda-logo-png_seeklogo-611240.png'),
  'cairo': require('../../assets/cairo-bank-uganda-cbu-logo-png_seeklogo-550575.png'),
  'dtb': require('../../assets/diamond-trust-bank-dtb-uganda-logo-png_seeklogo-550579.png'),
  'housing': require('../../assets/housing-finance-bank-uganda-logo-png_seeklogo-550681.png'),
  'ncba': require('../../assets/ncba-bank-uganda-logo-png_seeklogo-550938.png'),
  'opportunity': require('../../assets/opportunity-bank-uganda-logo-png_seeklogo-550940.png'),
  'pride': require('../../assets/pride-bank-uganda-logo-png_seeklogo-550942.png'),
  'uba': require('../../assets/united-bank-for-africa-uba-uganda-logo-png_seeklogo-556994.png'),
  'exim': require('../../assets/exim-bank-uganda-ebul-logo-png_seeklogo-550583.png'),
  'finance': require('../../assets/finance-trust-bank-uganda-logo-png_seeklogo-550584.png'),
  'imbank': require('../../assets/im-bank-uganda-logo-png_seeklogo-556982.png'),
  'abc': require('../../assets/abc-capital-bank-uganda-logo-png_seeklogo-550564.png'),
  'eadb': require('../../assets/east-african-development-bank-eadb-uganda-logo-png_seeklogo-550580.png'),
};

interface Bank {
  id: string;
  name: string;
  code: string;
  logo: string;
  logoKey?: string;
  region: string;
  accountDigits: number;
  accountFormat: string;
  requiresBranch?: boolean;
  requiresRoutingNumber?: boolean;
  requiresIBAN?: boolean;
  currency: string;
}

// Banks organized by region with account format details
const BANKS: Bank[] = [
  // East Africa - Uganda (Most Uganda banks use 13-16 digit accounts)
  { id: '1', name: 'Stanbic Bank Uganda', code: 'SBICUGKA', logo: '🏦', logoKey: 'stanbic', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '2', name: 'DFCU Bank', code: 'DFCUUGKA', logo: '🏛️', logoKey: 'dfcu', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '3', name: 'Centenary Bank', code: 'CEABORUGKA', logo: '🏦', logoKey: 'centenary', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '4', name: 'Equity Bank Uganda', code: 'EQABORUGKA', logo: '🏛️', logoKey: 'equity', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '5', name: 'Absa Bank Uganda', code: 'ABSAUGKA', logo: '🏛️', logoKey: 'absa', region: 'Uganda', accountDigits: 12, accountFormat: '000000000000', currency: 'UGX' },
  { id: '6', name: 'KCB Bank Uganda', code: 'KCBUGKA', logo: '🏦', logoKey: 'kcb', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '7', name: 'Ecobank Uganda', code: 'ECOBUGKA', logo: '🏦', logoKey: 'ecobank', region: 'Uganda', accountDigits: 16, accountFormat: '0000000000000000', currency: 'UGX' },
  { id: '8', name: 'GTBank Uganda', code: 'GTBUGKA', logo: '🏛️', logoKey: 'gtbank', region: 'Uganda', accountDigits: 10, accountFormat: '0000000000', currency: 'UGX' },
  { id: '9', name: 'UBA Uganda', code: 'UBAUGKA', logo: '🏦', logoKey: 'uba', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '10', name: 'Cairo Bank Uganda', code: 'CAIROUGKA', logo: '🏛️', logoKey: 'cairo', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '11', name: 'DTB Uganda', code: 'DTBUGKA', logo: '🏦', logoKey: 'dtb', region: 'Uganda', accountDigits: 12, accountFormat: '000000000000', currency: 'UGX' },
  { id: '12', name: 'Housing Finance Bank', code: 'HFBUGKA', logo: '🏛️', logoKey: 'housing', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '13', name: 'NCBA Bank Uganda', code: 'NCBAUGKA', logo: '🏦', logoKey: 'ncba', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '14', name: 'Opportunity Bank Uganda', code: 'OPPUGKA', logo: '🏛️', logoKey: 'opportunity', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '15', name: 'Pride Microfinance', code: 'PRIDEUGKA', logo: '🏦', logoKey: 'pride', region: 'Uganda', accountDigits: 12, accountFormat: '000000000000', currency: 'UGX' },
  { id: '16', name: 'Exim Bank Uganda', code: 'EXIMUGKA', logo: '🏛️', logoKey: 'exim', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '17', name: 'Finance Trust Bank', code: 'FTBUGKA', logo: '🏦', logoKey: 'finance', region: 'Uganda', accountDigits: 13, accountFormat: '0000000000000', currency: 'UGX' },
  { id: '18', name: 'I&M Bank Uganda', code: 'IMBUGKA', logo: '🏛️', logoKey: 'imbank', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '19', name: 'ABC Capital Bank', code: 'ABCUGKA', logo: '🏦', logoKey: 'abc', region: 'Uganda', accountDigits: 12, accountFormat: '000000000000', currency: 'UGX' },
  { id: '20', name: 'EADB Uganda', code: 'EADBUGKA', logo: '🏛️', logoKey: 'eadb', region: 'Uganda', accountDigits: 14, accountFormat: '00000000000000', currency: 'UGX' },
  { id: '21', name: 'Spiro Uganda', code: 'SPIROUG', logo: '🛵', logoKey: 'spiro', region: 'Uganda', accountDigits: 10, accountFormat: '0000000000', currency: 'UGX' },
  
  // East Africa - Kenya (Kenya banks use 10-14 digit accounts)
  { id: '22', name: 'Equity Bank Kenya', code: 'EQBLKENX', logo: '🏦', logoKey: 'equity', region: 'Kenya', accountDigits: 13, accountFormat: '0000000000000', currency: 'KES' },
  { id: '23', name: 'KCB Bank Kenya', code: 'KCBLKENX', logo: '🏛️', logoKey: 'kcb', region: 'Kenya', accountDigits: 13, accountFormat: '0000000000000', currency: 'KES' },
  { id: '24', name: 'Co-operative Bank Kenya', code: 'COOPKENX', logo: '🏦', logoKey: 'coop', region: 'Kenya', accountDigits: 14, accountFormat: '00000000000000', currency: 'KES' },
  
  // East Africa - Tanzania
  { id: '25', name: 'CRDB Bank', code: 'CRDBTZTZ', logo: '🏛️', logoKey: 'crdb', region: 'Tanzania', accountDigits: 16, accountFormat: '0000000000000000', currency: 'TZS' },
  { id: '26', name: 'NMB Bank Tanzania', code: 'NMBATZTZ', logo: '🏦', logoKey: 'nmb', region: 'Tanzania', accountDigits: 14, accountFormat: '00000000000000', currency: 'TZS' },
  
  // South Asia - Bangladesh (Bangladesh banks use 13-17 digit accounts)
  { id: '27', name: 'BRAC Bank', code: 'BABORAKBDDH', logo: '🏛️', logoKey: 'brac', region: 'Bangladesh', accountDigits: 17, accountFormat: '00000000000000000', currency: 'BDT' },
  { id: '28', name: 'Dutch-Bangla Bank', code: 'DBBLBDDH', logo: '🏦', logoKey: 'dutchbangla', region: 'Bangladesh', accountDigits: 16, accountFormat: '0000000000000000', currency: 'BDT' },
  { id: '29', name: 'Standard Bank Limited', code: 'SDBLBDDH', logo: '🏛️', logoKey: 'standardbank', region: 'Bangladesh', accountDigits: 13, accountFormat: '0000000000000', currency: 'BDT' },
  
  // South Asia - India (India uses IFSC code + 9-18 digit accounts)
  { id: '30', name: 'State Bank of India', code: 'SBININBB', logo: '🏛️', logoKey: 'sbi', region: 'India', accountDigits: 17, accountFormat: '00000000000000000', requiresBranch: true, currency: 'INR' },
  { id: '31', name: 'Bank of India', code: 'BABORINBB', logo: '🏦', logoKey: 'boi', region: 'India', accountDigits: 15, accountFormat: '000000000000000', requiresBranch: true, currency: 'INR' },
  { id: '32', name: 'HDFC Bank', code: 'HDFCINBB', logo: '🏛️', logoKey: 'hdfc', region: 'India', accountDigits: 14, accountFormat: '00000000000000', requiresBranch: true, currency: 'INR' },
  
  // Africa - Nigeria (Nigeria banks use 10 digit NUBAN accounts)
  { id: '33', name: 'GTBank Nigeria', code: 'GTBINGLA', logo: '🏦', logoKey: 'gtbank', region: 'Nigeria', accountDigits: 10, accountFormat: '0000000000', currency: 'NGN' },
  { id: '34', name: 'Zenith Bank', code: 'ZENINGLA', logo: '🏛️', logoKey: 'zenith', region: 'Nigeria', accountDigits: 10, accountFormat: '0000000000', currency: 'NGN' },
  { id: '35', name: 'Access Bank Nigeria', code: 'ACCESSNGLA', logo: '🏦', logoKey: 'access', region: 'Nigeria', accountDigits: 10, accountFormat: '0000000000', currency: 'NGN' },
  
  // Africa - Ghana (Ghana banks use 13-16 digit accounts)
  { id: '36', name: 'GCB Bank', code: 'GCBLGHAC', logo: '🏛️', logoKey: 'gcb', region: 'Ghana', accountDigits: 13, accountFormat: '0000000000000', currency: 'GHS' },
  { id: '37', name: 'Ecobank Ghana', code: 'ECOBGHAC', logo: '🏦', logoKey: 'ecobank', region: 'Ghana', accountDigits: 16, accountFormat: '0000000000000000', currency: 'GHS' },
  
  // International - Money Transfer
  { id: '38', name: 'Western Union', code: 'WUNIUS', logo: '💸', logoKey: 'westernunion', region: 'International', accountDigits: 10, accountFormat: 'MTCN Number', currency: 'USD' },
  { id: '39', name: 'MoneyGram', code: 'MGRAMUS', logo: '💵', logoKey: 'moneygram', region: 'International', accountDigits: 8, accountFormat: 'Reference #', currency: 'USD' },
  { id: '40', name: 'WorldRemit', code: 'WREMIT', logo: '🌍', logoKey: 'worldremit', region: 'International', accountDigits: 12, accountFormat: 'Transaction ID', currency: 'USD' },
  
  // China Banks (China uses 16-19 digit accounts)
  { id: '41', name: 'Bank of China', code: 'BKCHCNBJ', logo: '🏦', logoKey: 'bankofchina', region: 'China', accountDigits: 19, accountFormat: '0000000000000000000', currency: 'CNY' },
  
  // Australia Banks (Australia uses BSB + 6-9 digit accounts)
  { id: '42', name: 'Commonwealth Bank', code: 'CTBAAU2S', logo: '🏛️', logoKey: 'commonwealth', region: 'Australia', accountDigits: 9, accountFormat: '000000000', requiresBranch: true, currency: 'AUD' },
  { id: '43', name: 'ANZ Bank', code: 'ANZBAU3M', logo: '🏦', logoKey: 'anz', region: 'Australia', accountDigits: 9, accountFormat: '000000000', requiresBranch: true, currency: 'AUD' },
  { id: '44', name: 'Westpac', code: 'WPACAU2S', logo: '🏛️', logoKey: 'westpac', region: 'Australia', accountDigits: 9, accountFormat: '000000000', requiresBranch: true, currency: 'AUD' },
  
  // Canada Banks (Canada uses 5-digit transit + 7-12 digit accounts)
  { id: '45', name: 'Royal Bank of Canada', code: 'ROYCCAT2', logo: '🏦', logoKey: 'rbc', region: 'Canada', accountDigits: 12, accountFormat: '000000000000', requiresRoutingNumber: true, currency: 'CAD' },
  { id: '46', name: 'TD Bank Canada', code: 'TDOMCATTTOR', logo: '🏛️', logoKey: 'td', region: 'Canada', accountDigits: 12, accountFormat: '000000000000', requiresRoutingNumber: true, currency: 'CAD' },
];

// Map phone dial codes to regions
const dialCodeToRegion: { [key: string]: string } = {
  '+256': 'Uganda',
  '+254': 'Kenya',
  '+255': 'Tanzania',
  '+250': 'Rwanda',
  '+880': 'Bangladesh',
  '+91': 'India',
  '+27': 'South Africa',
  '+234': 'Nigeria',
  '+233': 'Ghana',
  '+1': 'USA',
  '+44': 'UK',
  '+49': 'Europe',
  '+33': 'Europe',
  '+31': 'Europe',
  '+41': 'Europe',
  '+86': 'China',
  '+971': 'UAE',
  '+61': 'Australia',
};

// Get region from phone number
const getRegionFromPhone = (phone: string): string => {
  for (const [dialCode, region] of Object.entries(dialCodeToRegion)) {
    if (phone.startsWith(dialCode)) {
      return region;
    }
  }
  return 'Uganda'; // Default to Uganda
};

// Transaction Receipt Interface
interface TransactionReceipt {
  referenceNumber: string;
  transactionId: string;
  timestamp: string;
  senderName: string;
  senderAccount: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  bankCode: string;
  amount: number;
  currency: string;
  fee: number;
  totalAmount: number;
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING';
}

export default function BanksScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [accountError, setAccountError] = useState('');
  
  // PIN and Receipt states
  const [showPinModal, setShowPinModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [transactionReceipt, setTransactionReceipt] = useState<TransactionReceipt | null>(null);

  // KYC Verification Check - Bank transfers require verified KYC
  const isKYCVerified = user?.kycStatus === 'VERIFIED';
  const hasValidKYCTier = (user?.kycTier ?? 0) >= 2; // Tier 2+ required for bank transfers
  const canUseBankTransfer = isKYCVerified && hasValidKYCTier;

  // Get user's region from phone number
  const userRegion = useMemo(() => {
    if (user?.phone) {
      return getRegionFromPhone(user.phone);
    }
    return 'Uganda';
  }, [user?.phone]);

  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(BANKS.map(b => b.region))];
    // Put user's region first, then International, then alphabetically
    return uniqueRegions.sort((a, b) => {
      if (a === userRegion) return -1;
      if (b === userRegion) return 1;
      if (a === 'International') return -1;
      if (b === 'International') return 1;
      return a.localeCompare(b);
    });
  }, [userRegion]);

  // Sort and filter banks - user's region first
  const sortedBanks = useMemo(() => {
    let filtered = BANKS;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by selected region
    if (selectedRegion) {
      filtered = filtered.filter(b => b.region === selectedRegion);
    }
    
    // Sort: user's region first, then International, then others
    return filtered.sort((a, b) => {
      if (a.region === userRegion && b.region !== userRegion) return -1;
      if (b.region === userRegion && a.region !== userRegion) return 1;
      if (a.region === 'International' && b.region !== 'International') return -1;
      if (b.region === 'International' && a.region !== 'International') return 1;
      return a.region.localeCompare(b.region);
    });
  }, [searchQuery, selectedRegion, userRegion]);

  const verifyAccount = async () => {
    // KYC Check - Must be verified to use bank transfers
    if (!canUseBankTransfer) {
      Alert.alert(
        'KYC Required',
        'Bank transfers require verified KYC (Tier 2 or higher). Please complete your KYC verification first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify KYC', onPress: () => navigation.navigate('KYC') }
        ]
      );
      return;
    }

    if (!selectedBank || accountNumber.length < 8) {
      Alert.alert('Error', 'Please select a bank and enter account number');
      return;
    }

    // Validate account number length
    if (selectedBank && accountNumber.length !== selectedBank.accountDigits) {
      setAccountError(`Account number must be ${selectedBank.accountDigits} digits for ${selectedBank.name}`);
      return;
    }

    // Validate branch code if required
    if (selectedBank?.requiresBranch && !branchCode) {
      Alert.alert('Error', 'Branch code/IFSC is required for this bank');
      return;
    }

    // Validate routing number if required
    if (selectedBank?.requiresRoutingNumber && !routingNumber) {
      Alert.alert('Error', 'Routing/Transit number is required for this bank');
      return;
    }

    setAccountError('');
    setVerifying(true);
    
    try {
      // Call bank verification API using the api service
      const response = await api.post('/bank/verify-account', {
        bankCode: selectedBank.code,
        accountNumber: accountNumber,
        branchCode: branchCode || undefined,
        routingNumber: routingNumber || undefined,
        region: selectedBank.region,
      });
      
      if (response.success && response.data?.accountName) {
        setAccountName(response.data.accountName);
        setAccountError('');
      } else {
        // Real error - no mock fallback
        setAccountError(response.error || 'Account verification failed. Please check the account number and try again.');
        setAccountName('');
      }
    } catch (error: any) {
      // Real error handling - no mock data
      console.error('[BankTransfer] Account verification error:', error);
      setAccountError('Unable to verify account. Bank verification service unavailable.');
      setAccountName('');
    } finally {
      setVerifying(false);
    }
  };

  const handleTransfer = async () => {
    // KYC Check - Must be verified to use bank transfers
    if (!canUseBankTransfer) {
      Alert.alert(
        'KYC Required',
        'Bank transfers require verified KYC (Tier 2 or higher). Please complete your KYC verification first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify KYC', onPress: () => navigation.navigate('KYC') }
        ]
      );
      return;
    }

    if (!selectedBank || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Validate account number length
    if (accountNumber.length !== selectedBank.accountDigits) {
      Alert.alert('Error', `Account number must be ${selectedBank.accountDigits} digits`);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      Alert.alert('Error', 'Minimum transfer amount is 1,000');
      return;
    }

    if (!accountName) {
      Alert.alert('Error', 'Please verify the account first');
      return;
    }

    // Show PIN modal for confirmation
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const verifyPinAndTransfer = async () => {
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    setPinError('');

    try {
      // Verify PIN with backend using api service - NO MOCK FALLBACK
      const pinResponse = await api.post('/auth/verify-pin', { pin });
      
      if (!pinResponse.success) {
        setPinError(pinResponse.error || 'Invalid PIN');
        setLoading(false);
        return;
      }

      // PIN verified, execute transfer
      await executeTransfer();
    } catch (error: any) {
      // Real error handling - no mock PIN acceptance
      console.error('[BankTransfer] PIN verification error:', error);
      setPinError('PIN verification failed. Please try again.');
      setLoading(false);
    }
  };

  const executeTransfer = async () => {
    if (!selectedBank) return;
    
    const amountNum = parseFloat(amount);
    
    try {
      const response = await api.post('/bank/transfer', {
        bankCode: selectedBank.code,
        accountNumber,
        accountName,
        branchCode: branchCode || undefined,
        routingNumber: routingNumber || undefined,
        amount: amountNum,
        currency: selectedBank.currency,
        reference: reference || 'Bank Transfer',
      });
      
      if (response.success && response.data) {
        generateReceipt(response.data.transactionId, response.data.referenceNumber);
      } else {
        // Real error - no mock fallback
        Alert.alert('Transfer Failed', response.error || 'Unable to process transfer. Please try again.');
        setLoading(false);
        setShowPinModal(false);
      }
    } catch (error: any) {
      // Real error handling - no mock receipt generation
      console.error('[BankTransfer] Transfer execution error:', error);
      Alert.alert('Transfer Failed', 'Bank transfer service unavailable. Please try again later.');
      setLoading(false);
      setShowPinModal(false);
    }
  };

  const generateReceipt = (transactionId: string, referenceNumber: string) => {
    if (!selectedBank) return;
    
    const amountNum = parseFloat(amount);
    const fee = Math.max(500, amountNum * 0.01);
    
    // Get user display name
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.firstName || 'GMG User';
    
    const receipt: TransactionReceipt = {
      referenceNumber,
      transactionId,
      timestamp: new Date().toISOString(),
      senderName: userName,
      senderAccount: user?.phone || 'N/A',
      recipientName: accountName,
      recipientAccount: accountNumber,
      recipientBank: selectedBank.name,
      bankCode: selectedBank.code,
      amount: amountNum,
      currency: selectedBank.currency,
      fee,
      totalAmount: amountNum + fee,
      reference: reference || 'Bank Transfer',
      status: 'COMPLETED',
    };

    setTransactionReceipt(receipt);
    setShowPinModal(false);
    setShowReceiptModal(true);
    setLoading(false);
  };

  const closeReceiptAndReset = () => {
    setShowReceiptModal(false);
    setTransactionReceipt(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setBranchCode('');
    setRoutingNumber('');
    setAmount('');
    setReference('');
    setAccountError('');
    setPin('');
    setPinError('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('banks.title')}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* KYC Restriction Banner */}
        {!canUseBankTransfer && (
          <View style={styles.kycBanner}>
            <Text style={styles.kycBannerIcon}>🔒</Text>
            <View style={styles.kycBannerContent}>
              <Text style={styles.kycBannerTitle}>KYC Verification Required</Text>
              <Text style={styles.kycBannerText}>
                Bank transfers require verified KYC (Tier 2 or higher). 
                {!isKYCVerified && ' Your KYC is not verified.'}
                {isKYCVerified && !hasValidKYCTier && ' Please upgrade to Tier 2.'}
              </Text>
              <TouchableOpacity 
                style={styles.kycBannerBtn}
                onPress={() => navigation.navigate('KYC')}
              >
                <Text style={styles.kycBannerBtnText}>Complete KYC →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Select Bank */}
        <View style={[styles.section, !canUseBankTransfer && styles.sectionDisabled]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('banks.selectBank')}</Text>
          
          {/* Search Bar */}
          <TextInput
            style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
            placeholder="Search banks..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          {/* Region Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionFilter}>
            <TouchableOpacity
              style={[styles.regionChip, !selectedRegion && styles.regionChipActive]}
              onPress={() => setSelectedRegion(null)}
            >
              <Text style={[styles.regionChipText, !selectedRegion && styles.regionChipTextActive]}>All</Text>
            </TouchableOpacity>
            {regions.map(region => (
              <TouchableOpacity
                key={region}
                style={[styles.regionChip, selectedRegion === region && styles.regionChipActive]}
                onPress={() => setSelectedRegion(region === selectedRegion ? null : region)}
              >
                <Text style={[styles.regionChipText, selectedRegion === region && styles.regionChipTextActive]}>
                  {region === userRegion ? `📍 ${region}` : region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Banks Grid */}
          <View style={styles.banksGrid}>
            {sortedBanks.map(bank => (
              <TouchableOpacity
                key={bank.id}
                style={[styles.bankCard, selectedBank?.id === bank.id && styles.bankSelected]}
                onPress={() => { setSelectedBank(bank); setAccountName(''); setAccountNumber(''); setBranchCode(''); setRoutingNumber(''); setAccountError(''); }}
              >
                {bank.logoKey && bankLogos[bank.logoKey] ? (
                  <Image source={bankLogos[bank.logoKey]} style={styles.bankLogoImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.bankLogo}>{bank.logo}</Text>
                )}
                <Text style={[styles.bankName, { color: colors.text }]} numberOfLines={2}>{bank.name}</Text>
                <Text style={[styles.bankRegion, { color: colors.textMuted }]}>{bank.region}</Text>
                {selectedBank?.id === bank.id && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bank Transfer Form Modal */}
      <Modal visible={selectedBank !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedBank && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Bank Transfer</Text>
                  <TouchableOpacity onPress={resetForm} style={styles.modalCloseBtn}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Bank Header with Logo */}
                <View style={styles.selectedBankHeader}>
                  {selectedBank.logoKey && bankLogos[selectedBank.logoKey] ? (
                    <Image source={bankLogos[selectedBank.logoKey]} style={styles.selectedBankLogo} resizeMode="contain" />
                  ) : (
                    <Text style={styles.selectedBankEmoji}>{selectedBank.logo}</Text>
                  )}
                  <View style={styles.selectedBankInfo}>
                    <Text style={[styles.formTitle, { color: colors.text }]}>{selectedBank.name}</Text>
                    <Text style={[styles.bankFormatHint, { color: colors.textMuted }]}>
                      {selectedBank.accountDigits} digits • {selectedBank.currency}
                    </Text>
                  </View>
                </View>

                {/* Branch Code / IFSC (for India, Australia) */}
                {selectedBank.requiresBranch && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      {selectedBank.region === 'India' ? 'IFSC Code' : selectedBank.region === 'Australia' ? 'BSB Code' : 'Branch Code'}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                      value={branchCode}
                      onChangeText={setBranchCode}
                      placeholder={selectedBank.region === 'India' ? 'e.g., SBIN0001234' : selectedBank.region === 'Australia' ? 'e.g., 062-000' : 'Enter branch code'}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      maxLength={selectedBank.region === 'India' ? 11 : 7}
                    />
              </View>
            )}

            {/* Routing Number (for Canada, USA) */}
            {selectedBank.requiresRoutingNumber && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedBank.region === 'Canada' ? 'Transit Number' : 'Routing Number'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                  value={routingNumber}
                  onChangeText={setRoutingNumber}
                  placeholder={selectedBank.region === 'Canada' ? 'e.g., 12345-001' : 'e.g., 021000021'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={12}
                />
              </View>
            )}
            
            {/* Account Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('banks.accountNumber')} ({selectedBank.accountDigits} digits)
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text }, accountError && styles.inputError]}
                  value={accountNumber}
                  onChangeText={(text) => { 
                    const numericText = text.replace(/[^0-9]/g, '');
                    setAccountNumber(numericText); 
                    setAccountName(''); 
                    setAccountError('');
                  }}
                  placeholder={selectedBank.accountFormat}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={selectedBank.accountDigits}
                />
                <TouchableOpacity 
                  style={[styles.verifyBtn, (accountNumber.length !== selectedBank.accountDigits || verifying) && styles.verifyBtnDisabled]} 
                  onPress={verifyAccount}
                  disabled={accountNumber.length !== selectedBank.accountDigits || verifying}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.verifyBtnText}>{t('banks.verify')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {/* Digit Counter */}
              <View style={styles.digitCounterRow}>
                <Text style={[styles.digitCounter, { color: accountNumber.length === selectedBank.accountDigits ? '#10B981' : colors.textMuted }]}>
                  {accountNumber.length}/{selectedBank.accountDigits} digits
                </Text>
                {accountError ? <Text style={styles.errorText}>{accountError}</Text> : null}
              </View>
            </View>

            {accountName && (
              <View style={styles.verifiedBox}>
                <Text style={styles.verifiedLabel}>{t('banks.accountName')}</Text>
                <Text style={styles.verifiedName}>{accountName}</Text>
                <Text style={styles.verifiedCheck}>✓ {t('banks.verified')}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({selectedBank.currency})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {[50000, 100000, 200000, 500000].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickBtn, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => setAmount(amt.toString())}
                >
                  <Text style={[styles.quickBtnText, { color: colors.textSecondary }]}>{(amt/1000)}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reference/Reason Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reference / Reason</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={reference}
                onChangeText={setReference}
                placeholder="e.g., Payment for services, Family support"
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />
              <Text style={[styles.digitCounter, { color: colors.textMuted, marginTop: 4 }]}>
                {reference.length}/100 characters
              </Text>
            </View>

            {/* Transfer Summary */}
            {accountName && amount && parseFloat(amount) >= 1000 && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Transfer Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount</Text>
                  <Text style={styles.summaryValue}>{parseInt(amount).toLocaleString()} {selectedBank.currency}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fee (1%)</Text>
                  <Text style={styles.summaryValue}>{Math.max(500, parseFloat(amount) * 0.01).toLocaleString()} {selectedBank.currency}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{(parseFloat(amount) + Math.max(500, parseFloat(amount) * 0.01)).toLocaleString()} {selectedBank.currency}</Text>
                </View>
              </View>
            )}

            {/* Transfer Button */}
            <TouchableOpacity
              style={[styles.transferBtn, (!accountName || !amount || loading) && styles.transferBtnDisabled]}
              onPress={handleTransfer}
              disabled={!accountName || !amount || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.transferBtnText}>{t('banks.transferToBank')}</Text>
              )}
            </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal visible={showPinModal} animationType="fade" transparent>
        <View style={styles.pinModalOverlay}>
          <View style={[styles.pinModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.pinModalHeader}>
              <Text style={[styles.pinModalTitle, { color: colors.text }]}>🔐 Enter PIN</Text>
              <TouchableOpacity onPress={() => { setShowPinModal(false); setPin(''); setPinError(''); setLoading(false); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.pinModalSubtitle, { color: colors.textMuted }]}>
              Enter your 4-digit PIN to confirm this transfer
            </Text>

            {/* Transfer Preview */}
            <View style={styles.pinTransferPreview}>
              <Text style={styles.pinPreviewLabel}>Sending</Text>
              <Text style={styles.pinPreviewAmount}>
                {amount ? parseInt(amount).toLocaleString() : '0'} {selectedBank?.currency || 'UGX'}
              </Text>
              <Text style={styles.pinPreviewTo}>to {accountName}</Text>
              <Text style={styles.pinPreviewBank}>{selectedBank?.name}</Text>
            </View>

            {/* PIN Input */}
            <View style={styles.pinInputContainer}>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={pin}
                onChangeText={(text) => { setPin(text.replace(/[^0-9]/g, '')); setPinError(''); }}
                placeholder="• • • •"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
              {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.pinConfirmBtn, (pin.length < 4 || loading) && styles.pinConfirmBtnDisabled]}
              onPress={verifyPinAndTransfer}
              disabled={pin.length < 4 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.pinConfirmBtnText}>Confirm Transfer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Receipt Modal */}
      <Modal visible={showReceiptModal} animationType="slide" transparent>
        <View style={styles.receiptModalOverlay}>
          <View style={[styles.receiptModalContent, { backgroundColor: colors.card }]}>
            {transactionReceipt && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Success Header */}
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptSuccessIcon}>
                    <Text style={styles.receiptSuccessEmoji}>✓</Text>
                  </View>
                  <Text style={styles.receiptSuccessTitle}>Transfer Successful!</Text>
                  <Text style={styles.receiptAmount}>
                    {transactionReceipt.amount.toLocaleString()} {transactionReceipt.currency}
                  </Text>
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptCard}>
                  <Text style={styles.receiptCardTitle}>Transaction Receipt</Text>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Reference Number</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.referenceNumber}</Text>
                  </View>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction ID</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.transactionId}</Text>
                  </View>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date & Time</Text>
                    <Text style={styles.receiptValue}>
                      {new Date(transactionReceipt.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>From</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.senderName}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>To</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.recipientName}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Account</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.recipientAccount}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Bank</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.recipientBank}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Bank Code</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.bankCode}</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Amount</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.amount.toLocaleString()} {transactionReceipt.currency}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Fee</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.fee.toLocaleString()} {transactionReceipt.currency}</Text>
                  </View>

                  <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                    <Text style={styles.receiptTotalLabel}>Total Debited</Text>
                    <Text style={styles.receiptTotalValue}>{transactionReceipt.totalAmount.toLocaleString()} {transactionReceipt.currency}</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Reference</Text>
                    <Text style={styles.receiptValue}>{transactionReceipt.reference}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status</Text>
                    <View style={styles.receiptStatusBadge}>
                      <Text style={styles.receiptStatusText}>{transactionReceipt.status}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.receiptActions}>
                  <TouchableOpacity style={styles.receiptShareBtn}>
                    <Text style={styles.receiptShareBtnText}>📤 Share Receipt</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.receiptDoneBtn} onPress={closeReceiptAndReset}>
                    <Text style={styles.receiptDoneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  // KYC Banner styles
  kycBanner: { flexDirection: 'row', backgroundColor: '#7C2D12', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DC2626' },
  kycBannerIcon: { fontSize: 28, marginRight: 12 },
  kycBannerContent: { flex: 1 },
  kycBannerTitle: { color: '#FCA5A5', fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  kycBannerText: { color: '#FECACA', fontSize: 12, fontFamily: 'Montserrat_400Regular', marginBottom: 8 },
  kycBannerBtn: { backgroundColor: '#DC2626', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  kycBannerBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  section: { padding: 16 },
  sectionDisabled: { opacity: 0.5, pointerEvents: 'none' },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  searchBar: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, fontFamily: 'Montserrat_400Regular' },
  regionFilter: { marginBottom: 16 },
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2a2a3e', marginRight: 8 },
  regionChipActive: { backgroundColor: '#0066FF' },
  regionChipText: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  regionChipTextActive: { color: '#fff' },
  banksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bankCard: { width: '30%', padding: 8, alignItems: 'center' },
  bankSelected: { backgroundColor: 'rgba(0, 102, 255, 0.1)' },
  bankLogo: { fontSize: 40, marginBottom: 4 },
  bankLogoImage: { width: 55, height: 55, marginBottom: 4 },
  bankName: { fontSize: 9, textAlign: 'center', fontFamily: 'Montserrat_500Medium' },
  bankRegion: { fontSize: 8, marginTop: 2, fontFamily: 'Montserrat_400Regular' },
  checkBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#0066FF', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  formCard: { margin: 16, padding: 16, borderRadius: 16 },
  formTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  selectedBankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  selectedBankLogo: { width: 50, height: 50, marginRight: 14 },
  selectedBankEmoji: { fontSize: 44, marginRight: 14 },
  selectedBankInfo: { flex: 1 },
  bankFormatHint: { fontSize: 12, marginTop: 4 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#CCCCCC', fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { borderRadius: 10, padding: 14, fontSize: 16 },
  inputError: { borderWidth: 1, borderColor: '#EF4444' },
  digitCounterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  digitCounter: { fontSize: 12, fontFamily: 'Montserrat_500Medium' },
  errorText: { color: '#EF4444', fontSize: 11, fontFamily: 'Montserrat_500Medium' },
  verifyBtn: { backgroundColor: '#0066FF', paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  verifyBtnDisabled: { backgroundColor: '#4B5563' },
  verifyBtnText: { color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
  verifiedBox: { backgroundColor: '#064e3b', padding: 12, borderRadius: 10, marginBottom: 16 },
  verifiedLabel: { color: '#6EE7B7', fontSize: 12 },
  verifiedName: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  verifiedCheck: { color: '#10B981', fontSize: 12, marginTop: 4 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  quickBtnText: { color: '#CCCCCC', fontSize: 13 },
  transferBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  transferBtnDisabled: { opacity: 0.5 },
  transferBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  // Summary styles
  summaryBox: { backgroundColor: 'rgba(0, 102, 255, 0.1)', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0, 102, 255, 0.3)' },
  summaryTitle: { color: '#60A5FA', fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#9CA3AF', fontSize: 13 },
  summaryValue: { color: '#fff', fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  summaryTotalValue: { color: '#10B981', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalCloseBtn: { padding: 8 },
  modalClose: { fontSize: 24, color: '#9CA3AF' },
  // PIN Modal styles
  pinModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pinModalContent: { width: '100%', borderRadius: 24, padding: 24 },
  pinModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pinModalTitle: { fontSize: 22, fontFamily: 'Montserrat_700Bold' },
  pinModalSubtitle: { fontSize: 14, marginBottom: 20 },
  pinTransferPreview: { backgroundColor: 'rgba(0, 102, 255, 0.1)', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  pinPreviewLabel: { color: '#9CA3AF', fontSize: 12 },
  pinPreviewAmount: { color: '#fff', fontSize: 28, fontFamily: 'Montserrat_700Bold', marginVertical: 4 },
  pinPreviewTo: { color: '#60A5FA', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  pinPreviewBank: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  pinInputContainer: { marginBottom: 24 },
  pinInput: { borderRadius: 12, padding: 18, fontSize: 24, textAlign: 'center', letterSpacing: 12, fontFamily: 'Montserrat_700Bold' },
  pinErrorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 8 },
  pinConfirmBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  pinConfirmBtnDisabled: { backgroundColor: '#4B5563' },
  pinConfirmBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  // Receipt Modal styles
  receiptModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 16 },
  receiptModalContent: { borderRadius: 24, padding: 20, maxHeight: '90%' },
  receiptHeader: { alignItems: 'center', marginBottom: 24 },
  receiptSuccessIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  receiptSuccessEmoji: { fontSize: 36, color: '#fff' },
  receiptSuccessTitle: { color: '#10B981', fontSize: 22, fontFamily: 'Montserrat_700Bold' },
  receiptAmount: { color: '#fff', fontSize: 32, fontFamily: 'Montserrat_700Bold', marginTop: 8 },
  receiptCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 20 },
  receiptCardTitle: { color: '#60A5FA', fontSize: 14, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16, textAlign: 'center' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  receiptLabel: { color: '#9CA3AF', fontSize: 13 },
  receiptValue: { color: '#fff', fontSize: 13, fontFamily: 'Montserrat_500Medium', textAlign: 'right', flex: 1, marginLeft: 16 },
  receiptDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  receiptTotalRow: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 8, marginTop: 8 },
  receiptTotalLabel: { color: '#10B981', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  receiptTotalValue: { color: '#10B981', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  receiptStatusBadge: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  receiptStatusText: { color: '#fff', fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  receiptActions: { gap: 12 },
  receiptShareBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 12, alignItems: 'center' },
  receiptShareBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
  receiptDoneBtn: { backgroundColor: '#0066FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  receiptDoneBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
