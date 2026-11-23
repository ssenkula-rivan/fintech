// Crash Logs Viewer Screen - For debugging and support
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import crashReporter, { CrashLog, ErrorSeverity } from '../services/crashReporter';

const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const CATEGORY_ICONS: Record<string, string> = {
  network: '🌐',
  auth: '🔐',
  payment: '💳',
  ui: '📱',
  storage: '💾',
  unknown: '❓',
};

export default function CrashLogsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const [logData, statsData] = await Promise.all([
      crashReporter.getLogs(50),
      crashReporter.getErrorStats(),
    ]);
    setLogs(logData);
    setStats(statsData);
    setLoading(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleClearLogs = () => {
    Alert.alert('Clear Logs', 'Are you sure you want to clear all crash logs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await crashReporter.clearLogs();
        loadLogs();
      }},
    ]);
  };


  const handleExportLogs = async () => {
    const exportData = logs.map(log => ({
      time: formatTime(log.timestamp),
      severity: log.severity,
      category: log.category,
      message: log.message,
      screen: log.screenName,
    }));

    try {
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: 'GMG Crash Logs Export',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const renderLog = ({ item }: { item: CrashLog }) => (
    <TouchableOpacity 
      style={[styles.logItem, { backgroundColor: colors.card }]}
      onPress={() => Alert.alert('Error Details', `${item.message}\n\nStack:\n${item.stack || 'N/A'}`)}
    >
      <View style={styles.logHeader}>
        <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category]}</Text>
        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        {!item.handled && <Text style={styles.unhandledBadge}>UNHANDLED</Text>}
      </View>
      <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={2}>{item.message}</Text>
      <View style={styles.logMeta}>
        <Text style={[styles.logScreen, { color: colors.textSecondary }]}>📍 {item.screenName || 'Unknown'}</Text>
        <Text style={[styles.logTime, { color: colors.textMuted }]}>{formatTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('crashLogs.title')}</Text>
        <TouchableOpacity onPress={handleExportLogs}>
          <Text style={[styles.exportBtn, { color: colors.primary }]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.bySeverity.critical + stats.bySeverity.high}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Critical</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.bySeverity.medium}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Medium</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.bySeverity.low}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low</Text>
          </View>
        </View>
      )}

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={logs.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No crash logs</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Your app is running smoothly!</Text>
          </View>
        }
      />

      {logs.length > 0 && (
        <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.card, borderTopColor: colors.border }]} onPress={handleClearLogs}>
          <Text style={[styles.clearText, { color: colors.error }]}>🗑️ Clear All Logs</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  exportBtn: { color: '#0066FF', fontSize: 14 },
  statsContainer: { flexDirection: 'row', padding: 16, marginBottom: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Montserrat_700Bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  logItem: { marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 12 },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryIcon: { fontSize: 18, marginRight: 8 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  severityText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  unhandledBadge: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#FFFFFF', fontSize: 9, fontFamily: 'Montserrat_600SemiBold', overflow: 'hidden' },
  logMessage: { fontSize: 14, marginBottom: 8 },
  logMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  logScreen: { color: '#888', fontSize: 12 },
  logTime: { color: '#666', fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontFamily: 'Montserrat_500Medium' },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 4 },
  clearBtn: { padding: 16, alignItems: 'center', borderTopWidth: 1 },
  clearText: { color: '#ef4444', fontSize: 14, fontFamily: 'Montserrat_500Medium' },
});
