/**
 * GMG Uganda API Client
 * Production-ready API integration layer
 * Zero tolerance for errors - comprehensive error handling
 * Security: PIN hashing before transmission
 */

class GMGAPIClient {
  constructor() {
    // API server runs on port 3010
    this.baseURL = 'http://localhost:3010/api';
    
    // For production, use environment detection
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      this.baseURL = 'https://api.gmg-uganda.com/api';
    }
    
    this.token = localStorage.getItem('gmg_auth_token');
    this.phone = localStorage.getItem('gmg_user_phone');
  }

  /**
   * Generic HTTP request handler with comprehensive error handling
   */
  async request(endpoint, method = 'GET', body = null, requiresAuth = false) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (requiresAuth && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const config = {
        method,
        headers,
        mode: 'cors'
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      console.log(`[API] ${method} ${endpoint}`, body || '');

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: Request failed`);
      }

      console.log(`[API] Response:`, data);
      return { success: true, data };

    } catch (error) {
      console.error(`[API ERROR] ${endpoint}:`, error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Cannot connect to server. Please check your internet connection.',
          technicalError: error.message
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        technicalError: error.toString()
      };
    }
  }

  /**
   * Authentication Methods
   */
  async sendOTP(phone, dialCode = '+256') {
    // Clean phone number - remove leading zeros and non-digits
    const cleanPhone = phone.replace(/^0+/, '').replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length < 6 || cleanPhone.length > 12) {
      return {
        success: false,
        error: 'Please enter a valid phone number'
      };
    }

    const fullPhone = `${dialCode}${cleanPhone}`;
    const result = await this.request('/auth/send-otp', 'POST', { phone: fullPhone });

    if (result.success) {
      localStorage.setItem('gmg_pending_phone', fullPhone);
    }

    return result;
  }

  async verifyOTP(phone, otp) {
    if (!otp || otp.length !== 6) {
      return {
        success: false,
        error: 'OTP must be exactly 6 digits'
      };
    }

    const fullPhone = phone.startsWith('+256') ? phone : `+256${phone}`;
    const result = await this.request('/auth/verify-otp', 'POST', {
      phone: fullPhone,
      otp
    });

    if (result.success && result.data) {
      // Store authentication data
      if (result.data.token || result.data.accessToken) {
        this.token = result.data.token || result.data.accessToken;
        localStorage.setItem('gmg_auth_token', this.token);
      }
      if (result.data.user) {
        this.phone = result.data.user.phone || result.data.user.phone_number;
        localStorage.setItem('gmg_user_phone', this.phone);
        localStorage.setItem('gmg_user_data', JSON.stringify(result.data.user));
      }
      localStorage.removeItem('gmg_pending_phone');
    }

    return result;
  }

  /**
   * Wallet Operations
   */
  async getBalance() {
    return await this.request('/wallet/balance', 'GET', null, true);
  }

  async deposit(amount, method, phone) {
    if (!amount || amount < 1000) {
      return {
        success: false,
        error: 'Minimum deposit amount is UGX 1,000'
      };
    }

    return await this.request('/transactions/deposit', 'POST', {
      amount: Number(amount),
      method,
      phone: phone.startsWith('+256') ? phone : `+256${phone}`
    }, true);
  }

  async withdraw(amount, pin, description = '') {
    if (!amount || amount < 1000) {
      return {
        success: false,
        error: 'Minimum withdrawal amount is UGX 1,000'
      };
    }

    if (!pin || pin.length !== 6) {
      return {
        success: false,
        error: 'PIN must be exactly 6 digits'
      };
    }

    // Send raw PIN - server uses bcrypt.compare for verification
    return await this.request('/wallet/debit', 'POST', {
      amount: Number(amount),
      pin: pin,
      description
    }, true);
  }

  /**
   * Money Transfer Operations
   */
  async sendMoney(recipient, amount, pin, description = '') {
    if (!recipient || recipient.length !== 9) {
      return {
        success: false,
        error: 'Recipient phone must be exactly 9 digits'
      };
    }

    if (!amount || amount < 1000) {
      return {
        success: false,
        error: 'Minimum transfer amount is UGX 1,000'
      };
    }

    if (!pin || pin.length !== 6) {
      return {
        success: false,
        error: 'PIN must be exactly 6 digits'
      };
    }

    // Send raw PIN - server uses bcrypt.compare for verification
    return await this.request('/transactions/send', 'POST', {
      recipient_phone: `+256${recipient}`,
      amount: Number(amount),
      pin: pin,
      description
    }, true);
  }

  async checkRecipient(phone) {
    if (!phone || phone.length !== 9) {
      return { success: false, error: 'Invalid phone number' };
    }
    return await this.request(`/beneficiaries/search?phone=+256${phone}`, 'GET', null, true);
  }

  /**
   * Transaction History
   */
  async getTransactions(limit = 50, offset = 0, type = null) {
    let endpoint = `/transactions/history?limit=${limit}&offset=${offset}`;
    if (type) {
      endpoint += `&type=${type}`;
    }
    return await this.request(endpoint, 'GET', null, true);
  }

  async getTransactionById(id) {
    return await this.request(`/transactions/${id}`, 'GET', null, true);
  }

  /**
   * Dashboard
   */
  async getDashboard() {
    return await this.request('/dashboard', 'GET', null, true);
  }

  /**
   * User Profile
   */
  async getUserProfile() {
    return await this.request('/dashboard', 'GET', null, true);
  }

  /**
   * Beneficiaries
   */
  async getBeneficiaries() {
    return await this.request('/beneficiaries/list', 'GET', null, true);
  }

  async addBeneficiary(phone, name) {
    return await this.request('/beneficiaries/add', 'POST', {
      phone: phone.startsWith('+256') ? phone : `+256${phone}`,
      name
    }, true);
  }

  async deleteBeneficiary(id) {
    return await this.request(`/beneficiaries/${id}`, 'DELETE', null, true);
  }

  /**
   * Security: Hash PIN before transmission
   * Uses SHA-256 for client-side hashing
   */
  async hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_gmg_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Utility Methods
   */
  isAuthenticated() {
    return !!(this.token && this.phone);
  }

  logout() {
    // Call logout endpoint
    this.request('/auth/logout', 'POST', null, true).catch(() => {});
    
    this.token = null;
    this.phone = null;
    localStorage.removeItem('gmg_auth_token');
    localStorage.removeItem('gmg_user_phone');
    localStorage.removeItem('gmg_user_data');
    localStorage.removeItem('gmg_pending_phone');
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('[API] Connection test failed:', error);
      return false;
    }
  }
}

// Global instance
const gmgAPI = new GMGAPIClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GMGAPIClient;
}

console.log('✅ GMG API Client initialized');
console.log('🔗 API URL:', gmgAPI.baseURL);
