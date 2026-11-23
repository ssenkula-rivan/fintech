// Crash Reporter & Error Logging Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Only import LogRocket on native platforms
let LogRocket: any = null;
if (Platform.OS !== 'web') {
  try {
    LogRocket = require('@logrocket/react-native').default;
  } catch (e) {
    // LogRocket not available
  }
}

const STORAGE_KEYS = {
  CRASH_LOGS: '@gmg_crash_logs',
  ERROR_COUNT: '@gmg_error_count',
  LAST_CRASH: '@gmg_last_crash',
};

const MAX_STORED_LOGS = 100;

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'auth' | 'payment' | 'ui' | 'storage' | 'unknown';

export interface CrashLog {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  componentStack?: string;
  userAction?: string;
  screenName?: string;
  deviceInfo: DeviceInfo;
  appState: AppState;
  handled: boolean;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model?: string;
}

interface AppState {
  isOnline: boolean;
  memoryWarning: boolean;
  appVersion: string;
}

class CrashReporter {
  private logs: CrashLog[] = [];
  private isInitialized = false;
  private currentScreen = 'Unknown';
  private isOnline = true;

  async init() {
    if (this.isInitialized) return;
    
    await this.loadLogs();
    this.setupGlobalErrorHandler();
    this.setupPromiseRejectionHandler();
    this.isInitialized = true;
    
    console.log('[CrashReporter] Initialized');
  }

  private async loadLogs() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CRASH_LOGS);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.log('[CrashReporter] Failed to load logs');
    }
  }

  private async saveLogs() {
    try {
      const toStore = this.logs.slice(0, MAX_STORED_LOGS);
      await AsyncStorage.setItem(STORAGE_KEYS.CRASH_LOGS, JSON.stringify(toStore));
    } catch (e) {
      console.log('[CrashReporter] Failed to save logs');
    }
  }

  private setupGlobalErrorHandler() {
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      this.logError(error, {
        severity: isFatal ? 'critical' : 'high',
        category: 'unknown',
        handled: false,
      });
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  private setupPromiseRejectionHandler() {
    const globalAny = global as any;
    const originalHandler = globalAny.onunhandledrejection;
    
    globalAny.onunhandledrejection = (event: any) => {
      const error = event?.reason || new Error('Unhandled Promise Rejection');
      this.logError(error, {
        severity: 'high',
        category: 'unknown',
        handled: false,
        userAction: 'Promise rejection',
      });
      
      if (originalHandler) {
        originalHandler(event);
      }
    };
  }


  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  async logError(
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      handled?: boolean;
      userAction?: string;
      componentStack?: string;
      extra?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const crashLog: CrashLog = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      message: errorObj.message || 'Unknown error',
      stack: errorObj.stack,
      severity: options.severity || 'medium',
      category: this.categorizeError(errorObj),
      componentStack: options.componentStack,
      userAction: options.userAction,
      screenName: this.currentScreen,
      handled: options.handled ?? true,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version?.toString() || 'unknown',
      },
      appState: {
        isOnline: this.isOnline,
        memoryWarning: false,
        appVersion: '1.0.0',
      },
    };

    this.logs.unshift(crashLog);
    await this.saveLogs();
    
    // Send to LogRocket in production (native only)
    if (!__DEV__ && LogRocket && Platform.OS !== 'web') {
      LogRocket.captureException(errorObj, {
        tags: { severity: crashLog.severity, category: crashLog.category },
        extra: { screenName: crashLog.screenName, ...options.extra },
      });
    }

    console.error(`[CrashReporter] ${crashLog.severity.toUpperCase()}: ${crashLog.message}`);
    
    return crashLog.id;
  }


  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('token') || message.includes('login')) {
      return 'auth';
    }
    if (message.includes('payment') || message.includes('transaction') || message.includes('wallet')) {
      return 'payment';
    }
    if (stack.includes('asyncstorage') || message.includes('storage')) {
      return 'storage';
    }
    if (stack.includes('render') || stack.includes('component')) {
      return 'ui';
    }
    return 'unknown';
  }

  async getLogs(limit = 50): Promise<CrashLog[]> {
    return this.logs.slice(0, limit);
  }

  async getLogsByCategory(category: ErrorCategory): Promise<CrashLog[]> {
    return this.logs.filter(log => log.category === category);
  }

  async getLogsBySeverity(severity: ErrorSeverity): Promise<CrashLog[]> {
    return this.logs.filter(log => log.severity === severity);
  }

  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem(STORAGE_KEYS.CRASH_LOGS);
  }

  async getErrorStats(): Promise<{
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    lastCrash?: CrashLog;
  }> {
    const byCategory: Record<ErrorCategory, number> = {
      network: 0, auth: 0, payment: 0, ui: 0, storage: 0, unknown: 0
    };
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    this.logs.forEach(log => {
      byCategory[log.category]++;
      bySeverity[log.severity]++;
    });

    return {
      total: this.logs.length,
      byCategory,
      bySeverity,
      lastCrash: this.logs[0],
    };
  }
}

export const crashReporter = new CrashReporter();
export default crashReporter;
