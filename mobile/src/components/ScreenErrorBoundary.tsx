// Screen-level Error Boundary with recovery options
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import crashReporter from '../services/crashReporter';

interface Props {
  children: ReactNode;
  screenName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    crashReporter.logError(error, {
      severity: 'high',
      category: 'ui',
      componentStack: errorInfo.componentStack || undefined,
      userAction: `Viewing ${this.props.screenName}`,
      handled: true,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Screen Error</Text>
          <Text style={styles.message}>
            This screen encountered an error. Please try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Reload Screen</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', color: '#fff', marginBottom: 8 },
  message: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontFamily: 'Montserrat_600SemiBold' },
});

export default ScreenErrorBoundary;
