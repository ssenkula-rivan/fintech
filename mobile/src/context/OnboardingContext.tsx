// Onboarding Context - Manages walkthrough state across the app
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TooltipConfig {
  id: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface ScreenTour {
  screenName: string;
  tooltips: TooltipConfig[];
  completed: boolean;
}

interface OnboardingContextType {
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;
  currentTour: ScreenTour | null;
  currentTooltipIndex: number;
  startTour: (screenName: string) => void;
  nextTooltip: () => void;
  skipTour: () => void;
  endTour: () => void;
  hasCompletedTour: (screenName: string) => boolean;
  resetAllTours: () => void;
  showTooltip: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = '@gmg_onboarding';
const TOURS_KEY = '@gmg_completed_tours';

// Define tours for each screen
const SCREEN_TOURS: Record<string, TooltipConfig[]> = {
  Home: [
    { id: 'balance', title: '💰 Your Balance', description: 'View your available balance here. Tap the eye icon to hide/show.', position: 'bottom' },
    { id: 'deposit', title: '💵 Deposit Money', description: 'Add money to your wallet from Mobile Money or Bank.', position: 'bottom' },
    { id: 'send', title: '📤 Send Money', description: 'Send money instantly to any GMG user or Mobile Money number.', position: 'bottom' },
    { id: 'quickActions', title: '⚡ Quick Actions', description: 'Access airtime, data, bills, URA taxes and more with one tap.', position: 'top' },
    { id: 'language', title: '🌍 Change Language', description: 'Tap here to switch between 100+ languages.', position: 'bottom' },
  ],
  Send: [
    { id: 'recipient', title: '📱 Enter Recipient', description: 'Enter the phone number of the person you want to send money to.', position: 'bottom' },
    { id: 'amount', title: '💵 Enter Amount', description: 'Type the amount you want to send in UGX.', position: 'bottom' },
    { id: 'confirm', title: '✅ Confirm & Send', description: 'Review the details and enter your PIN to complete the transfer.', position: 'top' },
  ],
  Deposit: [
    { id: 'method', title: '📲 Select Method', description: 'Choose how you want to deposit - MTN, Airtel, or Bank Transfer.', position: 'bottom' },
    { id: 'amount', title: '💰 Enter Amount', description: 'Enter the amount you want to deposit.', position: 'bottom' },
    { id: 'confirm', title: '✅ Confirm Deposit', description: 'You\'ll receive a prompt on your phone to complete the deposit.', position: 'top' },
  ],
  Profile: [
    { id: 'kyc', title: '📋 Verify Identity', description: 'Complete KYC to unlock higher transaction limits.', position: 'bottom' },
    { id: 'security', title: '🔐 Security Settings', description: 'Manage your PIN, biometrics, and security preferences.', position: 'bottom' },
    { id: 'limits', title: '📊 View Limits', description: 'Check your daily transaction limits based on your KYC tier.', position: 'bottom' },
  ],
  Trading: [
    { id: 'portfolio', title: '📈 Portfolio Value', description: 'Your total investment value across all assets.', position: 'bottom' },
    { id: 'markets', title: '🌍 Markets', description: 'Trade Forex, Stocks, Crypto, and Commodities.', position: 'top' },
    { id: 'positions', title: '📊 Open Positions', description: 'View and manage your active trades here.', position: 'top' },
  ],
  URA: [
    { id: 'taxType', title: '🏛️ Select Tax Type', description: 'Choose the type of tax you want to pay.', position: 'bottom' },
    { id: 'prn', title: '📋 Enter PRN', description: 'Get your PRN from URA eTax portal or dial *285#.', position: 'bottom' },
    { id: 'validate', title: '✅ Validate & Pay', description: 'Validate your PRN to see the amount due, then pay instantly.', position: 'top' },
  ],
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasSeenIntro, setHasSeenIntroState] = useState(true); // Default true to not block
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [currentTour, setCurrentTour] = useState<ScreenTour | null>(null);
  const [currentTooltipIndex, setCurrentTooltipIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Load saved state
  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const introSeen = await AsyncStorage.getItem(STORAGE_KEY);
      const tours = await AsyncStorage.getItem(TOURS_KEY);
      
      setHasSeenIntroState(introSeen === 'true');
      if (tours) {
        setCompletedTours(JSON.parse(tours));
      }
    } catch (error) {
      console.log('Error loading onboarding state:', error);
    }
  };

  const setHasSeenIntro = async (seen: boolean) => {
    setHasSeenIntroState(seen);
    await AsyncStorage.setItem(STORAGE_KEY, seen.toString());
  };

  const markTourCompleted = async (screenName: string) => {
    const updated = [...completedTours, screenName];
    setCompletedTours(updated);
    await AsyncStorage.setItem(TOURS_KEY, JSON.stringify(updated));
  };

  const hasCompletedTour = (screenName: string): boolean => {
    return completedTours.includes(screenName);
  };

  const startTour = (screenName: string) => {
    const tooltips = SCREEN_TOURS[screenName];
    if (!tooltips || hasCompletedTour(screenName)) return;

    setCurrentTour({
      screenName,
      tooltips,
      completed: false,
    });
    setCurrentTooltipIndex(0);
    setShowTooltip(true);
  };

  const nextTooltip = () => {
    if (!currentTour) return;

    if (currentTooltipIndex < currentTour.tooltips.length - 1) {
      setCurrentTooltipIndex(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const skipTour = () => {
    if (currentTour) {
      markTourCompleted(currentTour.screenName);
    }
    setCurrentTour(null);
    setCurrentTooltipIndex(0);
    setShowTooltip(false);
  };

  const endTour = () => {
    if (currentTour) {
      markTourCompleted(currentTour.screenName);
    }
    setCurrentTour(null);
    setCurrentTooltipIndex(0);
    setShowTooltip(false);
  };

  const resetAllTours = async () => {
    setCompletedTours([]);
    setHasSeenIntroState(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(TOURS_KEY);
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasSeenIntro,
        setHasSeenIntro,
        currentTour,
        currentTooltipIndex,
        startTour,
        nextTooltip,
        skipTour,
        endTour,
        hasCompletedTour,
        resetAllTours,
        showTooltip,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
