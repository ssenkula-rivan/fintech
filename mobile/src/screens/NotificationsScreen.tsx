// GMG Global - Notifications Screen
import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications, GMGNotification } from '../context/NotificationContext';

const NOTIFICATION_ICONS: Record<string, string> = {
  transaction: '💰',
  security: '🔐',
  promotion: '🎁',
  reminder: '⏰',
  update: '🆕',
  alert: '🔔',
};

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { 
    notifications, 
    unreadCount, 
    isOnline,
    markAsRead, 
    markAllAsRead, 
    clearNotification,
    clearAllNotifications 
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationPress = (notification: GMGNotification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'transaction':
        navigation.navigate('Transactions');
        break;
      case 'security':
        navigation.navigate('Security');
        break;
      case 'promotion':
        // Could navigate to promotions screen
        break;
      default:
        break;
    }
  };

  const renderNotification = ({ item }: { item: GMGNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { borderBottomColor: colors.border }, !item.read && [styles.unread, { backgroundColor: colors.primary + '10' }]]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => clearNotification(item.id)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{NOTIFICATION_ICONS[item.type] || '🔔'}</Text>
        {item.offline && <View style={styles.offlineDot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You're all caught up! New notifications will appear here.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllBtn, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Online/Offline Status */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 You're offline. Some features may be limited.</Text>
        </View>
      )}

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <TouchableOpacity style={[styles.clearAllBtn, { backgroundColor: colors.card, borderTopColor: colors.border }]} onPress={clearAllNotifications}>
          <Text style={[styles.clearAllText, { color: colors.error }]}>🗑️ Clear All Notifications</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backBtn: { color: '#0066FF', fontSize: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  markAllBtn: { color: '#0066FF', fontSize: 14 },
  offlineBanner: {
    backgroundColor: '#f59e0b20',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: { color: '#f59e0b', fontSize: 13 },
  unreadBanner: {
    backgroundColor: '#0066FF20',
    padding: 10,
    alignItems: 'center',
  },
  unreadText: { color: '#0066FF', fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    alignItems: 'flex-start',
  },
  unread: { backgroundColor: '#0066FF10' },
  iconContainer: { position: 'relative', marginRight: 12 },
  icon: { fontSize: 28 },
  offlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#000',
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  body: { fontSize: 14, color: '#BBBBBB', lineHeight: 20 },
  time: { fontSize: 12, color: '#666', marginTop: 6 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066FF',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyList: { flex: 1 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#BBBBBB', textAlign: 'center' },
  clearAllBtn: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  clearAllText: { color: '#ef4444', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
});
