// GMG Uganda Mobile App - API Service
// Connects to the Express.js backend

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ApiResponse, AuthTokens, User, Wallet, Transaction, SendMoneyRequest, DepositRequest, Beneficiary } from '../types';
import notificationSound from './notificationSound';

import ENV from '../config/environment';

// API Configuration - Environment-based URL
const API_BASE_URL = `${ENV.apiUrl}/api`;

// Web-compatible storage wrapper
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  }
};

class ApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          
          try {
            const newTokens = await this.refreshAccessToken();
            if (newTokens) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.logout();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Initialize tokens from storage
  async init(): Promise<boolean> {
    try {
      console.log('[API] Loading tokens from storage...');
      // Add timeout for storage operations
      const getToken = async (key: string): Promise<string | null> => {
        return Promise.race([
          storage.getItem(key),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
      };
      
      this.accessToken = await getToken('accessToken');
      this.refreshToken = await getToken('refreshToken');
      console.log('[API] Tokens loaded, hasToken:', !!this.accessToken);
      return !!this.accessToken;
    } catch (error) {
      console.error('[API] Storage error:', error);
      return false;
    }
  }

  // Store tokens securely
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    await storage.setItem('accessToken', tokens.accessToken);
    await storage.setItem('refreshToken', tokens.refreshToken);
  }

  // Clear tokens
  private async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
  }

  // ==================== AUTH ====================

  // Send OTP - supports SMS (default) or WhatsApp channel
  async sendOTP(phone: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<ApiResponse<{ expiresIn: number }>> {
    try {
      const response = await this.client.post('/auth/send-otp', { phone, channel });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to send OTP' };
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<ApiResponse<{ user: User; wallets: Wallet[] } & AuthTokens>> {
    try {
      const response = await this.client.post('/auth/verify-otp', { phone, otp });
      if (response.data.success && response.data.data) {
        await this.storeTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          expiresIn: response.data.data.expiresIn,
        });
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Verification failed' };
    }
  }

  async validateToken(): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await this.client.post('/auth/validate');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Invalid token' };
    }
  }

  private async refreshAccessToken(): Promise<AuthTokens | null> {
    try {
      const response = await this.client.post('/auth/refresh', {
        refreshToken: this.refreshToken,
      });
      if (response.data.success) {
        const tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: this.refreshToken!,
          expiresIn: response.data.data.expiresIn,
        };
        await this.storeTokens(tokens);
        return tokens;
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch {
      // Ignore errors
    }
    await this.clearTokens();
  }

  // Google Sign-In (legacy - direct without phone verification)
  async googleSignIn(data: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }): Promise<ApiResponse<{ user: User; wallets: Wallet[] } & AuthTokens>> {
    try {
      const response = await this.client.post('/auth/google', data);
      if (response.data.success && response.data.data) {
        await this.storeTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          expiresIn: response.data.data.expiresIn,
        });
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Google sign-in failed' };
    }
  }

  // Google Sign-In with Phone Verification (WhatsApp OTP)
  async googleSignInWithPhone(data: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
    phone: string;
    otp: string;
  }): Promise<ApiResponse<{ user: User; wallets: Wallet[] } & AuthTokens>> {
    try {
      const response = await this.client.post('/auth/google-with-phone', data);
      if (response.data.success && response.data.data) {
        await this.storeTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          expiresIn: response.data.data.expiresIn,
        });
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Google sign-in with phone failed' };
    }
  }

  // Apple Sign-In (legacy - direct without phone verification)
  async appleSignIn(data: {
    email: string;
    name: string;
    appleId: string;
  }): Promise<ApiResponse<{ user: User; wallets: Wallet[] } & AuthTokens>> {
    try {
      const response = await this.client.post('/auth/apple', data);
      if (response.data.success && response.data.data) {
        await this.storeTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          expiresIn: response.data.data.expiresIn,
        });
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Apple sign-in failed' };
    }
  }

  // Apple Sign-In with Phone Verification (WhatsApp OTP)
  async appleSignInWithPhone(data: {
    email: string;
    name: string;
    appleId: string;
    phone: string;
    otp: string;
  }): Promise<ApiResponse<{ user: User; wallets: Wallet[] } & AuthTokens>> {
    try {
      const response = await this.client.post('/auth/apple-with-phone', data);
      if (response.data.success && response.data.data) {
        await this.storeTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          expiresIn: response.data.data.expiresIn,
        });
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Apple sign-in with phone failed' };
    }
  }

  // ==================== WALLET ====================

  async getBalance(): Promise<ApiResponse<{ wallets: Wallet[] }>> {
    try {
      const response = await this.client.get('/wallet/balance');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get balance' };
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(limit = 20, offset = 0): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    try {
      const response = await this.client.get('/transactions', { params: { limit, offset } });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get transactions' };
    }
  }

  async sendMoney(data: SendMoneyRequest): Promise<ApiResponse<Transaction>> {
    try {
      const response = await this.client.post('/transactions/send', data);
      if (response.data.success) {
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Transfer failed' };
    }
  }

  async deposit(data: DepositRequest): Promise<ApiResponse<{ transactionId: number; reference: string }>> {
    try {
      const response = await this.client.post('/transactions/deposit', data);
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Deposit failed' };
    }
  }

  async withdraw(data: { amount: number; method: 'MTN' | 'AIRTEL'; phone: string; pin: string }): Promise<ApiResponse<{ transactionId: number; reference: string }>> {
    try {
      const response = await this.client.post('/transactions/withdraw', data);
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Withdrawal failed' };
    }
  }

  // ==================== BILLS & AIRTIME ====================

  async purchaseAirtime(data: {
    phoneNumber: string;
    network: string;
    amount: number;
    country: string;
  }): Promise<ApiResponse<{ reference: string; cashback: number }>> {
    try {
      const response = await this.client.post('/bills/airtime', data);
      if (response.data.success) {
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Airtime purchase failed' };
    }
  }

  async getRecentAirtime(limit = 10): Promise<ApiResponse<{ transactions: any[] }>> {
    try {
      const response = await this.client.get('/bills/airtime/recent', { params: { limit } });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get airtime history' };
    }
  }

  // ==================== BENEFICIARIES ====================

  async getBeneficiaries(): Promise<ApiResponse<{ beneficiaries: Beneficiary[] }>> {
    try {
      const response = await this.client.get('/beneficiaries');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get beneficiaries' };
    }
  }

  async addBeneficiary(phone: string, name: string): Promise<ApiResponse<Beneficiary>> {
    try {
      const response = await this.client.post('/beneficiaries', { phone, name });
      if (response.data.success) {
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Failed to add beneficiary' };
    }
  }

  async deleteBeneficiary(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete(`/beneficiaries/${id}`);
      if (response.data.success) {
        notificationSound.playInfo();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Failed to delete beneficiary' };
    }
  }

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<ApiResponse<{ user: User; wallets: Wallet[]; recentTransactions: Transaction[] }>> {
    try {
      const response = await this.client.get('/dashboard');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to load dashboard' };
    }
  }

  // ==================== CRYPTO/BLOCKCHAIN ====================

  async getCryptoPrices(symbols: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/blockchain/prices', { params: { symbols } });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get prices' };
    }
  }

  async getCryptoPortfolio(): Promise<ApiResponse<{ balances: any[]; totalUsdValue: string }>> {
    try {
      const response = await this.client.get('/blockchain/portfolio');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get portfolio' };
    }
  }

  async buyCrypto(symbol: string, amount: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/blockchain/buy', { symbol, amount });
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Buy failed' };
    }
  }

  async sellCrypto(symbol: string, quantity: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/blockchain/sell', { symbol, quantity });
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Sell failed' };
    }
  }

  async swapCrypto(fromAsset: string, toAsset: string, amount: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/blockchain/swap', { fromAsset, toAsset, amount });
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Swap failed' };
    }
  }

  async getCryptoDepositAddress(coin: string, network: string): Promise<ApiResponse<{ address: string }>> {
    try {
      const response = await this.client.get('/blockchain/deposit-address', { params: { coin, network } });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get address' };
    }
  }

  async withdrawCrypto(coin: string, address: string, amount: number, network: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/blockchain/withdraw', { coin, address, amount, network });
      if (response.data.success) {
        notificationSound.playTransaction();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Withdrawal failed' };
    }
  }

  // Get company deposit addresses for crypto deposits (XLM, BTC, ETH, etc.)
  async getCompanyDepositAddresses(): Promise<ApiResponse<Record<string, {
    address: string;
    network: string;
    name: string;
    memo?: string | null;
    minDeposit: number;
    confirmations: number;
  }>>> {
    try {
      const response = await this.client.get('/blockchain/company-addresses');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get deposit addresses' };
    }
  }

  // ==================== KYC ====================

  async submitKYC(data: {
    tier: number;
    personalInfo: {
      fullName: string;
      dateOfBirth: string;
      gender: string;
      nationalId: string;
      district: string;
    };
    documents: {
      idFront: string | null;
      idBack: string | null;
      selfie: string | null;
    };
  }): Promise<ApiResponse<{ kycId: string; status: string }>> {
    try {
      const response = await this.client.post('/kyc/submit', data);
      if (response.data.success) {
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'KYC submission failed' };
    }
  }

  async getKYCStatus(): Promise<ApiResponse<{ tier: number; status: string; submittedAt?: string }>> {
    try {
      const response = await this.client.get('/kyc/status');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to get KYC status' };
    }
  }

  // App Version Check - for update notifications
  async getAppVersion(platform: string): Promise<ApiResponse<{
    latestVersion: string;
    minSupportedVersion: string;
    releaseNotes?: string;
    forceUpdate?: boolean;
  }>> {
    try {
      const response = await this.client.get(`/app/version?platform=${platform}`);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to check app version' };
    }
  }

  // Profile Photo - Upload
  async updateProfilePhoto(base64Image: string): Promise<ApiResponse<{ profilePicture: string }>> {
    try {
      const response = await this.client.post('/user/profile-photo', { image: base64Image });
      if (response.data.success) {
        notificationSound.playSuccess();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Failed to upload photo' };
    }
  }

  // Profile Photo - Remove
  async removeProfilePhoto(): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete('/user/profile-photo');
      if (response.data.success) {
        notificationSound.playInfo();
      } else {
        notificationSound.playError();
      }
      return response.data;
    } catch (error: any) {
      notificationSound.playError();
      return { success: false, error: error.response?.data?.error || 'Failed to remove photo' };
    }
  }

  // Generic HTTP methods for flexibility
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Request failed' };
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Request failed' };
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Request failed' };
    }
  }
}

export const api = new ApiService();
export default api;
