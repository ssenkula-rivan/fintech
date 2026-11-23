// GMG Global - Global Notification Component
// Shows notifications across all screens with animations and haptics
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AnimatedEmoji } from './AnimatedEmoji';
import notificationSound from '../services/notificationSound';

const { width } = Dimensions.get('window');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  emoji?: string;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface GlobalNotificationProps {
  notification: NotificationData | null;
  onDismiss: () => void;
}

const NOTIFICATION_CONFIG: Record<NotificationType, { bg: string; emoji: string; haptic: Haptics.NotificationFeedbackType }> = {
  success: { bg: '#10b981', emoji: '✅', haptic: Haptics.NotificationFeedbackType.Success },
  error: { bg: '#ef4444', emoji: '❌', haptic: Haptics.NotificationFeedbackType.Error },
  warning: { bg: '#f59e0b', emoji: '⚠️', haptic: Haptics.NotificationFeedbackType.Warning },
  info: { bg: '#3b82f6', emoji: 'ℹ️', haptic: Haptics.NotificationFeedbackType.Success },
};

export const GlobalNotification: React.FC<GlobalNotificationProps> = ({
  notification,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      showNotification();
    }
  }, [notification]);

  const showNotification = () => {
    setVisible(true);
    
    // Trigger haptic
    const config = NOTIFICATION_CONFIG[notification!.type];
    Haptics.notificationAsync(config.haptic);
    
    // Play notification sound
    const soundType = notification!.type === 'success' ? 'success' 
      : notification!.type === 'error' ? 'error' 
      : 'info';
    notificationSound.playNotificationSound(soundType);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();

    // Auto dismiss
    const duration = notification!.duration || 4000;
    setTimeout(() => {
      hideNotification();
    }, duration);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  if (!visible || !notification) return null;

  const config = NOTIFICATION_CONFIG[notification.type];
  const emoji = notification.emoji || config.emoji;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.notification, { backgroundColor: config.bg }]}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        <View style={styles.emojiContainer}>
          <AnimatedEmoji
            emoji={emoji}
            animation={notification.type === 'success' ? 'bounce' : notification.type === 'error' ? 'shake' : 'pulse'}
            size={28}
            haptic={false}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          {notification.message && (
            <Text style={styles.message}>{notification.message}</Text>
          )}
        </View>
        {notification.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notification.action!.onPress();
              hideNotification();
            }}
          >
            <Text style={styles.actionText}>{notification.action.label}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
  },
});

export default GlobalNotification;
