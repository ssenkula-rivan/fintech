/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Platform } from 'react-native';
import crashReporter from '../services/crashReporter';

// Only import LogRocket on native platforms
let LogRocket: any = null;
if (Platform.OS !== 'web') {
  try {
    LogRocket = require('@logrocket/react-native').default;
  } catch (e) {
    // LogRocket not available
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to crash reporter
    crashReporter.logError(error, {
      severity: 'critical',
      category: 'ui',
      componentStack: errorInfo.componentStack || undefined,
      handled: true,
    });

    // Log to LogRocket in production (native only)
    if (!__DEV__ && LogRocket && Platform.OS !== 'web') {
      LogRocket.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleShareError = async () => {
    if (!this.state.error) return;
    
    const errorReport = `
GMG Global Error Report
-----------------------
Error: ${this.state.error.message}
Time: ${new Date().toISOString()}
Stack: ${this.state.error.stack || 'N/A'}
Component: ${this.state.errorInfo?.componentStack || 'N/A'}
    `.trim();

    try {
      await Share.share({ message: errorReport, title: 'Error Report' });
    } catch (e) {
      console.log('Failed to share error report');
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={this.handleShareError}>
              <Text style={styles.shareText}>📤 Share Error Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#2D2D44',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 200,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  },
  supportButton: {
    paddingVertical: 12,
  },
  supportText: {
    color: '#7C3AED',
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
});

export default ErrorBoundary;
