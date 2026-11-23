/**
 * GMG Uganda - Database API Integration
 * Connects frontend to backend services and database
 */

const API_BASE_URL = 'http://localhost:3010/api';
const SERVICES = {
  AUTH: 'http://localhost:3001',
  USER: 'http://localhost:3002',
  PAYMENT: 'http://localhost:3003',
  TRADING: 'http://localhost:3004',
  SECURITY: 'http://localhost:3005',
  AIRTIME: 'http://localhost:3006',
  CARD: 'http://localhost:3007',
  AGENT: 'http://localhost:3008',
  NOTIFICATION: 'http://localhost:3009',
};

class DatabaseAPI {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.userId = localStorage.getItem('user_id');
  }

  // ==================== AUTH OPERATIONS ====================
  async createUser(phone, email, name, pin) {
    try {
      const response = await fetch(`${SERVICES.AUTH}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, name, pin }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('auth_token', data.token);
        this.token = data.token;
        this.userId = data.user_id;
      }
      return data;
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  async login(phone, otp) {
    try {
      const response = await fetch(`${SERVICES.AUTH}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('auth_token', data.token);
        this.token = data.token;
        this.userId = data.user_id;
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOTP(phone) {
    try {
      const response = await fetch(`${SERVICES.AUTH}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== USER OPERATIONS ====================
  async getUserDashboard() {
    try {
      const response = await fetch(`${SERVICES.USER}/users/dashboard`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get dashboard error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile() {
    try {
      const response = await fetch(`${SERVICES.USER}/users/profile`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async upgradeKYC(level, documents) {
    try {
      const formData = new FormData();
      formData.append('kyc_level', level);
      Object.keys(documents).forEach(key => {
        formData.append(key, documents[key]);
      });

      const response = await fetch(`${SERVICES.USER}/users/kyc/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Upgrade KYC error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== WALLET OPERATIONS ====================
  async getWalletBalance(currency = 'UGX') {
    try {
      const response = await fetch(`${SERVICES.USER}/wallets/balance?currency=${currency}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get wallet balance error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllWallets() {
    try {
      const response = await fetch(`${SERVICES.USER}/wallets`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get wallets error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================
  async depositMoney(amount, currency, method) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/payments/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ amount, currency, method }),
      });
      return await response.json();
    } catch (error) {
      console.error('Deposit error:', error);
      return { success: false, error: error.message };
    }
  }

  async withdrawMoney(amount, currency, method) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/payments/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ amount, currency, method }),
      });
      return await response.json();
    } catch (error) {
      console.error('Withdraw error:', error);
      return { success: false, error: error.message };
    }
  }

  async transferMoney(recipientPhone, amount, currency, description) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/payments/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ recipientPhone, amount, currency, description }),
      });
      return await response.json();
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: error.message };
    }
  }

  async getTransactionHistory(startDate, endDate, type = null, limit = 50) {
    try {
      let url = `${SERVICES.PAYMENT}/payments/history?startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
      if (type) url += `&type=${type}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get transaction history error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== AIRTIME OPERATIONS ====================
  async buyAirtime(phone, network, amount) {
    try {
      const response = await fetch(`${SERVICES.AIRTIME}/airtime/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ phone, network, amount }),
      });
      return await response.json();
    } catch (error) {
      console.error('Buy airtime error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== DATA OPERATIONS ====================
  async buyData(phone, network, bundleId) {
    try {
      const response = await fetch(`${SERVICES.AIRTIME}/data/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ phone, network, bundleId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Buy data error:', error);
      return { success: false, error: error.message };
    }
  }

  async getDataBundles(network = null) {
    try {
      let url = `${SERVICES.AIRTIME}/data/bundles`;
      if (network) url += `?network=${network}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get data bundles error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== BILL PAYMENT OPERATIONS ====================
  async payBill(billType, provider, accountNumber, amount) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/bills/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ billType, provider, accountNumber, amount }),
      });
      return await response.json();
    } catch (error) {
      console.error('Pay bill error:', error);
      return { success: false, error: error.message };
    }
  }

  async getBillProviders(billType = null) {
    try {
      let url = `${SERVICES.PAYMENT}/bills/providers`;
      if (billType) url += `?billType=${billType}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get bill providers error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CARD OPERATIONS ====================
  async createVirtualCard(cardholderName, initialBalance) {
    try {
      const response = await fetch(`${SERVICES.CARD}/cards/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ cardholderName, initialBalance }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create card error:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveCards() {
    try {
      const response = await fetch(`${SERVICES.CARD}/cards/active`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get cards error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCardDetails(cardId) {
    try {
      const response = await fetch(`${SERVICES.CARD}/cards/${cardId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get card details error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== LOAN OPERATIONS ====================
  async applyLoan(amount, periodDays, purpose) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ amount, periodDays, purpose }),
      });
      return await response.json();
    } catch (error) {
      console.error('Apply loan error:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveLoans() {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/loans/active`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get loans error:', error);
      return { success: false, error: error.message };
    }
  }

  async repayLoan(loanId, amount) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/loans/${loanId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ amount }),
      });
      return await response.json();
    } catch (error) {
      console.error('Repay loan error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== INSURANCE OPERATIONS ====================
  async subscribeInsurance(insuranceType, plan, beneficiaryName, beneficiaryPhone) {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/insurance/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ insuranceType, plan, beneficiaryName, beneficiaryPhone }),
      });
      return await response.json();
    } catch (error) {
      console.error('Subscribe insurance error:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveInsurance() {
    try {
      const response = await fetch(`${SERVICES.PAYMENT}/insurance/active`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get insurance error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== AGENT OPERATIONS ====================
  async registerAgent(businessName, location, latitude, longitude) {
    try {
      const response = await fetch(`${SERVICES.AGENT}/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ businessName, location, latitude, longitude }),
      });
      return await response.json();
    } catch (error) {
      console.error('Register agent error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAgentDetails() {
    try {
      const response = await fetch(`${SERVICES.AGENT}/agents/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get agent details error:', error);
      return { success: false, error: error.message };
    }
  }

  async agentTransaction(customerPhone, transactionType, amount) {
    try {
      const response = await fetch(`${SERVICES.AGENT}/agents/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ customerPhone, transactionType, amount }),
      });
      return await response.json();
    } catch (error) {
      console.error('Agent transaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== TRADING OPERATIONS ====================
  async getMarketData(symbol) {
    try {
      const response = await fetch(`${SERVICES.TRADING}/trading/market/${symbol}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get market data error:', error);
      return { success: false, error: error.message };
    }
  }

  async placeOrder(symbol, type, quantity, price) {
    try {
      const response = await fetch(`${SERVICES.TRADING}/trading/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ symbol, type, quantity, price }),
      });
      return await response.json();
    } catch (error) {
      console.error('Place order error:', error);
      return { success: false, error: error.message };
    }
  }

  async getPortfolio() {
    try {
      const response = await fetch(`${SERVICES.TRADING}/trading/portfolio`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get portfolio error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== NOTIFICATION OPERATIONS ====================
  async getNotifications(limit = 20) {
    try {
      const response = await fetch(`${SERVICES.NOTIFICATION}/notifications?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`${SERVICES.NOTIFICATION}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Mark notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== SECURITY OPERATIONS ====================
  async enable2FA() {
    try {
      const response = await fetch(`${SERVICES.SECURITY}/security/2fa/enable`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return { success: false, error: error.message };
    }
  }

  async verify2FA(code) {
    try {
      const response = await fetch(`${SERVICES.SECURITY}/security/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ code }),
      });
      return await response.json();
    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    this.token = null;
    this.userId = null;
  }

  isAuthenticated() {
    return !!this.token && !!this.userId;
  }

  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }
}

// Initialize global API instance
const db = new DatabaseAPI();
