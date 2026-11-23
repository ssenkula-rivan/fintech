/**
 * ============================================
 * GMG UGANDA EXCHANGE API ROUTES
 * Production-Ready REST API
 * ============================================
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const GMGExchange = require('../services/gmgExchange');
const { authenticateToken } = require('../middleware/auth');
const { body, query, param, validationResult } = require('express-validator');

// Database pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmg_uganda',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

// Initialize exchange
const exchange = new GMGExchange(pool);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * GET /api/exchange/info
 * Exchange information
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'GMG Global Exchange',
      timezone: 'UTC',
      serverTime: Date.now(),
      rateLimits: [
        { type: 'REQUEST_WEIGHT', interval: 'MINUTE', limit: 1200 },
        { type: 'ORDERS', interval: 'SECOND', limit: 10 },
        { type: 'ORDERS', interval: 'DAY', limit: 100000 }
      ],
      symbols: exchange.getTradingPairs()
    }
  });
});

/**
 * GET /api/exchange/pairs
 * Get all trading pairs
 */
router.get('/pairs', (req, res) => {
  res.json({
    success: true,
    data: exchange.getTradingPairs()
  });
});

/**
 * GET /api/exchange/ticker
 * Get 24hr ticker for all symbols or specific symbol
 */
router.get('/ticker', async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (symbol) {
      const ticker = await exchange.getTicker(symbol.toUpperCase());
      return res.json({ success: true, data: ticker });
    }
    
    const tickers = await exchange.getAllTickers();
    res.json({ success: true, data: tickers });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/depth/:symbol
 * Get order book depth
 */
router.get('/depth/:symbol', [
  param('symbol').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const orderBook = exchange.getOrderBook(symbol.toUpperCase(), limit);
    res.json({ success: true, data: orderBook });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/trades/:symbol
 * Get recent trades
 */
router.get('/trades/:symbol', [
  param('symbol').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 500 })
], validate, async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const trades = await exchange.getRecentTrades(symbol.toUpperCase(), limit);
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

/**
 * GET /api/exchange/account
 * Get account information
 */
router.get('/account', authenticateToken, async (req, res) => {
  try {
    const balances = await exchange.getAllBalances(req.user.id);
    
    res.json({
      success: true,
      data: {
        userId: req.user.id,
        balances,
        canTrade: true,
        canWithdraw: true,
        canDeposit: true,
        updateTime: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/balance/:asset
 * Get specific asset balance
 */
router.get('/balance/:asset', authenticateToken, async (req, res) => {
  try {
    const balance = await exchange.getBalance(req.user.id, req.params.asset.toUpperCase());
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/exchange/order
 * Place a new order
 */
router.post('/order', authenticateToken, [
  body('symbol').notEmpty().trim(),
  body('side').isIn(['BUY', 'SELL']),
  body('type').isIn(['MARKET', 'LIMIT']),
  body('quantity').isFloat({ min: 0.00000001 }),
  body('price').optional().isFloat({ min: 0 }),
  body('timeInForce').optional().isIn(['GTC', 'IOC', 'FOK'])
], validate, async (req, res) => {
  try {
    const { symbol, side, type, quantity, price, timeInForce } = req.body;
    
    const order = await exchange.placeOrder({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : null,
      timeInForce: timeInForce || 'GTC'
    });
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/exchange/order/:orderId
 * Cancel an order
 */
router.delete('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const result = await exchange.cancelOrder(req.user.id, req.params.orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/exchange/orders
 * Cancel all open orders
 */
router.delete('/orders', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.query;
    const results = await exchange.cancelAllOrders(req.user.id, symbol?.toUpperCase());
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/order/:orderId
 * Get order details
 */
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await exchange.getOrder(req.user.id, req.params.orderId);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/openOrders
 * Get all open orders
 */
router.get('/openOrders', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.query;
    const orders = await exchange.getOpenOrders(req.user.id, symbol?.toUpperCase());
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/orders
 * Get order history
 */
router.get('/orders', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
  try {
    const { symbol, limit, offset } = req.query;
    const orders = await exchange.getOrderHistory(req.user.id, {
      symbol: symbol?.toUpperCase(),
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/exchange/myTrades
 * Get trade history
 */
router.get('/myTrades', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 })
], validate, async (req, res) => {
  try {
    const { symbol, limit, offset } = req.query;
    const trades = await exchange.getTradeHistory(req.user.id, {
      symbol: symbol?.toUpperCase(),
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/exchange/deposit
 * Record a deposit (internal use / admin)
 */
router.post('/deposit', authenticateToken, [
  body('asset').notEmpty().trim(),
  body('amount').isFloat({ min: 0.00000001 }),
  body('txHash').optional().trim()
], validate, async (req, res) => {
  try {
    const { asset, amount, txHash } = req.body;
    
    const result = await exchange.deposit(
      req.user.id,
      asset.toUpperCase(),
      parseFloat(amount),
      txHash
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/exchange/withdraw
 * Request a withdrawal
 */
router.post('/withdraw', authenticateToken, [
  body('asset').notEmpty().trim(),
  body('amount').isFloat({ min: 0.00000001 }),
  body('address').notEmpty().trim()
], validate, async (req, res) => {
  try {
    const { asset, amount, address } = req.body;
    
    const result = await exchange.withdraw(
      req.user.id,
      asset.toUpperCase(),
      parseFloat(amount),
      address
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
