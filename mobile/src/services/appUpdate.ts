// GMG Global - App Update Service
// Checks backend API for app updates - NO MOCK DATA
import { Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Get current app version from app.json
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Store URLs for app stores
const STORE_URLS = {
  ios: 'https://apps.apple.com/app/gmg-global/id0000000000', // Replace with real App Store ID
  android: 'https://play.google.com/store/apps/details?id=com.gmgglobal.app',
};

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  isForceUpdate: boolean;
  updateUrl: string;
  releaseNotes?: string;
  minSupportedVersion?: string;
}

// Compare semantic versions (e.g., "1.2.3" vs "1.2.4")
const compareVersions = (current: string, latest: string): number => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) return 1;  // Update available
    if (latestPart < currentPart) return -1; // Current is newer
  }
  return 0; // Same version
};

// Check if current version is below minimum supported
const isBelowMinVersion = (current: string, minVersion: string): boolean => {
  return compareVersions(current, minVersion) > 0;
};

// Check for app updates from backend API
export const checkForUpdate = async (): Promise<AppUpdateInfo> => {
  const platform = Platform.OS;
  const updateUrl = platform === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
  
  try {
    // Call backend API to get latest version info
    const response = await api.getAppVersion(platform);
    
    if (response.success && response.data) {
      const { latestVersion, minSupportedVersion, releaseNotes, forceUpdate } = response.data;
      
      const isUpdateAvailable = compareVersions(APP_VERSION, latestVersion) > 0;
      const isForceUpdate = forceUpdate || (minSupportedVersion && isBelowMinVersion(APP_VERSION, minSupportedVersion));
      
      return {
        currentVersion: APP_VERSION,
        latestVersion,
        isUpdateAvailable,
        isForceUpdate: isForceUpdate || false,
        updateUrl,
        releaseNotes,
        minSupportedVersion,
      };
    }
    
    // API call failed - return no update available
    return {
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      isUpdateAvailable: false,
      isForceUpdate: false,
      updateUrl,
    };
  } catch (error) {
    console.error('[AppUpdate] Error checking for updates:', error);
    // On error, don't block the user
    return {
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      isUpdateAvailable: false,
      isForceUpdate: false,
      updateUrl,
    };
  }
};

// Open app store for update
export const openAppStore = async (): Promise<void> => {
  const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
  
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open app store. Please update manually.');
    }
  } catch (error) {
    console.error('[AppUpdate] Error opening store:', error);
    Alert.alert('Error', 'Unable to open app store. Please update manually.');
  }
};

// Show update alert to user
export const showUpdateAlert = (updateInfo: AppUpdateInfo, onDismiss?: () => void): void => {
  const { isForceUpdate, latestVersion, releaseNotes } = updateInfo;
  
  const message = releaseNotes 
    ? `Version ${latestVersion} is available.\n\n${releaseNotes}`
    : `Version ${latestVersion} is available with improvements and bug fixes.`;
  
  if (isForceUpdate) {
    // Force update - no dismiss option
    Alert.alert(
      'Update Required',
      `Please update to continue using GMG Global.\n\n${message}`,
      [
        { text: 'Update Now', onPress: openAppStore },
      ],
      { cancelable: false }
    );
  } else {
    // Optional update
    Alert.alert(
      'Update Available',
      message,
      [
        { text: 'Later', style: 'cancel', onPress: onDismiss },
        { text: 'Update', onPress: openAppStore },
      ]
    );
  }
};

export default {
  checkForUpdate,
  openAppStore,
  showUpdateAlert,
  APP_VERSION,
};
