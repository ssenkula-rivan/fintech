// GMG Global Mobile App - Main Entry Point
// React Native (Expo) app connected to Express.js backend

import 'react-native-gesture-handler'; // Must be at the top for iOS navigation
import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet, Image, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import Toast from 'react-native-toast-message';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { OnboardingProvider, useOnboarding } from './src/context/OnboardingContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { RegionProvider } from './src/context/RegionContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import IntroSlides from './src/components/IntroSlides';
import TourOverlay from './src/components/TourOverlay';
import UpdateChecker from './src/components/UpdateChecker';
import { requestEssentialPermissions } from './src/utils/permissions';
import crashReporter from './src/services/crashReporter';
// import LogRocket from '@logrocket/react-native'; // Disabled for debugging

// Keep splash screen visible while loading
console.log('[App] Starting app initialization...');

try {
  SplashScreen.preventAutoHideAsync();
  console.log('[App] SplashScreen.preventAutoHideAsync called');
} catch (e) {
  console.log('[App] SplashScreen error:', e);
}

// Initialize LogRocket (production only) - disabled for now to debug
// if (!__DEV__) {
//   LogRocket.init('sm6erc/gmg-uganda');
// }

// Initialize crash reporter
try {
  crashReporter.init();
  console.log('[App] CrashReporter initialized');
} catch (e) {
  console.log('[App] CrashReporter error:', e);
}

function AppContent() {
  const { isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  // SECURITY: Prevent screenshots and screen recording
  useEffect(() => {
    const preventScreenCapture = async () => {
      try {
        // Prevent screenshots and screen recording (works on Android, limited on iOS)
        await ScreenCapture.preventScreenCaptureAsync();
        console.log('[App] Screenshot prevention enabled');
      } catch (error) {
        console.log('[App] Screenshot prevention error:', error);
      }
    };
    
    // Only enable in production for security
    if (!__DEV__) {
      preventScreenCapture();
    }
    
    return () => {
      // Re-enable when app is closed (cleanup)
      if (!__DEV__) {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);
  const { hasSeenIntro, setHasSeenIntro } = useOnboarding();

  // Hide splash screen when loading is complete
  useEffect(() => {
    const hideSplash = async () => {
      if (!isLoading) {
        console.log('[App] Hiding splash screen...');
        try {
          await SplashScreen.hideAsync();
          console.log('[App] Splash screen hidden');
        } catch (e) {
          console.log('[App] Splash hide error:', e);
        }
      }
    };
    hideSplash();
  }, [isLoading]);

  useEffect(() => {
    console.log('[App] AppContent mounted');
    // Request notification permissions on app start
    requestEssentialPermissions();
  }, []);

  console.log('[App] Render - isLoading:', isLoading, 'hasSeenIntro:', hasSeenIntro);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Show intro slides for first-time users
  if (!hasSeenIntro) {
    return <IntroSlides onComplete={() => setHasSeenIntro(true)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
      <TourOverlay />
      <UpdateChecker checkOnResume={true} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  console.log('[App] Fonts loaded:', fontsLoaded, 'Font error:', fontError);

  // Set default font for all Text and TextInput components globally
  useEffect(() => {
    if (fontsLoaded) {
      // Override Text default props
      (Text as any).defaultProps = (Text as any).defaultProps || {};
      (Text as any).defaultProps.style = { fontFamily: 'Montserrat_400Regular' };
      
      // Override TextInput default props
      (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
      (TextInput as any).defaultProps.style = { fontFamily: 'Montserrat_400Regular' };
    }
  }, [fontsLoaded]);

  // If fonts fail to load, continue anyway with system fonts
  if (!fontsLoaded && !fontError) {
    console.log('[App] Waiting for fonts...');
    // Show sky blue background while fonts load
    return (
      <View style={{ flex: 1, backgroundColor: '#87CEEB', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (fontError) {
    console.log('[App] Font error, continuing with system fonts:', fontError);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#87CEEB' }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <RegionProvider>
                <OnboardingProvider>
                  <NotificationProvider>
                    <AuthProvider>
                      <AppContent />
                    </AuthProvider>
                  </NotificationProvider>
                </OnboardingProvider>
              </RegionProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
      <Toast />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});
