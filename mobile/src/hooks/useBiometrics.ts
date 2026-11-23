/**
 * Biometric Authentication Hook
 * Face ID / Touch ID / Fingerprint support
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';

interface BiometricsState {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | null;
  isLoading: boolean;
}

export function useBiometrics() {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    isEnabled: false,
    biometricType: null,
    isLoading: true,
  });

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      // Check hardware support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setState(prev => ({ ...prev, isAvailable: false, isLoading: false }));
        return;
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setState(prev => ({ ...prev, isAvailable: false, isLoading: false }));
        return;
      }

      // Get biometric type
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometricType: 'fingerprint' | 'facial' | 'iris' | null = null;
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      // Check if user has enabled biometrics
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);

      setState({
        isAvailable: true,
        isEnabled: enabled === 'true',
        biometricType,
        isLoading: false,
      });
    } catch (error) {
      console.error('Biometrics check failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!state.isAvailable) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, [state.isAvailable]);

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable) {
      return false;
    }

    // Verify user first
    const verified = await authenticate('Enable biometric login');
    if (!verified) {
      return false;
    }

    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
    setState(prev => ({ ...prev, isEnabled: true }));
    return true;
  }, [state.isAvailable, authenticate]);

  const disableBiometrics = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    setState(prev => ({ ...prev, isEnabled: false }));
  }, []);

  const getBiometricLabel = useCallback((): string => {
    switch (state.biometricType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometrics';
    }
  }, [state.biometricType]);

  return {
    ...state,
    authenticate,
    enableBiometrics,
    disableBiometrics,
    getBiometricLabel,
    refresh: checkBiometrics,
  };
}

export default useBiometrics;
