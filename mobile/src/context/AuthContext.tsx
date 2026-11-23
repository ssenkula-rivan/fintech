// GMG Uganda Mobile App - Auth Context
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import api from '../services/api';
import { User, Wallet } from '../types';

// Only import LogRocket on native platforms
let LogRocket: any = null;
if (Platform.OS !== 'web') {
  LogRocket = require('@logrocket/react-native').default;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  wallets: Wallet[];
}

interface AuthContextType extends AuthState {
  login: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (data: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  appleLogin: (data: {
    email: string;
    name: string;
    appleId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // Update user data locally
  devLogin: () => void; // DEV ONLY - bypass login for preview
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    wallets: [],
  });

  // Initialize auth state on app start
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    console.log('[Auth] Starting initialization...');
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[Auth] Timeout - forcing unauthenticated state');
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        wallets: [],
      });
    }, 5000); // 5 second timeout

    try {
      console.log('[Auth] Calling api.init()...');
      const hasToken = await api.init();
      console.log('[Auth] api.init() result:', hasToken);
      
      if (hasToken) {
        console.log('[Auth] Token found, validating...');
        const result = await api.validateToken();
        console.log('[Auth] validateToken result:', result.success);
        
        if (result.success && result.data) {
          console.log('[Auth] Token valid, getting balance...');
          const balanceResult = await api.getBalance();
          clearTimeout(timeout);
          setState({
            isLoading: false,
            isAuthenticated: true,
            user: result.data.user,
            wallets: balanceResult.data?.wallets || [],
          });
          console.log('[Auth] Authenticated successfully');
          return;
        }
      }
    } catch (error) {
      console.error('[Auth] Init error:', error);
    }

    clearTimeout(timeout);
    console.log('[Auth] Setting unauthenticated state');
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      wallets: [],
    });
  };

  const login = async (phone: string, otp: string) => {
    const result = await api.verifyOTP(phone, otp);

    if (result.success && result.data) {
      // Identify user in LogRocket (native only)
      if (!__DEV__ && LogRocket && Platform.OS !== 'web') {
        LogRocket.identify(String(result.data.user.id), {
          name: `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim(),
          phone: result.data.user.phone,
        });
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: result.data.user,
        wallets: result.data.wallets || [],
      });
      return { success: true };
    }

    return { success: false, error: result.error || 'Login failed' };
  };

  const googleLogin = async (data: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }) => {
    const result = await api.googleSignIn(data);

    if (result.success && result.data) {
      // Identify user in LogRocket (native only)
      if (!__DEV__ && LogRocket && Platform.OS !== 'web') {
        LogRocket.identify(String(result.data.user.id), {
          name: `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim(),
          email: data.email,
        });
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: result.data.user,
        wallets: result.data.wallets || [],
      });
      return { success: true };
    }

    return { success: false, error: result.error || 'Google login failed' };
  };

  const appleLogin = async (data: {
    email: string;
    name: string;
    appleId: string;
  }) => {
    const result = await api.appleSignIn(data);

    if (result.success && result.data) {
      // Identify user in LogRocket (native only)
      if (!__DEV__ && LogRocket && Platform.OS !== 'web') {
        LogRocket.identify(String(result.data.user.id), {
          name: `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim(),
          email: data.email,
        });
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: result.data.user,
        wallets: result.data.wallets || [],
      });
      return { success: true };
    }

    return { success: false, error: result.error || 'Apple login failed' };
  };

  const logout = async () => {
    await api.logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      wallets: [],
    });
  };

  const refreshUser = async () => {
    const result = await api.getDashboard();
    if (result.success && result.data) {
      setState((prev) => ({
        ...prev,
        user: result.data!.user,
        wallets: result.data!.wallets,
      }));
    }
  };

  // DEV ONLY - Bypass login for preview/testing
  const devLogin = () => {
    if (!__DEV__) return; // Only works in development
    
    const mockUser: User = {
      id: 999,
      phone: '+256700000000',
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@gmguganda.com',
      kycTier: 2,
      kycStatus: 'VERIFIED',
      status: 'ACTIVE',
    };
    
    const mockWallets: Wallet[] = [
      { id: 1, currency: 'UGX', balance: 5000000, status: 'ACTIVE' },
      { id: 2, currency: 'USD', balance: 1500, status: 'ACTIVE' },
    ];
    
    setState({
      isLoading: false,
      isAuthenticated: true,
      user: mockUser,
      wallets: mockWallets,
    });
  };

  // Update user data locally (for profile photo, etc.)
  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, googleLogin, appleLogin, logout, refreshUser, updateUser, devLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
