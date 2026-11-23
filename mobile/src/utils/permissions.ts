// Runtime Permissions Handler for Android & iOS
import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';

export type PermissionType = 'camera' | 'photos' | 'contacts' | 'location' | 'notifications';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

// Permission request messages
const PERMISSION_MESSAGES: Record<PermissionType, { title: string; message: string }> = {
  camera: {
    title: 'Camera Access Required',
    message: 'GMG Global needs camera access to scan QR codes and take photos for KYC verification.',
  },
  photos: {
    title: 'Photo Library Access Required',
    message: 'GMG Global needs access to your photos to upload documents for KYC verification.',
  },
  contacts: {
    title: 'Contacts Access Required',
    message: 'GMG Global can access your contacts to make sending money to friends easier.',
  },
  location: {
    title: 'Location Access Required',
    message: 'GMG Global uses your location for fraud prevention and to show nearby services.',
  },
  notifications: {
    title: 'Enable Notifications',
    message: 'Get instant alerts for transactions, promotions, and security updates.',
  },
};

// Check if permission is granted
export async function checkPermission(type: PermissionType): Promise<PermissionResult> {
  try {
    switch (type) {
      case 'camera': {
        const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
      }
      case 'photos': {
        const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
      }
      case 'contacts': {
        const { status, canAskAgain } = await Contacts.getPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
      }
      case 'location': {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
      }
      case 'notifications': {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        return { granted: status === 'granted', canAskAgain };
      }
      default:
        return { granted: false, canAskAgain: true };
    }
  } catch {
    return { granted: false, canAskAgain: true };
  }
}

// Request permission with user-friendly prompts
export async function requestPermission(type: PermissionType): Promise<boolean> {
  try {
    // First check current status
    const current = await checkPermission(type);
    if (current.granted) return true;

    // Request the permission
    let result: { status: string };
    
    switch (type) {
      case 'camera':
        result = await Camera.requestCameraPermissionsAsync();
        break;
      case 'photos':
        result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        break;
      case 'contacts':
        result = await Contacts.requestPermissionsAsync();
        break;
      case 'location':
        result = await Location.requestForegroundPermissionsAsync();
        break;
      case 'notifications':
        result = await Notifications.requestPermissionsAsync();
        break;
      default:
        return false;
    }

    if (result.status === 'granted') {
      return true;
    }

    // Permission denied - show settings prompt
    if (!current.canAskAgain) {
      showSettingsPrompt(type);
    }
    
    return false;
  } catch {
    return false;
  }
}

// Show prompt to open settings when permission permanently denied
function showSettingsPrompt(type: PermissionType) {
  const { title, message } = PERMISSION_MESSAGES[type];
  
  Alert.alert(
    title,
    `${message}\n\nPlease enable this permission in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ]
  );
}

// Open app settings
export async function openAppSettings() {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
}

// Request multiple permissions at once
export async function requestMultiplePermissions(
  types: PermissionType[]
): Promise<Record<PermissionType, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const type of types) {
    results[type] = await requestPermission(type);
  }
  
  return results as Record<PermissionType, boolean>;
}

// Check all app permissions status
export async function checkAllPermissions(): Promise<Record<PermissionType, PermissionResult>> {
  const types: PermissionType[] = ['camera', 'photos', 'contacts', 'location', 'notifications'];
  const results: Record<string, PermissionResult> = {};
  
  for (const type of types) {
    results[type] = await checkPermission(type);
  }
  
  return results as Record<PermissionType, PermissionResult>;
}

// Request essential permissions on app start (notifications only)
export async function requestEssentialPermissions(): Promise<void> {
  // Only request notifications on first launch
  await requestPermission('notifications');
}

// Request KYC-related permissions (camera + photos)
export async function requestKYCPermissions(): Promise<{ camera: boolean; photos: boolean }> {
  const camera = await requestPermission('camera');
  const photos = await requestPermission('photos');
  return { camera, photos };
}

// Request send money permissions (contacts)
export async function requestSendMoneyPermissions(): Promise<boolean> {
  return requestPermission('contacts');
}

export default {
  checkPermission,
  requestPermission,
  requestMultiplePermissions,
  checkAllPermissions,
  requestEssentialPermissions,
  requestKYCPermissions,
  requestSendMoneyPermissions,
  openAppSettings,
};
