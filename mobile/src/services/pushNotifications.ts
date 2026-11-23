/**
 * Push Notifications Service
 * Handles Expo push notifications for transaction alerts, promotions, etc.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const PUSH_TOKEN_KEY = '@gmg_push_token';
const NOTIFICATION_SETTINGS_KEY = '@gmg_notification_settings';

// Notification categories
export type NotificationCategory = 
  | 'transaction'
  | 'security'
  | 'promotion'
  | 'kyc'
  | 'system';

export interface NotificationSettings {
  enabled: boolean;
  transactions: boolean;
  security: boolean;
  promotions: boolean;
  kyc: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  transactions: true,
  security: true,
  promotions: true,
  kyc: true,
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    try {
      // Load saved settings
      await this.loadSettings();

      if (!this.settings.enabled) {
        console.log('Push notifications disabled by user');
        return null;
      }

      // Check if physical device
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'gmg-uganda', // Replace with actual Expo project ID
      });
      this.pushToken = tokenData.data;

      // Save token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

      // Register token with backend
      await this.registerTokenWithServer(this.pushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up listeners
      this.setupListeners();

      console.log('Push notifications initialized:', this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return null;
    }
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00A86B',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('security', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotification(notification);
      }
    );

    // Listener for user interaction with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    const category = data?.category as NotificationCategory;

    // Check if this category is enabled
    if (category && !this.isCategoryEnabled(category)) {
      return;
    }

    // Emit event for app to handle
    // Could use EventEmitter or context here
  }

  /**
   * Handle notification tap/response
   */
  private handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    if (data?.transactionId) {
      // Navigate to transaction details
      // navigation.navigate('TransactionDetails', { id: data.transactionId });
    } else if (data?.screen) {
      // Navigate to specific screen
      // navigation.navigate(data.screen);
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-device', {
        pushToken: token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  /**
   * Load notification settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  /**
   * Save notification settings
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(this.settings)
    );

    // Update server with preferences
    try {
      await api.put('/notifications/preferences', this.settings);
    } catch (error) {
      console.error('Failed to sync notification preferences:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Check if category is enabled
   */
  private isCategoryEnabled(category: NotificationCategory): boolean {
    switch (category) {
      case 'transaction':
        return this.settings.transactions;
      case 'security':
        return this.settings.security;
      case 'promotion':
        return this.settings.promotions;
      case 'kyc':
        return this.settings.kyc;
      default:
        return true;
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.pushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = immediate
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const pushNotifications = new PushNotificationService();
export default pushNotifications;
