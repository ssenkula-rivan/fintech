// Error Handler Utilities - Try/Catch wrappers and safe execution
import { Alert } from 'react-native';
import crashReporter, { ErrorSeverity, ErrorCategory } from '../services/crashReporter';

interface SafeExecuteOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  userAction?: string;
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  fallbackValue?: any;
  onError?: (error: Error) => void;
}

// Safe async function execution with error handling
export async function safeExecute<T>(
  fn: () => Promise<T>,
  options: SafeExecuteOptions = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    await crashReporter.logError(err, {
      severity: options.severity || 'medium',
      category: options.category,
      userAction: options.userAction,
      handled: true,
    });

    if (options.showAlert) {
      Alert.alert(
        options.alertTitle || 'Error',
        options.alertMessage || 'Something went wrong. Please try again.'
      );
    }

    if (options.onError) {
      options.onError(err);
    }

    return options.fallbackValue;
  }
}

// Safe sync function execution
export function safeExecuteSync<T>(
  fn: () => T,
  options: SafeExecuteOptions = {}
): T | undefined {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    crashReporter.logError(err, {
      severity: options.severity || 'medium',
      category: options.category,
      userAction: options.userAction,
      handled: true,
    });

    if (options.showAlert) {
      Alert.alert(
        options.alertTitle || 'Error',
        options.alertMessage || 'Something went wrong. Please try again.'
      );
    }

    if (options.onError) {
      options.onError(err);
    }

    return options.fallbackValue;
  }
}

// API call wrapper with automatic error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    userAction?: string;
    showNetworkError?: boolean;
    fallbackValue?: T;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    await crashReporter.logError(err, {
      severity: 'medium',
      category: 'network',
      userAction: options.userAction,
      handled: true,
    });

    const isNetworkError = err.message.includes('Network') || 
                          err.message.includes('fetch') ||
                          err.message.includes('timeout');

    if (options.showNetworkError && isNetworkError) {
      Alert.alert(
        'Connection Error',
        'Please check your internet connection and try again.'
      );
    }

    return { 
      success: false, 
      error: err.message,
      data: options.fallbackValue 
    };
  }
}


// Payment operation wrapper with extra protection
export async function safePaymentOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    await crashReporter.logError(err, {
      severity: 'critical',
      category: 'payment',
      userAction: operationName,
      handled: true,
    });

    Alert.alert(
      'Transaction Error',
      'Your transaction could not be completed. Please try again or contact support if the issue persists.'
    );

    return { success: false, error: err.message };
  }
}

// Storage operation wrapper
export async function safeStorageOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    await crashReporter.logError(err, {
      severity: 'low',
      category: 'storage',
      handled: true,
    });

    return fallbackValue;
  }
}

// JSON parse wrapper
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Retry wrapper for flaky operations
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  await crashReporter.logError(lastError!, {
    severity: 'medium',
    userAction: `Failed after ${maxRetries} retries`,
    handled: true,
  });
  
  throw lastError;
}

export default {
  safeExecute,
  safeExecuteSync,
  safeApiCall,
  safePaymentOperation,
  safeStorageOperation,
  safeJsonParse,
  withRetry,
};
