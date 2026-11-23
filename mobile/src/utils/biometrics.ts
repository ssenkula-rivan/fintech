// Biometric authentication utility for iOS Face ID / Touch ID
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'facial' | 'iris';
}

export const biometrics = {
  // Check if device supports biometrics
  isAvailable: async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  },

  // Get supported biometric types
  getSupportedTypes: async (): Promise<string[]> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'facial';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'iris';
          default:
            return 'unknown';
        }
      });
    } catch {
      return [];
    }
  },

  // Get friendly name for biometric type (iOS specific)
  getBiometricName: async (): Promise<string> => {
    const types = await biometrics.getSupportedTypes();
    if (types.includes('facial')) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes('fingerprint')) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    return 'Biometrics';
  },

  // Authenticate with biometrics
  authenticate: async (reason?: string): Promise<BiometricResult> => {
    try {
      const isAvailable = await biometrics.isAvailable();
      if (!isAvailable) {
        return { success: false, error: 'Biometrics not available' };
      }

      const biometricName = await biometrics.getBiometricName();
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || `Authenticate with ${biometricName}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication error',
      };
    }
  },

  // Prompt user to enable biometrics
  promptEnable: async (): Promise<boolean> => {
    const biometricName = await biometrics.getBiometricName();
    
    return new Promise((resolve) => {
      Alert.alert(
        `Enable ${biometricName}`,
        `Would you like to use ${biometricName} for quick and secure login?`,
        [
          { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Enable', onPress: () => resolve(true) },
        ]
      );
    });
  },
};

export default biometrics;
