const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

/**
 * GET /api/wallet/balance
 * Get wallet balance(s)
 */
router.get('/balance', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { currency } = req.query;

        let query = `
            SELECT id, currency, balance, locked_balance,
                   daily_limit, monthly_limit, daily_spent, monthly_spent,
                   status, updated_at
            FROM wallets 
            WHERE user_id = ?`;
        const params = [userId];

        if (currency) {
            query += ` AND currency = ?`;
            params.push(currency.toUpperCase());
        }

        const [wallets] = await connection.execute(query, params);

        if (wallets.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        const walletsData = wallets.map(w => ({
            id: w.id,
            currency: w.currency,
            balance: parseFloat(w.balance),
            lockedBalance: parseFloat(w.locked_balance),
            availableBalance: parseFloat(w.balance) - parseFloat(w.locked_balance),
            limits: {
                daily: {
                    limit: parseFloat(w.daily_limit),
                    spent: parseFloat(w.daily_spent),
                    available: parseFloat(w.daily_limit) - parseFloat(w.daily_spent)
                },
                monthly: {
                    limit: parseFloat(w.monthly_limit),
                    spent: parseFloat(w.monthly_spent),
                    available: parseFloat(w.monthly_limit) - parseFloat(w.monthly_spent)
                }
            },
            status: w.status,
            lastUpdated: w.updated_at
        }));

        res.json({
            success: true,
            data: currency ? walletsData[0] : { wallets: walletsData }
        });

    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get balance'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/wallet/credit
 * Credit wallet (deposit)
 */
router.post('/credit', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { amount, currency = 'UGX', description, reference } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid amount',
                message: 'Amount must be greater than 0'
            });
        }

        // Get wallet with lock
        const [wallets] = await connection.execute(
            `SELECT id, balance, status 
             FROM wallets 
             WHERE user_id = ? AND currency = ?
             FOR UPDATE`,
            [userId, currency]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        const wallet = wallets[0];

        if (wallet.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Wallet inactive'
            });
        }

        const oldBalance = parseFloat(wallet.balance);
        const newBalance = oldBalance + parseFloat(amount);

        // Update wallet balance
        await connection.execute(
            `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
            [newBalance, wallet.id]
        );

        // Create transaction record
        const txnId = generateId('TXN_');
        const txnRef = reference || `DEP${Date.now()}`;

        await connection.execute(
            `INSERT INTO transactions 
             (id, reference, user_id, transaction_type, amount, currency,
              credit_wallet_id, status, description, balance_before, balance_after,
              completed_at, created_at)
             VALUES (?, ?, ?, 'DEPOSIT', ?, ?, ?, 'COMPLETED', ?, ?, ?, NOW(), NOW())`,
            [txnId, txnRef, userId, amount, currency, wallet.id, 
             description || 'Wallet credit', oldBalance, newBalance]
        );

        // Create ledger entry
        await connection.execute(
            `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
             VALUES (?, ?, 'CREDIT', ?, ?, ?)`,
            [txnId, wallet.id, amount, oldBalance, newBalance]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Wallet credited successfully',
            data: {
                transactionId: txnId,
                reference: txnRef,
                amount: parseFloat(amount),
                currency,
                oldBalance,
                newBalance,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Credit wallet error:', error);
        res.status(500).json({
            success: false,
            error: 'Credit failed'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/wallet/debit
 * Debit wallet (requires PIN)
 */
router.post('/debit', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { amount, currency = 'UGX', description, pin } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        if (!pin) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'PIN required'
            });
        }

        // Get user with PIN
        const [users] = await connection.execute(
            `SELECT id, pin_hash, status, login_attempts FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        // Check account lock
        if (user.login_attempts >= 3) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Account locked',
                message: 'Too many failed attempts. Contact support.'
            });
        }

        // Verify PIN
        const pinValid = await bcrypt.compare(pin, user.pin_hash);

        if (!pinValid) {
            await connection.execute(
                `UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?`,
                [userId]
            );
            await connection.commit();
            return res.status(401).json({
                success: false,
                error: 'Invalid PIN',
                attemptsRemaining: 2 - user.login_attempts
            });
        }

        // Reset failed attempts
        await connection.execute(
            `UPDATE users SET login_attempts = 0 WHERE id = ?`,
            [userId]
        );

        // Get wallet with lock
        const [wallets] = await connection.execute(
            `SELECT id, balance, locked_balance, daily_limit, monthly_limit, 
                    daily_spent, monthly_spent, status
             FROM wallets 
             WHERE user_id = ? AND currency = ?
             FOR UPDATE`,
            [userId, currency]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        const wallet = wallets[0];

        if (wallet.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Wallet inactive'
            });
        }

        const availableBalance = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);

        // Check balance
        if (availableBalance < parseFloat(amount)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance',
                available: availableBalance,
                required: parseFloat(amount)
            });
        }

        // Check daily limit
        const dailyAvailable = parseFloat(wallet.daily_limit) - parseFloat(wallet.daily_spent);
        if (parseFloat(amount) > dailyAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Daily limit exceeded',
                available: dailyAvailable
            });
        }

        // Check monthly limit
        const monthlyAvailable = parseFloat(wallet.monthly_limit) - parseFloat(wallet.monthly_spent);
        if (parseFloat(amount) > monthlyAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Monthly limit exceeded',
                available: monthlyAvailable
            });
        }

        const oldBalance = parseFloat(wallet.balance);
        const newBalance = oldBalance - parseFloat(amount);
        const newDailySpent = parseFloat(wallet.daily_spent) + parseFloat(amount);
        const newMonthlySpent = parseFloat(wallet.monthly_spent) + parseFloat(amount);

        // Update wallet
        await connection.execute(
            `UPDATE wallets 
             SET balance = ?, daily_spent = ?, monthly_spent = ?, updated_at = NOW()
             WHERE id = ?`,
            [newBalance, newDailySpent, newMonthlySpent, wallet.id]
        );

        // Create transaction
        const txnId = generateId('TXN_');
        const txnRef = `WDR${Date.now()}`;

        await connection.execute(
            `INSERT INTO transactions 
             (id, reference, user_id, transaction_type, amount, currency,
              debit_wallet_id, status, description, balance_before, balance_after,
              completed_at, created_at)
             VALUES (?, ?, ?, 'WITHDRAWAL', ?, ?, ?, 'COMPLETED', ?, ?, ?, NOW(), NOW())`,
            [txnId, txnRef, userId, amount, currency, wallet.id,
             description || 'Wallet debit', oldBalance, newBalance]
        );

        // Create ledger entry
        await connection.execute(
            `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
             VALUES (?, ?, 'DEBIT', ?, ?, ?)`,
            [txnId, wallet.id, amount, oldBalance, newBalance]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Wallet debited successfully',
            data: {
                transactionId: txnId,
                reference: txnRef,
                amount: parseFloat(amount),
                currency,
                oldBalance,
                newBalance,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Debit wallet error:', error);
        res.status(500).json({
            success: false,
            error: 'Debit failed'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
