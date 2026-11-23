// GMG Uganda Mobile App - Type Definitions

export interface User {
  id: number;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  kycTier: number;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NONE';
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  profilePicture?: string;
  createdAt?: string;
}

export interface Wallet {
  id: number;
  currency: string;
  balance: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

export interface Transaction {
  id: number;
  type: 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAW' | 'AIRTIME' | 'BILL' | 'CRYPTO_BUY' | 'CRYPTO_SELL';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  recipientPhone?: string;
  recipientName?: string;
  reference?: string;
  createdAt: string;
  fee?: number;
  counterpartyName?: string;
  counterpartyPhone?: string;
  transactionId?: number;
}

export interface Beneficiary {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  isFavorite?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SendMoneyRequest {
  recipientPhone: string;
  amount: number;
  currency: string;
  description?: string;
  pin?: string;
}

export interface DepositRequest {
  amount: number;
  currency?: string;
  method: 'MTN' | 'AIRTEL' | 'BANK';
  phone?: string;
  bankId?: string;
  bankAccountNumber?: string;
  bankReference?: string;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'transaction' | 'promo' | 'alert' | 'reminder' | 'update';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface CrashLog {
  id: string;
  error: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
}
