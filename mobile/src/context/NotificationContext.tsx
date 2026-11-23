// GMG Global - Notification Context
// Provides notification list management for HomeScreen and NotificationsScreen
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import notificationSound from '../services/notificationSound';

// In-app notification type (for notification list)
export interface GMGNotification {
  id: string;
  type: 'transaction' | 'security' | 'promotion' | 'reminder' | 'update' | 'alert';
  title: string;
  body: string;
  message?: string;
  timestamp: number;
  read: boolean;
  offline?: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: GMGNotification[];
  unreadCount: number;
  isOnline: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<GMGNotification, 'id' | 'timestamp' | 'read' | 'offline'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<GMGNotification[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  const addNotification = useCallback((notification: Omit<GMGNotification, 'id' | 'timestamp' | 'read' | 'offline'>) => {
    const newNotification: GMGNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      read: false,
      offline: !isOnline,
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Play notification sound based on type
    const soundType = notification.type === 'transaction' ? 'transaction' 
      : notification.type === 'security' || notification.type === 'alert' ? 'error'
      : notification.type === 'promotion' ? 'success'
      : 'info';
    notificationSound.playNotificationSound(soundType);
  }, [isOnline]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOnline,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook for notification list features (HomeScreen, NotificationsScreen)
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
