// GMG Global Mobile App - Discover Screen
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Light theme colors
const colors = {
  background: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#0066FF',
};

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.maintenanceContainer}>
          <Text style={styles.maintenanceIcon}>🔧</Text>
          <Text style={styles.maintenanceTitle}>Under Maintenance</Text>
          <Text style={styles.maintenanceSubtitle}>
            We're working on something exciting!{'\n'}Check back soon for new features.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  maintenanceContainer: {
    alignItems: 'center',
  },
  maintenanceIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  maintenanceTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  maintenanceSubtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  comingSoonBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.primary,
  },
});
