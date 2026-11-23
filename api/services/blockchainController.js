// ============================================
// BLOCKCHAIN TRADING CONTROLLER
// Integrates Binance with GMG Uganda Backend
// ============================================
const BinanceService = require('./binanceService');
const crypto = require('crypto');

// Generate UUID v4 using crypto
const uuidv4 = () => crypto.randomUUID();

class BlockchainController {
  constructor(dbPool) {
    this.binance = new BinanceService();
    this.dbPool = dbPool;
  }

  // ============================================
  // PORTFOLIO OPERATIONS
  // ============================================

  async getUserPortfolio(userId) {
    try {
      // Get user's crypto holdings from database
      const [holdings] = await this.dbPool.execute(
        `SELECT asset, balance, locked_balance 
         FROM crypto_wallets 
         WHERE user_id = ? AND balance > 0`,
        [userId]
      );

      if (holdings.length === 0) {
        return {
          success: true,
          data: { balances: [], totalUsdValue: '0.00', timestamp: new Date().toISOString() },
        };
      }

      // Get current prices for all assets
      const balances = await Promise.all(
        holdings.map(async (holding) => {
          const total = parseFloat(holding.balance) + parseFloat(holding.locked_balance || 0);
          let usdValue = 0;

          if (holding.asset !== 'USDT' && holding.asset !== 'USD') {
            const price = await this.binance.getPrice(`${holding.asset}USDT`);
            if (price.success) {
              usdValue = total * parseFloat(price.data.price);
            }
          } else {
            usdValue = total;
          }

          return {
            asset: holding.asset,
            free: holding.balance.toString(),
            locked: (holding.locked_balance || 0).toString(),
            total: total.toString(),
            usdValue: usdValue.toFixed(2),
          };
        })
      );

      const totalUsdValue = balances.reduce((sum, b) => sum + parseFloat(b.usdValue), 0);

      return {
        success: true,
        data: {
          balances,
          totalUsdValue: totalUsdValue.toFixed(2),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Get portfolio error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BUY CRYPTO
  // ============================================

  async buyCrypto(userId, symbol, usdtAmount) {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate user USDT balance
      const [balanceRows] = await connection.execute(
        'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
        [userId, 'USDT']
      );

      if (balanceRows.length === 0 || parseFloat(balanceRows[0].balance) < usdtAmount) {
        await connection.rollback();
        return { success: false, error: 'Insufficient USDT balance' };
      }

      // 2. Get current price
      const priceData = await this.binance.getPrice(symbol);
      if (!priceData.success) {
        await connection.rollback();
        return priceData;
      }

      const price = parseFloat(priceData.data.price);
      const quantity = (usdtAmount / price).toFixed(8);
      const asset = symbol.replace('USDT', '');

      // 3. Place market buy order on Binance
      const orderResult = await this.binance.marketBuy(symbol, quantity);
      if (!orderResult.success) {
        await connection.rollback();
        return orderResult;
      }

      // 4. Deduct USDT from user wallet
      await connection.execute(
        'UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?',
        [usdtAmount, userId, 'USDT']
      );

      // 5. Credit crypto to user's crypto wallet
      await connection.execute(
        `INSERT INTO crypto_wallets (user_id, asset, balance, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE balance = balance + ?, updated_at = NOW()`,
        [userId, asset, quantity, quantity]
      );

      // 6. Record transaction
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions 
         (id, user_id, type, amount, currency, fee, status, reference, metadata, created_at)
         VALUES (?, ?, 'CRYPTO_BUY', ?, 'USDT', 0, 'COMPLETED', ?, ?, NOW())`,
        [
          transactionId,
          userId,
          usdtAmount,
          orderResult.data?.orderId || transactionId,
          JSON.stringify({
            symbol,
            quantity: orderResult.data?.executedQty || quantity,
            price,
            binanceOrderId: orderResult.data?.orderId,
          }),
        ]
      );

      await connection.commit();

      return {
        success: true,
        data: {
          transactionId,
          orderId: orderResult.data?.orderId,
          symbol,
          quantity: orderResult.data?.executedQty || quantity,
          usdtSpent: usdtAmount,
          price,
          status: 'COMPLETED',
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Buy crypto error:', error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  // ============================================
  // SELL CRYPTO
  // ============================================

  async sellCrypto(userId, symbol, quantity) {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const asset = symbol.replace('USDT', '');

      // 1. Check user's crypto balance
      const [balanceRows] = await connection.execute(
        'SELECT balance FROM crypto_wallets WHERE user_id = ? AND asset = ?',
        [userId, asset]
      );

      if (balanceRows.length === 0 || parseFloat(balanceRows[0].balance) < quantity) {
        await connection.rollback();
        return { success: false, error: `Insufficient ${asset} balance` };
      }

      // 2. Get current price
      const priceData = await this.binance.getPrice(symbol);
      if (!priceData.success) {
        await connection.rollback();
        return priceData;
      }

      const price = parseFloat(priceData.data.price);
      const usdtReceived = (quantity * price).toFixed(2);

      // 3. Place market sell order on Binance
      const orderResult = await this.binance.marketSell(symbol, quantity);
      if (!orderResult.success) {
        await connection.rollback();
        return orderResult;
      }

      // 4. Deduct crypto from user's crypto wallet
      await connection.execute(
        'UPDATE crypto_wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ? AND asset = ?',
        [quantity, userId, asset]
      );

      // 5. Credit USDT to user wallet
      await connection.execute(
        'UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?',
        [usdtReceived, userId, 'USDT']
      );

      // 6. Record transaction
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions 
         (id, user_id, type, amount, currency, fee, status, reference, metadata, created_at)
         VALUES (?, ?, 'CRYPTO_SELL', ?, ?, 0, 'COMPLETED', ?, ?, NOW())`,
        [
          transactionId,
          userId,
          usdtReceived,
          'USDT',
          orderResult.data?.orderId || transactionId,
          JSON.stringify({
            symbol,
            quantity: orderResult.data?.executedQty || quantity,
            usdtReceived,
            price,
            binanceOrderId: orderResult.data?.orderId,
          }),
        ]
      );

      await connection.commit();

      return {
        success: true,
        data: {
          transactionId,
          orderId: orderResult.data?.orderId,
          symbol,
          quantity: orderResult.data?.executedQty || quantity,
          usdtReceived,
          price,
          status: 'COMPLETED',
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Sell crypto error:', error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  // ============================================
  // SWAP CRYPTO
  // ============================================

  async swapCrypto(userId, fromAsset, toAsset, amount) {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check balance
      const [balanceRows] = await connection.execute(
        'SELECT balance FROM crypto_wallets WHERE user_id = ? AND asset = ?',
        [userId, fromAsset]
      );

      if (balanceRows.length === 0 || parseFloat(balanceRows[0].balance) < amount) {
        await connection.rollback();
        return { success: false, error: `Insufficient ${fromAsset} balance` };
      }

      // 2. Get conversion rate (via USDT)
      const fromPrice = await this.binance.getPrice(`${fromAsset}USDT`);
      const toPrice = await this.binance.getPrice(`${toAsset}USDT`);

      if (!fromPrice.success || !toPrice.success) {
        await connection.rollback();
        return { success: false, error: 'Failed to get conversion rate' };
      }

      const fromUsd = amount * parseFloat(fromPrice.data.price);
      const toAmount = (fromUsd / parseFloat(toPrice.data.price)).toFixed(8);

      // 3. Deduct from asset
      await connection.execute(
        'UPDATE crypto_wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ? AND asset = ?',
        [amount, userId, fromAsset]
      );

      // 4. Credit to asset
      await connection.execute(
        `INSERT INTO crypto_wallets (user_id, asset, balance, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE balance = balance + ?, updated_at = NOW()`,
        [userId, toAsset, toAmount, toAmount]
      );

      // 5. Record transaction
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions 
         (id, user_id, type, amount, currency, fee, status, metadata, created_at)
         VALUES (?, ?, 'CRYPTO_SWAP', ?, ?, 0, 'COMPLETED', ?, NOW())`,
        [
          transactionId,
          userId,
          amount,
          fromAsset,
          JSON.stringify({ fromAsset, toAsset, fromAmount: amount, toAmount }),
        ]
      );

      await connection.commit();

      return {
        success: true,
        data: { transactionId, fromAsset, toAsset, fromAmount: amount, toAmount },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Swap crypto error:', error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  // ============================================
  // CRYPTO PRICES
  // ============================================

  async getPrices(symbols) {
    try {
      const prices = await Promise.all(
        symbols.map(async (symbol) => {
          const ticker = await this.binance.get24hrTicker(symbol);
          if (!ticker.success) {
            return { symbol, error: ticker.error };
          }
          return {
            symbol: ticker.data.symbol,
            price: ticker.data.lastPrice,
            change24h: ticker.data.priceChangePercent,
            volume24h: ticker.data.volume,
            high24h: ticker.data.high,
            low24h: ticker.data.low,
          };
        })
      );

      return { success: true, data: prices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // DEPOSIT ADDRESS
  // ============================================

  async getDepositAddress(userId, coin, network) {
    try {
      const result = await this.binance.getDepositAddress(coin, network);
      if (!result.success) return result;

      // Store address mapping for user
      await this.dbPool.execute(
        `INSERT INTO crypto_addresses (user_id, coin, network, address, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE address = ?, updated_at = NOW()`,
        [userId, coin, network, result.data.address, result.data.address]
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // WITHDRAWAL TO EXTERNAL WALLET
  // ============================================

  async withdrawToExternal(userId, coin, address, amount, network) {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Validate balance
      const [balanceRows] = await connection.execute(
        'SELECT balance FROM crypto_wallets WHERE user_id = ? AND asset = ?',
        [userId, coin]
      );

      if (balanceRows.length === 0 || parseFloat(balanceRows[0].balance) < amount) {
        await connection.rollback();
        return { success: false, error: `Insufficient ${coin} balance` };
      }

      // 2. Deduct from balance (lock it)
      await connection.execute(
        'UPDATE crypto_wallets SET balance = balance - ?, locked_balance = locked_balance + ?, updated_at = NOW() WHERE user_id = ? AND asset = ?',
        [amount, amount, userId, coin]
      );

      // 3. Initiate withdrawal on Binance
      const withdrawResult = await this.binance.withdraw(coin, address, amount, network);
      if (!withdrawResult.success) {
        await connection.rollback();
        return withdrawResult;
      }

      // 4. Unlock and confirm deduction
      await connection.execute(
        'UPDATE crypto_wallets SET locked_balance = locked_balance - ?, updated_at = NOW() WHERE user_id = ? AND asset = ?',
        [amount, userId, coin]
      );

      // 5. Record transaction
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions 
         (id, user_id, type, amount, currency, fee, status, reference, metadata, created_at)
         VALUES (?, ?, 'CRYPTO_WITHDRAW', ?, ?, 0, 'PENDING', ?, ?, NOW())`,
        [
          transactionId,
          userId,
          amount,
          coin,
          withdrawResult.data?.id || transactionId,
          JSON.stringify({ coin, address, amount, network, binanceWithdrawId: withdrawResult.data?.id }),
        ]
      );

      await connection.commit();

      return {
        success: true,
        data: {
          transactionId,
          withdrawId: withdrawResult.data?.id,
          coin,
          amount,
          address,
          network,
          status: 'PENDING',
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error('Withdraw error:', error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }
}

module.exports = BlockchainController;
