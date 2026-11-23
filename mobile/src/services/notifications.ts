// Push Notifications, Alerts, Reminders & Updates Service
// Works both online and offline
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@gmg_push_token',
  PENDING_NOTIFICATIONS: '@gmg_pending_notifications',
  NOTIFICATION_SETTINGS: '@gmg_notification_settings',
  SCHEDULED_REMINDERS: '@gmg_scheduled_reminders',
};

// Notification types
export type NotificationType = 
  | 'transaction' 
  | 'security' 
  | 'promotion' 
  | 'reminder' 
  | 'update' 
  | 'alert';

export interface GMGNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  offline?: boolean;
}

export interface NotificationSettings {
  transactions: boolean;
  security: boolean;
  promotions: boolean;
  reminders: boolean;
  updates: boolean;
  sound: boolean;
  vibration: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  transactions: true,
  security: true,
  promotions: true,
  reminders: true,
  updates: true,
  sound: true,
  vibration: true,
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

class NotificationService {
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private isOnline: boolean = true;
  private pendingNotifications: GMGNotification[] = [];
  private listeners: ((notification: GMGNotification) => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadSettings();
    await this.loadPendingNotifications();
    this.setupNetworkListener();
    this.setupNotificationListeners();
  }

  // Setup network state listener
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Sync pending notifications when coming back online
      if (wasOffline && this.isOnline) {
        this.syncPendingNotifications();
      }
    });
  }

  // Setup notification response listeners
  private setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      const gmgNotification = this.parseNotification(notification);
      this.notifyListeners(gmgNotification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      this.handleNotificationTap(data);
    });
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '00170de9-99a3-41c9-9791-b6ad937410b9',
    });
    
    this.pushToken = tokenData.data;
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, this.pushToken);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return this.pushToken;
  }

  // Setup Android notification channels
  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066FF',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('security', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('updates', {
      name: 'App Updates',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  // Load notification settings
  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.log('Error loading notification settings:', error);
    }
  }

  // Save notification settings
  async saveSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      JSON.stringify(this.settings)
    );
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Load pending offline notifications
  private async loadPendingNotifications() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      if (stored) {
        this.pendingNotifications = JSON.parse(stored);
      }
    } catch (error) {
      console.log('Error loading pending notifications:', error);
    }
  }

  // Save pending notifications
  private async savePendingNotifications() {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_NOTIFICATIONS,
      JSON.stringify(this.pendingNotifications)
    );
  }

  // Sync pending notifications when back online
  private async syncPendingNotifications() {
    if (this.pendingNotifications.length === 0) return;

    // Process each pending notification
    for (const notification of this.pendingNotifications) {
      await this.showLocalNotification(notification);
    }

    // Clear pending
    this.pendingNotifications = [];
    await this.savePendingNotifications();
  }

  // Show local notification (works offline)
  async showLocalNotification(notification: Omit<GMGNotification, 'id' | 'timestamp' | 'read'>) {
    const type = notification.type;
    
    // Check if this type is enabled
    const settingKey = `${type}s` as keyof NotificationSettings;
    if (settingKey in this.settings && !this.settings[settingKey]) {
      return;
    }

    const channelId = Platform.OS === 'android' ? type + 's' : undefined;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { ...notification.data, type },
        sound: this.settings.sound ? 'default' : undefined,
      },
      trigger: null, // Show immediately
      ...(channelId && { channelId }),
    });
  }

  // Schedule a reminder notification
  async scheduleReminder(
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, any>
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type: 'reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    // Store reminder for offline access
    const reminders = await this.getScheduledReminders();
    reminders.push({ id: identifier, title, body, triggerDate: triggerDate.toISOString(), data });
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_REMINDERS, JSON.stringify(reminders));

    return identifier;
  }

  // Get scheduled reminders
  async getScheduledReminders(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_REMINDERS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Cancel a scheduled reminder
  async cancelReminder(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    
    const reminders = await this.getScheduledReminders();
    const filtered = reminders.filter(r => r.id !== identifier);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_REMINDERS, JSON.stringify(filtered));
  }

  // Cancel all scheduled notifications
  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_REMINDERS);
  }

  // Queue notification for offline delivery
  async queueOfflineNotification(notification: Omit<GMGNotification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: GMGNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      offline: true,
    };

    this.pendingNotifications.push(fullNotification);
    await this.savePendingNotifications();

    // Still show local notification even offline
    await this.showLocalNotification(notification);
  }

  // Send notification (handles online/offline)
  async sendNotification(notification: Omit<GMGNotification, 'id' | 'timestamp' | 'read'>) {
    if (this.isOnline) {
      await this.showLocalNotification(notification);
    } else {
      await this.queueOfflineNotification(notification);
    }
  }

  // Transaction notifications
  async notifyTransaction(type: 'sent' | 'received' | 'deposit' | 'withdrawal', amount: string, details?: string) {
    const titles: Record<string, string> = {
      sent: '💸 Money Sent',
      received: '💰 Money Received',
      deposit: '📥 Deposit Successful',
      withdrawal: '📤 Withdrawal Successful',
    };

    const bodies: Record<string, string> = {
      sent: `You sent ${amount}${details ? ` to ${details}` : ''}`,
      received: `You received ${amount}${details ? ` from ${details}` : ''}`,
      deposit: `${amount} has been added to your wallet`,
      withdrawal: `${amount} has been withdrawn from your wallet`,
    };

    await this.sendNotification({
      type: 'transaction',
      title: titles[type],
      body: bodies[type],
      data: { transactionType: type, amount },
    });
  }

  // Security alert
  async notifySecurityAlert(message: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    const icons = { low: 'ℹ️', medium: '⚠️', high: '🚨' };
    
    await this.sendNotification({
      type: 'security',
      title: `${icons[severity]} Security Alert`,
      body: message,
      data: { severity },
    });
  }

  // Promotion notification
  async notifyPromotion(title: string, message: string, promoCode?: string) {
    await this.sendNotification({
      type: 'promotion',
      title: `🎁 ${title}`,
      body: message,
      data: { promoCode },
    });
  }

  // App update notification
  async notifyUpdate(version: string, features: string[]) {
    await this.sendNotification({
      type: 'update',
      title: '🆕 App Update Available',
      body: `Version ${version} is available with new features!`,
      data: { version, features },
    });
  }

  // Bill reminder
  async scheduleBillReminder(billName: string, amount: string, dueDate: Date) {
    // Remind 1 day before
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);

    if (reminderDate > new Date()) {
      await this.scheduleReminder(
        '📅 Bill Payment Reminder',
        `${billName} (${amount}) is due tomorrow`,
        reminderDate,
        { billName, amount, dueDate: dueDate.toISOString() }
      );
    }
  }

  // Savings goal reminder
  async scheduleSavingsReminder(goalName: string, targetAmount: string) {
    // Weekly reminder
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await this.scheduleReminder(
      '💰 Savings Goal Reminder',
      `Don't forget to save towards "${goalName}" (Target: ${targetAmount})`,
      nextWeek,
      { goalName, targetAmount }
    );
  }

  // Parse incoming notification
  private parseNotification(notification: Notifications.Notification): GMGNotification {
    const content = notification.request.content;
    return {
      id: notification.request.identifier,
      type: (content.data?.type as NotificationType) || 'alert',
      title: content.title || '',
      body: content.body || '',
      data: content.data as Record<string, any>,
      timestamp: Date.now(),
      read: false,
    };
  }

  // Handle notification tap
  private handleNotificationTap(data: any) {
    // Navigation will be handled by the app based on notification type
    console.log('Notification tapped:', data);
  }

  // Add listener for notifications
  addListener(callback: (notification: GMGNotification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners(notification: GMGNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear badge
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  // Check if online
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // Get push token
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
