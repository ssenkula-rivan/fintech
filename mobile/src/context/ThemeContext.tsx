// GMG Global - Theme Context
// Supports Dark Mode, Light Mode, and System Default
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryGradient: string[];
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  card: string;
  inputBackground: string;
  inputBorder: string;
  tabBar: string;
  statusBar: 'light-content' | 'dark-content';
}

// Modern Light Theme - Revolut/Wise inspired
const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FA',
  primary: '#0066FF',
  primaryGradient: ['#0066FF', '#0044CC'],
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E8ECF0',
  success: '#00C48C',
  error: '#FF4757',
  warning: '#FFB020',
  card: '#F5F7FA',
  inputBackground: '#F5F7FA',
  inputBorder: '#E8ECF0',
  tabBar: '#FFFFFF',
  statusBar: 'dark-content',
};

// Modern Dark Theme - Premium fintech style
const darkColors: ThemeColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceVariant: '#242424',
  primary: '#0066FF',
  primaryGradient: ['#0066FF', '#0044CC'],
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  border: '#2D2D2D',
  success: '#00C48C',
  error: '#FF4757',
  warning: '#FFB020',
  card: '#1A1A1A',
  inputBackground: '#242424',
  inputBorder: '#3D3D3D',
  tabBar: '#0D0D0D',
  statusBar: 'light-content',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@gmg_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine actual theme based on mode
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { lightColors, darkColors };
