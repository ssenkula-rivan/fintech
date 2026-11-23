// ============================================
// BINANCE BLOCKCHAIN SERVICE
// Production-Ready Integration for GMG Uganda
// ============================================
const crypto = require('crypto');
const axios = require('axios');

class BinanceService {
  constructor() {
    // CRITICAL: Never hardcode credentials
    this.apiKey = process.env.BINANCE_API_KEY;
    this.apiSecret = process.env.BINANCE_API_SECRET;

    // Use testnet for development, mainnet for production
    this.baseURL =
      process.env.NODE_ENV === 'production'
        ? 'https://api.binance.com'
        : 'https://testnet.binance.vision';

    if (!this.apiKey || !this.apiSecret) {
      console.warn('BINANCE_API_KEY and BINANCE_API_SECRET not set - Binance features disabled');
    }
  }

  /**
   * Generate signature for authenticated requests
   * @param {string} queryString - URL encoded query parameters
   * @returns {string} HMAC SHA256 signature
   */
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Make authenticated request to Binance API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @param {string} method - HTTP method (GET, POST, DELETE)
   * @returns {Promise<object>} API response
   */
  async makeRequest(endpoint, params = {}, method = 'GET') {
    if (!this.apiKey || !this.apiSecret) {
      return { success: false, error: 'Binance API not configured' };
    }

    try {
      const timestamp = Date.now();
      const queryString = new URLSearchParams({ ...params, timestamp }).toString();
      const signature = this.generateSignature(queryString);

      const url = `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`;

      const config = {
        method,
        url,
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
        timeout: 30000,
      };

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Binance API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
        code: error.response?.data?.code,
      };
    }
  }

  // ============================================
  // ACCOUNT OPERATIONS
  // ============================================

  async getAccountInfo() {
    return await this.makeRequest('/api/v3/account');
  }

  async getAssetBalance(asset) {
    const accountInfo = await this.getAccountInfo();
    if (!accountInfo.success) return accountInfo;

    const balance = accountInfo.data.balances.find((b) => b.asset === asset);
    if (!balance) {
      return {
        success: true,
        data: { asset, free: '0.00000000', locked: '0.00000000', total: '0.00000000' },
      };
    }

    return {
      success: true,
      data: {
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
        total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
      },
    };
  }

  // ============================================
  // MARKET DATA
  // ============================================

  async getPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v3/ticker/price`, {
        params: { symbol },
        timeout: 10000,
      });
      return { success: true, data: { symbol: response.data.symbol, price: response.data.price } };
    } catch (error) {
      return { success: false, error: error.response?.data?.msg || error.message };
    }
  }

  async get24hrTicker(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v3/ticker/24hr`, {
        params: { symbol },
        timeout: 10000,
      });
      return {
        success: true,
        data: {
          symbol: response.data.symbol,
          priceChange: response.data.priceChange,
          priceChangePercent: response.data.priceChangePercent,
          lastPrice: response.data.lastPrice,
          volume: response.data.volume,
          high: response.data.highPrice,
          low: response.data.lowPrice,
        },
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.msg || error.message };
    }
  }

  async getAllPrices() {
    try {
      const response = await axios.get(`${this.baseURL}/api/v3/ticker/price`, { timeout: 10000 });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.msg || error.message };
    }
  }

  // ============================================
  // TRADING OPERATIONS
  // ============================================

  async marketBuy(symbol, quantity) {
    return await this.makeRequest('/api/v3/order', {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: quantity.toString(),
    }, 'POST');
  }

  async marketSell(symbol, quantity) {
    return await this.makeRequest('/api/v3/order', {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toString(),
    }, 'POST');
  }

  async limitBuy(symbol, quantity, price) {
    return await this.makeRequest('/api/v3/order', {
      symbol,
      side: 'BUY',
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: quantity.toString(),
      price: price.toString(),
    }, 'POST');
  }

  async limitSell(symbol, quantity, price) {
    return await this.makeRequest('/api/v3/order', {
      symbol,
      side: 'SELL',
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: quantity.toString(),
      price: price.toString(),
    }, 'POST');
  }

  async cancelOrder(symbol, orderId) {
    return await this.makeRequest('/api/v3/order', { symbol, orderId }, 'DELETE');
  }

  async getOrder(symbol, orderId) {
    return await this.makeRequest('/api/v3/order', { symbol, orderId }, 'GET');
  }

  async getOpenOrders(symbol = null) {
    const params = symbol ? { symbol } : {};
    return await this.makeRequest('/api/v3/openOrders', params);
  }

  // ============================================
  // WITHDRAWAL & DEPOSIT
  // ============================================

  async withdraw(coin, address, amount, network) {
    return await this.makeRequest('/sapi/v1/capital/withdraw/apply', {
      coin,
      address,
      amount: amount.toString(),
      network,
    }, 'POST');
  }

  async getWithdrawalHistory(coin = null) {
    const params = coin ? { coin } : {};
    return await this.makeRequest('/sapi/v1/capital/withdraw/history', params);
  }

  async getDepositAddress(coin, network) {
    return await this.makeRequest('/sapi/v1/capital/deposit/address', { coin, network });
  }

  async getDepositHistory(coin = null) {
    const params = coin ? { coin } : {};
    return await this.makeRequest('/sapi/v1/capital/deposit/hisrec', params);
  }

  // ============================================
  // CONVERT (SIMPLE SWAP)
  // ============================================

  async convertAsset(fromAsset, toAsset, fromAmount) {
    return await this.makeRequest('/sapi/v1/convert/getQuote', {
      fromAsset,
      toAsset,
      fromAmount: fromAmount.toString(),
    }, 'POST');
  }
}

module.exports = BinanceService;
