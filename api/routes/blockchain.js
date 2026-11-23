// ============================================
// BLOCKCHAIN TRADING ROUTES
// GMG Uganda - Crypto Trading API
// ============================================
const express = require('express');
const router = express.Router();
const BlockchainController = require('../services/blockchainController');
const { authenticateToken } = require('../middleware/auth');

let blockchainController = null;

// Initialize controller with database pool
const initController = (dbPool) => {
  blockchainController = new BlockchainController(dbPool);
};

// ============================================
// PORTFOLIO
// ============================================

// GET /api/blockchain/portfolio - Get user's crypto portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const result = await blockchainController.getUserPortfolio(req.user.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio' });
  }
});

// ============================================
// PRICES
// ============================================

// GET /api/blockchain/prices - Get crypto prices
router.get('/prices', async (req, res) => {
  try {
    const symbols = req.query.symbols?.split(',') || [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'
    ];
    const result = await blockchainController.getPrices(symbols);
    res.json(result);
  } catch (error) {
    console.error('Prices error:', error);
    res.status(500).json({ success: false, error: 'Failed to get prices' });
  }
});

// ============================================
// TRADING
// ============================================

// POST /api/blockchain/buy - Buy cryptocurrency
router.post('/buy', authenticateToken, async (req, res) => {
  try {
    const { symbol, amount } = req.body;

    if (!symbol || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid symbol or amount' });
    }

    const result = await blockchainController.buyCrypto(req.user.id, symbol, parseFloat(amount));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ success: false, error: 'Buy order failed' });
  }
});

// POST /api/blockchain/sell - Sell cryptocurrency
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid symbol or quantity' });
    }

    const result = await blockchainController.sellCrypto(req.user.id, symbol, parseFloat(quantity));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ success: false, error: 'Sell order failed' });
  }
});

// POST /api/blockchain/swap - Swap cryptocurrencies
router.post('/swap', authenticateToken, async (req, res) => {
  try {
    const { fromAsset, toAsset, amount } = req.body;

    if (!fromAsset || !toAsset || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid swap parameters' });
    }

    const result = await blockchainController.swapCrypto(
      req.user.id,
      fromAsset,
      toAsset,
      parseFloat(amount)
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Swap error:', error);
    res.status(500).json({ success: false, error: 'Swap failed' });
  }
});

// ============================================
// DEPOSIT & WITHDRAWAL
// ============================================

// GET /api/blockchain/company-addresses - Get company deposit addresses for crypto deposits
router.get('/company-addresses', async (req, res) => {
  try {
    // Company deposit addresses from environment
    const addresses = {
      XLM: {
        address: process.env.STELLAR_DEPOSIT_ADDRESS || '2BVA55PJAACDDAFBRPNC4EEVP5ZKD67MAU',
        network: 'Stellar',
        name: 'Stellar Lumens',
        memo: null, // Add memo if required
        minDeposit: 1,
        confirmations: 1
      },
      // Add more company addresses as needed
      BTC: {
        address: process.env.BTC_DEPOSIT_ADDRESS || null,
        network: 'Bitcoin',
        name: 'Bitcoin',
        minDeposit: 0.0001,
        confirmations: 3
      },
      ETH: {
        address: process.env.ETH_DEPOSIT_ADDRESS || null,
        network: 'Ethereum',
        name: 'Ethereum',
        minDeposit: 0.001,
        confirmations: 12
      },
      USDT: {
        address: process.env.USDT_DEPOSIT_ADDRESS || null,
        network: 'TRC20',
        name: 'Tether USD',
        minDeposit: 1,
        confirmations: 20
      }
    };

    // Filter out addresses that are not configured
    const configuredAddresses = {};
    for (const [symbol, data] of Object.entries(addresses)) {
      if (data.address) {
        configuredAddresses[symbol] = data;
      }
    }

    res.json({
      success: true,
      data: configuredAddresses
    });
  } catch (error) {
    console.error('Company addresses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get deposit addresses' });
  }
});

// GET /api/blockchain/deposit-address - Get deposit address
router.get('/deposit-address', authenticateToken, async (req, res) => {
  try {
    const { coin, network } = req.query;

    if (!coin || !network) {
      return res.status(400).json({ success: false, error: 'Coin and network required' });
    }

    const result = await blockchainController.getDepositAddress(req.user.id, coin, network);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Deposit address error:', error);
    res.status(500).json({ success: false, error: 'Failed to get deposit address' });
  }
});

// POST /api/blockchain/withdraw - Withdraw to external wallet
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { coin, address, amount, network } = req.body;

    if (!coin || !address || !amount || !network || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid withdrawal parameters' });
    }

    const result = await blockchainController.withdrawToExternal(
      req.user.id,
      coin,
      address,
      parseFloat(amount),
      network
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, error: 'Withdrawal failed' });
  }
});

module.exports = { router, initController };
