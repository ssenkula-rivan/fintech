// Environment configuration for GMG Global Mobile App
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================================
// IMPORTANT: Update this IP to your computer's local IP address
// To find your IP on Mac: System Settings > Network > Wi-Fi > Details > IP Address
// Or run in terminal: ipconfig getifaddr en0
// ============================================================
const LOCAL_DEV_IP = '192.168.100.44'; // Your Mac's local IP
const API_PORT = '3000'; // API server port

// ngrok tunnel URL for cross-network access (update when you restart ngrok)
const NGROK_URL = 'https://d71b9c42f403.ngrok-free.app';
const USE_NGROK = true; // Set to true to use ngrok for cross-network testing

// Get local IP for development
const getLocalApiUrl = () => {
  // Use ngrok for cross-network testing
  if (USE_NGROK && NGROK_URL) {
    return NGROK_URL;
  }
  
  // Check if running on web
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && (globalThis as any).location) {
    return `http://${(globalThis as any).location.hostname}:${API_PORT}`;
  }
  
  // For iOS Simulator - use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    // Check if running in simulator (debuggerHost contains localhost)
    const debuggerHost = (Constants.expoConfig as any)?.hostUri;
    if (debuggerHost?.includes('localhost') || debuggerHost?.includes('127.0.0.1')) {
      return `http://localhost:${API_PORT}`;
    }
  }
  
  // For Android emulator - use special IP
  if (Platform.OS === 'android' && __DEV__) {
    const debuggerHost = (Constants.expoConfig as any)?.hostUri;
    if (debuggerHost?.includes('10.0.2.2')) {
      return `http://10.0.2.2:${API_PORT}`;
    }
  }
  
  // For physical devices - use your machine's local IP
  // This IP must be on the same WiFi network as your phone
  return `http://${LOCAL_DEV_IP}:${API_PORT}`;
};

const ENV = {
  development: {
    apiUrl: getLocalApiUrl(),
    webClientId: '741987457462-78kffpum5ff5vidtjp2kdl1gab9jkr64.apps.googleusercontent.com',
    androidClientId: '',
    iosClientId: '',
    enableLogging: true,
    enableBiometrics: true,
    enablePushNotifications: true,
  },
  staging: {
    apiUrl: 'https://staging-api.gmguganda.com',
    webClientId: '741987457462-78kffpum5ff5vidtjp2kdl1gab9jkr64.apps.googleusercontent.com',
    androidClientId: '',
    iosClientId: '',
    enableLogging: true,
    enableBiometrics: true,
    enablePushNotifications: true,
  },
  production: {
    apiUrl: 'https://api.gmguganda.com',
    webClientId: '741987457462-78kffpum5ff5vidtjp2kdl1gab9jkr64.apps.googleusercontent.com',
    androidClientId: '',
    iosClientId: '',
    enableLogging: false,
    enableBiometrics: true,
    enablePushNotifications: true,
  },
};

// Get environment from Expo constants or default to development
const getEnvVars = () => {
  const releaseChannel = (Constants.expoConfig as any)?.releaseChannel;
  
  // Override with environment variables if available
  const envVars = {
    ...ENV.development, // Default to development
    apiUrl: process.env.EXPO_PUBLIC_API_URL || ENV.development.apiUrl,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || ENV.development.webClientId,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || ENV.development.androidClientId,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID || ENV.development.iosClientId,
    enableLogging: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
    enableBiometrics: process.env.EXPO_PUBLIC_ENABLE_BIOMETRICS !== 'false',
    enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS !== 'false',
  };

  // Select environment based on release channel
  if (releaseChannel === 'production') {
    return { ...ENV.production, ...envVars };
  } else if (releaseChannel === 'staging') {
    return { ...ENV.staging, ...envVars };
  }
  
  return envVars;
};

export default getEnvVars();