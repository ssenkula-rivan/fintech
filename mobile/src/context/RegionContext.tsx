// GMG Global - Region Detection Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Country data with defaults
export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  region: 'east_africa' | 'west_africa' | 'southern_africa' | 'central_africa' | 'europe' | 'americas' | 'asia' | 'middle_east' | 'oceania';
  defaultProvider?: string;
  electricityProviders: string[];
  waterProviders: string[];
  mobileMoneyProviders: string[];
}

const COUNTRIES: { [key: string]: CountryInfo } = {
  UG: {
    code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', currencySymbol: 'UGX', phonePrefix: '+256',
    region: 'east_africa', defaultProvider: 'MTN',
    electricityProviders: ['UEDCL Light', 'LIT Prepaid'],
    waterProviders: ['NWSC Uganda'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
  },
  KE: {
    code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KES', phonePrefix: '+254',
    region: 'east_africa', defaultProvider: 'M-Pesa',
    electricityProviders: ['Kenya Power (KPLC)'],
    waterProviders: ['Nairobi Water'],
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money'],
  },
  TZ: {
    code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', currencySymbol: 'TZS', phonePrefix: '+255',
    region: 'east_africa', defaultProvider: 'M-Pesa',
    electricityProviders: ['TANESCO'],
    waterProviders: ['DAWASCO'],
    mobileMoneyProviders: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'],
  },
  RW: {
    code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', currencySymbol: 'RWF', phonePrefix: '+250',
    region: 'east_africa', defaultProvider: 'MTN',
    electricityProviders: ['REG Rwanda'],
    waterProviders: ['WASAC'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
  },
  NG: {
    code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', phonePrefix: '+234',
    region: 'west_africa', defaultProvider: 'MTN',
    electricityProviders: ['EKEDC', 'IKEDC', 'AEDC', 'PHED'],
    waterProviders: ['Lagos Water Corp'],
    mobileMoneyProviders: ['MTN MoMo', 'OPay', 'PalmPay'],
  },
  GH: {
    code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: '₵', phonePrefix: '+233',
    region: 'west_africa', defaultProvider: 'MTN',
    electricityProviders: ['ECG Ghana', 'NEDCo'],
    waterProviders: ['Ghana Water'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
  },
  ZA: {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', phonePrefix: '+27',
    region: 'southern_africa', defaultProvider: 'M-Pesa',
    electricityProviders: ['Eskom', 'City Power'],
    waterProviders: ['Rand Water', 'Johannesburg Water'],
    mobileMoneyProviders: ['M-Pesa', 'FNB eWallet'],
  },
  ZM: {
    code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW', currencySymbol: 'ZMW', phonePrefix: '+260',
    region: 'southern_africa', defaultProvider: 'MTN',
    electricityProviders: ['ZESCO'],
    waterProviders: ['Lusaka Water'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
  },
  ZW: {
    code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'USD', currencySymbol: '$', phonePrefix: '+263',
    region: 'southern_africa', defaultProvider: 'EcoCash',
    electricityProviders: ['ZESA', 'ZETDC'],
    waterProviders: ['ZINWA'],
    mobileMoneyProviders: ['EcoCash', 'OneMoney'],
  },
  CM: {
    code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'XAF', phonePrefix: '+237',
    region: 'central_africa', defaultProvider: 'MTN',
    electricityProviders: ['ENEO'],
    waterProviders: ['Camwater'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Orange Money'],
  },
  SN: {
    code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', currencySymbol: 'XOF', phonePrefix: '+221',
    region: 'west_africa', defaultProvider: 'Orange',
    electricityProviders: ['Senelec'],
    waterProviders: ['SDE'],
    mobileMoneyProviders: ['Orange Money', 'Wave'],
  },
  CI: {
    code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', currency: 'XOF', currencySymbol: 'XOF', phonePrefix: '+225',
    region: 'west_africa', defaultProvider: 'Orange',
    electricityProviders: ['CIE'],
    waterProviders: ['SODECI'],
    mobileMoneyProviders: ['Orange Money', 'MTN Mobile Money', 'Wave'],
  },
  // International
  US: {
    code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', phonePrefix: '+1',
    region: 'americas', electricityProviders: [], waterProviders: [], mobileMoneyProviders: [],
  },
  GB: {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', phonePrefix: '+44',
    region: 'europe', electricityProviders: [], waterProviders: [], mobileMoneyProviders: [],
  },
  AE: {
    code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'AED', phonePrefix: '+971',
    region: 'middle_east', electricityProviders: [], waterProviders: [], mobileMoneyProviders: [],
  },
  IN: {
    code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', phonePrefix: '+91',
    region: 'asia', electricityProviders: [], waterProviders: [], mobileMoneyProviders: ['Paytm', 'PhonePe'],
  },
  CN: {
    code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥', phonePrefix: '+86',
    region: 'asia', electricityProviders: [], waterProviders: [], mobileMoneyProviders: ['WeChat Pay', 'Alipay'],
  },
};

// Default to Uganda
const DEFAULT_COUNTRY = COUNTRIES.UG;

interface RegionContextType {
  country: CountryInfo;
  setCountry: (code: string) => void;
  isLoading: boolean;
  locationPermission: boolean;
  detectLocation: () => Promise<void>;
  allCountries: CountryInfo[];
  getCountryByCode: (code: string) => CountryInfo | undefined;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  const allCountries = Object.values(COUNTRIES);

  const getCountryByCode = (code: string): CountryInfo | undefined => {
    return COUNTRIES[code.toUpperCase()];
  };

  const setCountry = async (code: string) => {
    const countryInfo = getCountryByCode(code);
    if (countryInfo) {
      setCountryState(countryInfo);
      await AsyncStorage.setItem('user_country', code);
    }
  };

  // Reverse geocode coordinates to country
  const getCountryFromCoords = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result?.isoCountryCode) {
        return result.isoCountryCode;
      }
    } catch (error) {
      console.log('Reverse geocode error:', error);
    }
    return null;
  };

  const detectLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        
        const countryCode = await getCountryFromCoords(
          location.coords.latitude,
          location.coords.longitude
        );

        if (countryCode && COUNTRIES[countryCode]) {
          setCountryState(COUNTRIES[countryCode]);
          await AsyncStorage.setItem('user_country', countryCode);
        }
      }
    } catch (error) {
      console.log('Location detection error:', error);
    }
    setIsLoading(false);
  };

  // Load saved country or detect on mount
  useEffect(() => {
    const initRegion = async () => {
      try {
        const savedCountry = await AsyncStorage.getItem('user_country');
        if (savedCountry && COUNTRIES[savedCountry]) {
          setCountryState(COUNTRIES[savedCountry]);
          setIsLoading(false);
        } else {
          await detectLocation();
        }
      } catch (error) {
        setIsLoading(false);
      }
    };
    initRegion();
  }, []);

  return (
    <RegionContext.Provider value={{
      country,
      setCountry,
      isLoading,
      locationPermission,
      detectLocation,
      allCountries,
      getCountryByCode,
    }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

export { COUNTRIES };
