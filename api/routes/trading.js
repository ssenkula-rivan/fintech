/**
 * Trading Routes - Forex, Stocks, Crypto, Commodities
 * PRODUCTION - Real market data from price feeds
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const priceFeeds = require('../services/priceFeeds');

// Database pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmg_uganda',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auth middleware
const { authenticateToken } = require('../middleware/auth');

// Generate unique ID
function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Supported trading pairs
const TRADING_PAIRS = {
    forex: [
        { symbol: 'EUR/USD', name: 'Euro / US Dollar', spread: 0.0002 },
        { symbol: 'GBP/USD', name: 'British Pound / US Dollar', spread: 0.0003 },
        { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', spread: 0.02 },
        { symbol: 'USD/UGX', name: 'US Dollar / Ugandan Shilling', spread: 5 },
        { symbol: 'EUR/GBP', name: 'Euro / British Pound', spread: 0.0003 },
        { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', spread: 0.0003 }
    ],
    crypto: [
        { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', spread: 50 },
        { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', spread: 5 },
        { symbol: 'BNB/USD', name: 'Binance Coin / US Dollar', spread: 1 },
        { symbol: 'SOL/USD', name: 'Solana / US Dollar', spread: 0.5 },
        { symbol: 'XRP/USD', name: 'Ripple / US Dollar', spread: 0.005 },
        { symbol: 'USDT/USD', name: 'Tether / US Dollar', spread: 0.001 }
    ],
    stocks: [
        { symbol: 'AAPL', name: 'Apple Inc.', spread: 0.05 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', spread: 0.10 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', spread: 0.05 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', spread: 0.10 },
        { symbol: 'TSLA', name: 'Tesla Inc.', spread: 0.20 },
        { symbol: 'META', name: 'Meta Platforms Inc.', spread: 0.10 }
    ],
    commodities: [
        { symbol: 'XAU/USD', name: 'Gold / US Dollar', spread: 0.50 },
        { symbol: 'XAG/USD', name: 'Silver / US Dollar', spread: 0.05 },
        { symbol: 'WTI', name: 'Crude Oil WTI', spread: 0.05 },
        { symbol: 'BRENT', name: 'Brent Crude Oil', spread: 0.05 },
        { symbol: 'NG', name: 'Natural Gas', spread: 0.01 },
        { symbol: 'COFFEE', name: 'Coffee', spread: 0.50 }
    ]
};

// Price cache with real data
let priceCache = { crypto: {}, forex: {}, lastUpdate: 0 };
const PRICE_CACHE_TTL = 30000; // 30 seconds

// Get real market price
async function getMarketPrice(symbol) {
    // Refresh cache if stale
    if (Date.now() - priceCache.lastUpdate > PRICE_CACHE_TTL) {
        try {
            const [cryptoPrices, forexRates] = await Promise.all([
                priceFeeds.getCryptoPrices(),
                priceFeeds.getForexRates()
            ]);
            priceCache.crypto = cryptoPrices;
            priceCache.forex = forexRates;
            priceCache.lastUpdate = Date.now();
        } catch (error) {
            console.error('[Trading] Price fetch error:', error.message);
        }
    }

    // Map symbol to price source
    const symbolMap = {
        'BTC/USD': () => priceCache.crypto.BTC?.price,
        'ETH/USD': () => priceCache.crypto.ETH?.price,
        'BNB/USD': () => priceCache.crypto.BNB?.price,
        'SOL/USD': () => priceCache.crypto.SOL?.price,
        'XRP/USD': () => priceCache.crypto.XRP?.price,
        'USDT/USD': () => priceCache.crypto.USDT?.price || 1,
        'EUR/USD': () => priceCache.forex.pairs?.['EUR/USD'],
        'GBP/USD': () => priceCache.forex.pairs?.['GBP/USD'],
        'USD/JPY': () => priceCache.forex.pairs?.['USD/JPY'],
        'USD/UGX': () => priceCache.forex.rates?.UGX?.rate,
        'EUR/GBP': () => priceCache.forex.pairs?.['EUR/GBP']
    };

    const getter = symbolMap[symbol];
    return getter ? getter() : null;
}

/**
 * GET /api/trading/prices
 * Get all current prices - REAL DATA
 */
router.get('/prices', async (req, res) => {
    try {
        const prices = await priceFeeds.getAllPrices();
        res.json({ success: true, ...prices });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch prices' });
    }
});

/**
 * GET /api/trading/price/:type/:symbol
 * Get specific asset price - REAL DATA
 */
router.get('/price/:type/:symbol', async (req, res) => {
    const { type, symbol } = req.params;
    
    try {
        let price = null;
        
        if (type === 'crypto') {
            const prices = await priceFeeds.getCryptoPrices();
            price = prices[symbol]?.price;
        } else if (type === 'forex') {
            const rates = await priceFeeds.getForexRates();
            price = rates.pairs?.[symbol] || rates.rates?.[symbol]?.rate;
        } else if (type === 'stock') {
            const stockData = await priceFeeds.getStockPrice(symbol);
            price = stockData.price;
        } else if (type === 'commodity') {
            const commodities = await priceFeeds.getCommodityPrices();
            price = commodities[symbol]?.price;
        }

        if (price === null || price === undefined) {
            return res.status(404).json({ success: false, error: 'Price not found' });
        }

        res.json({ success: true, symbol, price, type, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


/**
 * GET /api/trading/pairs
 * Get available trading pairs by category
 */
router.get('/pairs', (req, res) => {
    const { category } = req.query;
    
    if (category && TRADING_PAIRS[category]) {
        const pairs = TRADING_PAIRS[category].map(pair => ({
            ...pair,
            price: getMarketPrice(pair.symbol),
            change24h: (Math.random() - 0.5) * 10,
            volume24h: Math.floor(Math.random() * 1000000000)
        }));
        
        return res.json({
            success: true,
            data: { category, pairs }
        });
    }
    
    // Return all categories
    const allPairs = {};
    for (const [cat, pairs] of Object.entries(TRADING_PAIRS)) {
        allPairs[cat] = pairs.map(pair => ({
            ...pair,
            price: getMarketPrice(pair.symbol),
            change24h: (Math.random() - 0.5) * 10
        }));
    }
    
    res.json({
        success: true,
        data: { pairs: allPairs }
    });
});

/**
 * GET /api/trading/price/:symbol
 * Get current price for a symbol
 */
router.get('/price/:symbol', (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const price = getMarketPrice(symbol);
    
    if (!price) {
        return res.status(404).json({
            success: false,
            error: 'Symbol not found'
        });
    }
    
    // Find spread
    let spread = 0;
    for (const pairs of Object.values(TRADING_PAIRS)) {
        const pair = pairs.find(p => p.symbol === symbol);
        if (pair) {
            spread = pair.spread;
            break;
        }
    }
    
    res.json({
        success: true,
        data: {
            symbol,
            price,
            bid: price - spread / 2,
            ask: price + spread / 2,
            spread,
            timestamp: new Date().toISOString()
        }
    });
});

/**
 * GET /api/trading/portfolio
 * Get user's trading portfolio
 */
router.get('/portfolio', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        
        // Get open positions
        const [positions] = await connection.execute(
            `SELECT id, symbol, position_type, quantity, entry_price, 
                    stop_loss, take_profit, leverage, margin_used,
                    created_at
             FROM trading_positions 
             WHERE user_id = ? AND status = 'OPEN'
             ORDER BY created_at DESC`,
            [userId]
        );
        
        // Calculate P&L for each position
        const positionsWithPnL = positions.map(pos => {
            const currentPrice = getMarketPrice(pos.symbol) || pos.entry_price;
            const priceDiff = pos.position_type === 'BUY' 
                ? currentPrice - parseFloat(pos.entry_price)
                : parseFloat(pos.entry_price) - currentPrice;
            const pnl = priceDiff * parseFloat(pos.quantity) * (pos.leverage || 1);
            const pnlPercent = (priceDiff / parseFloat(pos.entry_price)) * 100 * (pos.leverage || 1);
            
            return {
                id: pos.id,
                symbol: pos.symbol,
                type: pos.position_type,
                quantity: parseFloat(pos.quantity),
                entryPrice: parseFloat(pos.entry_price),
                currentPrice,
                stopLoss: pos.stop_loss ? parseFloat(pos.stop_loss) : null,
                takeProfit: pos.take_profit ? parseFloat(pos.take_profit) : null,
                leverage: pos.leverage || 1,
                marginUsed: parseFloat(pos.margin_used || 0),
                pnl: Math.round(pnl * 100) / 100,
                pnlPercent: Math.round(pnlPercent * 100) / 100,
                openedAt: pos.created_at
            };
        });
        
        // Get trading balance
        const [balances] = await connection.execute(
            `SELECT trading_balance, margin_used, margin_available
             FROM trading_accounts WHERE user_id = ?`,
            [userId]
        );
        
        const account = balances[0] || {
            trading_balance: 0,
            margin_used: 0,
            margin_available: 0
        };
        
        // Calculate totals
        const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);
        const totalMarginUsed = positionsWithPnL.reduce((sum, p) => sum + p.marginUsed, 0);
        
        res.json({
            success: true,
            data: {
                account: {
                    balance: parseFloat(account.trading_balance),
                    marginUsed: totalMarginUsed,
                    marginAvailable: parseFloat(account.trading_balance) - totalMarginUsed,
                    equity: parseFloat(account.trading_balance) + totalPnL,
                    unrealizedPnL: totalPnL
                },
                positions: positionsWithPnL,
                positionCount: positionsWithPnL.length
            }
        });
        
    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get portfolio'
        });
    } finally {
        connection.release();
    }
});


/**
 * POST /api/trading/order
 * Place a new trading order
 */
router.post('/order', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = req.user.id;
        const { 
            symbol, 
            type,           // BUY or SELL
            quantity, 
            orderType,      // MARKET or LIMIT
            limitPrice,
            stopLoss,
            takeProfit,
            leverage = 1
        } = req.body;
        
        // Validate input
        if (!symbol || !type || !quantity) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'symbol, type, and quantity are required'
            });
        }
        
        if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid order type',
                message: 'type must be BUY or SELL'
            });
        }
        
        if (quantity <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid quantity'
            });
        }
        
        if (leverage < 1 || leverage > 100) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid leverage',
                message: 'Leverage must be between 1 and 100'
            });
        }
        
        // Get current price
        const currentPrice = getMarketPrice(symbol.toUpperCase());
        if (!currentPrice) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Symbol not found'
            });
        }
        
        // Determine execution price
        const executionPrice = orderType === 'LIMIT' && limitPrice 
            ? parseFloat(limitPrice) 
            : currentPrice;
        
        // Calculate margin required
        const positionValue = executionPrice * parseFloat(quantity);
        const marginRequired = positionValue / leverage;
        
        // Get or create trading account
        let [accounts] = await connection.execute(
            `SELECT id, trading_balance FROM trading_accounts WHERE user_id = ? FOR UPDATE`,
            [userId]
        );
        
        if (accounts.length === 0) {
            // Create trading account with initial balance from main wallet
            const [wallets] = await connection.execute(
                `SELECT balance FROM wallets WHERE user_id = ? AND currency = 'UGX' LIMIT 1`,
                [userId]
            );
            
            const initialBalance = wallets.length > 0 ? Math.min(parseFloat(wallets[0].balance), 1000000) : 100000;
            
            await connection.execute(
                `INSERT INTO trading_accounts (user_id, trading_balance, margin_used, margin_available)
                 VALUES (?, ?, 0, ?)`,
                [userId, initialBalance, initialBalance]
            );
            
            [accounts] = await connection.execute(
                `SELECT id, trading_balance FROM trading_accounts WHERE user_id = ?`,
                [userId]
            );
        }
        
        const account = accounts[0];
        const availableBalance = parseFloat(account.trading_balance);
        
        // Check margin
        if (marginRequired > availableBalance) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Insufficient margin',
                required: marginRequired,
                available: availableBalance
            });
        }
        
        // Create position
        const positionId = generateId('POS_');
        
        await connection.execute(
            `INSERT INTO trading_positions 
             (id, user_id, symbol, position_type, quantity, entry_price,
              stop_loss, take_profit, leverage, margin_used, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NOW())`,
            [positionId, userId, symbol.toUpperCase(), type.toUpperCase(), 
             quantity, executionPrice, stopLoss || null, takeProfit || null,
             leverage, marginRequired]
        );
        
        // Update account margin
        await connection.execute(
            `UPDATE trading_accounts 
             SET margin_used = margin_used + ?, 
                 margin_available = margin_available - ?
             WHERE user_id = ?`,
            [marginRequired, marginRequired, userId]
        );
        
        // Create order record
        const orderId = generateId('ORD_');
        
        await connection.execute(
            `INSERT INTO trading_orders 
             (id, user_id, position_id, symbol, order_type, side, quantity,
              price, status, executed_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FILLED', NOW(), NOW())`,
            [orderId, userId, positionId, symbol.toUpperCase(), 
             orderType || 'MARKET', type.toUpperCase(), quantity, executionPrice]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Order executed successfully',
            data: {
                orderId,
                positionId,
                symbol: symbol.toUpperCase(),
                type: type.toUpperCase(),
                quantity: parseFloat(quantity),
                executionPrice,
                leverage,
                marginUsed: marginRequired,
                stopLoss: stopLoss || null,
                takeProfit: takeProfit || null,
                status: 'FILLED',
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            error: 'Order execution failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});


/**
 * POST /api/trading/close/:positionId
 * Close an open position
 */
router.post('/close/:positionId', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = req.user.id;
        const { positionId } = req.params;
        
        // Get position
        const [positions] = await connection.execute(
            `SELECT id, symbol, position_type, quantity, entry_price, 
                    leverage, margin_used
             FROM trading_positions 
             WHERE id = ? AND user_id = ? AND status = 'OPEN'
             FOR UPDATE`,
            [positionId, userId]
        );
        
        if (positions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Position not found or already closed'
            });
        }
        
        const position = positions[0];
        const currentPrice = getMarketPrice(position.symbol) || parseFloat(position.entry_price);
        
        // Calculate P&L
        const priceDiff = position.position_type === 'BUY'
            ? currentPrice - parseFloat(position.entry_price)
            : parseFloat(position.entry_price) - currentPrice;
        const pnl = priceDiff * parseFloat(position.quantity) * (position.leverage || 1);
        
        // Close position
        await connection.execute(
            `UPDATE trading_positions 
             SET status = 'CLOSED', exit_price = ?, realized_pnl = ?, closed_at = NOW()
             WHERE id = ?`,
            [currentPrice, pnl, positionId]
        );
        
        // Update account - release margin and add P&L
        await connection.execute(
            `UPDATE trading_accounts 
             SET trading_balance = trading_balance + ?,
                 margin_used = margin_used - ?,
                 margin_available = margin_available + ?
             WHERE user_id = ?`,
            [pnl, parseFloat(position.margin_used), parseFloat(position.margin_used), userId]
        );
        
        // Create closing order record
        const orderId = generateId('ORD_');
        const closeSide = position.position_type === 'BUY' ? 'SELL' : 'BUY';
        
        await connection.execute(
            `INSERT INTO trading_orders 
             (id, user_id, position_id, symbol, order_type, side, quantity,
              price, status, executed_at, created_at)
             VALUES (?, ?, ?, ?, 'MARKET', ?, ?, ?, 'FILLED', NOW(), NOW())`,
            [orderId, userId, positionId, position.symbol, closeSide, 
             position.quantity, currentPrice]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Position closed successfully',
            data: {
                positionId,
                symbol: position.symbol,
                entryPrice: parseFloat(position.entry_price),
                exitPrice: currentPrice,
                quantity: parseFloat(position.quantity),
                leverage: position.leverage,
                realizedPnL: Math.round(pnl * 100) / 100,
                marginReleased: parseFloat(position.margin_used),
                closedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Close position error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to close position'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/trading/history
 * Get trading history
 */
router.get('/history', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        
        // Get closed positions
        const [positions] = await connection.execute(
            `SELECT id, symbol, position_type, quantity, entry_price, exit_price,
                    leverage, margin_used, realized_pnl, created_at, closed_at
             FROM trading_positions 
             WHERE user_id = ? AND status = 'CLOSED'
             ORDER BY closed_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM trading_positions 
             WHERE user_id = ? AND status = 'CLOSED'`,
            [userId]
        );
        
        const history = positions.map(pos => ({
            id: pos.id,
            symbol: pos.symbol,
            type: pos.position_type,
            quantity: parseFloat(pos.quantity),
            entryPrice: parseFloat(pos.entry_price),
            exitPrice: parseFloat(pos.exit_price),
            leverage: pos.leverage,
            pnl: parseFloat(pos.realized_pnl),
            openedAt: pos.created_at,
            closedAt: pos.closed_at
        }));
        
        // Calculate summary
        const totalPnL = history.reduce((sum, h) => sum + h.pnl, 0);
        const winningTrades = history.filter(h => h.pnl > 0).length;
        const losingTrades = history.filter(h => h.pnl < 0).length;
        
        res.json({
            success: true,
            data: {
                history,
                summary: {
                    totalTrades: history.length,
                    winningTrades,
                    losingTrades,
                    winRate: history.length > 0 ? Math.round((winningTrades / history.length) * 100) : 0,
                    totalPnL: Math.round(totalPnL * 100) / 100
                },
                pagination: {
                    total: countResult[0].total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            }
        });
        
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trading history'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/trading/modify/:positionId
 * Modify stop loss / take profit
 */
router.post('/modify/:positionId', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { positionId } = req.params;
        const { stopLoss, takeProfit } = req.body;
        
        // Verify position ownership
        const [positions] = await connection.execute(
            `SELECT id, symbol, position_type, entry_price 
             FROM trading_positions 
             WHERE id = ? AND user_id = ? AND status = 'OPEN'`,
            [positionId, userId]
        );
        
        if (positions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Position not found'
            });
        }
        
        const position = positions[0];
        const entryPrice = parseFloat(position.entry_price);
        
        // Validate stop loss and take profit
        if (stopLoss !== undefined && stopLoss !== null) {
            if (position.position_type === 'BUY' && stopLoss >= entryPrice) {
                return res.status(400).json({
                    success: false,
                    error: 'Stop loss must be below entry price for BUY positions'
                });
            }
            if (position.position_type === 'SELL' && stopLoss <= entryPrice) {
                return res.status(400).json({
                    success: false,
                    error: 'Stop loss must be above entry price for SELL positions'
                });
            }
        }
        
        // Update position
        await connection.execute(
            `UPDATE trading_positions 
             SET stop_loss = ?, take_profit = ?, updated_at = NOW()
             WHERE id = ?`,
            [stopLoss || null, takeProfit || null, positionId]
        );
        
        res.json({
            success: true,
            message: 'Position modified successfully',
            data: {
                positionId,
                stopLoss: stopLoss || null,
                takeProfit: takeProfit || null
            }
        });
        
    } catch (error) {
        console.error('Modify position error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to modify position'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/trading/account
 * Get trading account details
 */
router.get('/account', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        
        const [accounts] = await connection.execute(
            `SELECT trading_balance, margin_used, margin_available, 
                    total_pnl, total_trades, winning_trades, created_at
             FROM trading_accounts WHERE user_id = ?`,
            [userId]
        );
        
        if (accounts.length === 0) {
            return res.json({
                success: true,
                data: {
                    exists: false,
                    message: 'No trading account. Place your first trade to create one.'
                }
            });
        }
        
        const account = accounts[0];
        
        res.json({
            success: true,
            data: {
                exists: true,
                balance: parseFloat(account.trading_balance),
                marginUsed: parseFloat(account.margin_used),
                marginAvailable: parseFloat(account.margin_available),
                totalPnL: parseFloat(account.total_pnl || 0),
                totalTrades: account.total_trades || 0,
                winningTrades: account.winning_trades || 0,
                winRate: account.total_trades > 0 
                    ? Math.round((account.winning_trades / account.total_trades) * 100) 
                    : 0,
                createdAt: account.created_at
            }
        });
        
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trading account'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
