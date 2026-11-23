/**
 * Offline Storage Service
 * Caches data for offline access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@gmg_cache_';
const CACHE_EXPIRY_KEY = '@gmg_cache_expiry_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

interface PendingTransaction {
  id: string;
  type: 'send' | 'deposit' | 'airtime';
  data: any;
  createdAt: number;
  retryCount: number;
}

class OfflineStorage {
  /**
   * Store data with optional TTL
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;
    
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      
      if (options.ttl) {
        const expiry = Date.now() + options.ttl;
        await AsyncStorage.setItem(expiryKey, expiry.toString());
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;
    
    try {
      // Check expiry
      const expiry = await AsyncStorage.getItem(expiryKey);
      if (expiry && parseInt(expiry) < Date.now()) {
        await this.remove(key);
        return null;
      }
      
      const data = await AsyncStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove cached data
   */
  async remove(key: string): Promise<void> {
    const cacheKey = CACHE_PREFIX + key;
    const expiryKey = CACHE_EXPIRY_KEY + key;
    
    try {
      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_EXPIRY_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // ==================== Specific Cache Methods ====================

  /**
   * Cache wallet balance
   */
  async cacheBalance(wallets: any[]): Promise<void> {
    await this.set('wallets', wallets, { ttl: DEFAULT_TTL });
  }

  /**
   * Get cached balance
   */
  async getCachedBalance(): Promise<any[] | null> {
    return this.get('wallets');
  }

  /**
   * Cache transactions
   */
  async cacheTransactions(transactions: any[]): Promise<void> {
    await this.set('transactions', transactions, { ttl: DEFAULT_TTL });
  }

  /**
   * Get cached transactions
   */
  async getCachedTransactions(): Promise<any[] | null> {
    return this.get('transactions');
  }

  /**
   * Cache user profile
   */
  async cacheUser(user: any): Promise<void> {
    await this.set('user', user, { ttl: 30 * 60 * 1000 }); // 30 minutes
  }

  /**
   * Get cached user
   */
  async getCachedUser(): Promise<any | null> {
    return this.get('user');
  }

  // ==================== Pending Transactions (Offline Queue) ====================

  private readonly PENDING_KEY = '@gmg_pending_transactions';

  /**
   * Add transaction to offline queue
   */
  async queueTransaction(type: PendingTransaction['type'], data: any): Promise<string> {
    const pending = await this.getPendingTransactions();
    
    const transaction: PendingTransaction = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: Date.now(),
      retryCount: 0,
    };
    
    pending.push(transaction);
    await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(pending));
    
    return transaction.id;
  }

  /**
   * Get all pending transactions
   */
  async getPendingTransactions(): Promise<PendingTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove pending transaction
   */
  async removePendingTransaction(id: string): Promise<void> {
    const pending = await this.getPendingTransactions();
    const filtered = pending.filter(t => t.id !== id);
    await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(filtered));
  }

  /**
   * Update pending transaction retry count
   */
  async incrementRetryCount(id: string): Promise<void> {
    const pending = await this.getPendingTransactions();
    const updated = pending.map(t => 
      t.id === id ? { ...t, retryCount: t.retryCount + 1 } : t
    );
    await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(updated));
  }

  /**
   * Clear old pending transactions (older than 24 hours)
   */
  async cleanupPendingTransactions(): Promise<void> {
    const pending = await this.getPendingTransactions();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = pending.filter(t => t.createdAt > cutoff);
    await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(filtered));
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
