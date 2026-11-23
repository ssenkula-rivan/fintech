const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

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

/**
 * GET /api/dashboard
 * Get complete dashboard data for authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;

        // Get user profile
        const [users] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name,
                    kyc_tier, kyc_status, status, last_login, created_at
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        // Get wallets
        const [wallets] = await connection.execute(
            `SELECT id, currency, balance, locked_balance,
                    daily_limit, monthly_limit, daily_spent, monthly_spent, status
             FROM wallets WHERE user_id = ?`,
            [userId]
        );

        // Get recent transactions
        const [transactions] = await connection.execute(
            `SELECT id, reference, transaction_type, amount, currency, fee,
                    counterparty_phone, counterparty_name, status, description, created_at
             FROM transactions WHERE user_id = ?
             ORDER BY created_at DESC LIMIT 10`,
            [userId]
        );

        // KYC tier limits
        const kycLimits = {
            0: { daily: 100000, monthly: 1000000 },
            1: { daily: 500000, monthly: 5000000 },
            2: { daily: 2000000, monthly: 20000000 },
            3: { daily: 10000000, monthly: 100000000 }
        };

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    kycLimits: kycLimits[user.kyc_tier] || kycLimits[0],
                    status: user.status,
                    lastLogin: user.last_login,
                    memberSince: user.created_at
                },
                wallets: wallets.map(w => ({
                    id: w.id,
                    currency: w.currency,
                    balance: parseFloat(w.balance || 0),
                    lockedBalance: parseFloat(w.locked_balance || 0),
                    availableBalance: parseFloat(w.balance || 0) - parseFloat(w.locked_balance || 0),
                    dailyLimit: parseFloat(w.daily_limit || 0),
                    monthlyLimit: parseFloat(w.monthly_limit || 0),
                    dailySpent: parseFloat(w.daily_spent || 0),
                    monthlySpent: parseFloat(w.monthly_spent || 0),
                    status: w.status
                })),
                recentTransactions: transactions.map(t => ({
                    id: t.id,
                    reference: t.reference,
                    type: t.transaction_type,
                    amount: parseFloat(t.amount),
                    currency: t.currency,
                    fee: parseFloat(t.fee || 0),
                    recipientPhone: t.counterparty_phone,
                    recipientName: t.counterparty_name,
                    status: t.status,
                    description: t.description,
                    createdAt: t.created_at
                })),
                notifications: { unreadCount: 0, items: [] },
                cards: [],
                activeLoans: [],
                insurancePolicies: [],
                statistics: {
                    totalTransactions: transactions.length,
                    totalDeposits: 0,
                    totalWithdrawals: 0,
                    totalSent: 0,
                    totalReceived: 0
                }
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load dashboard',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/dashboard/summary
 * Get quick summary (lighter endpoint)
 */
router.get('/summary', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;

        // Get primary wallet balance
        const [wallets] = await connection.execute(
            `SELECT currency, balance, locked_balance FROM wallets WHERE user_id = ? AND currency = 'UGX'`,
            [userId]
        );

        // Get unread notification count
        const [notifCount] = await connection.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = 'unread'`,
            [userId]
        );

        // Get pending transactions count
        const [pendingCount] = await connection.execute(
            `SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = 'PENDING'`,
            [userId]
        );

        const wallet = wallets[0] || { balance: 0, locked_balance: 0 };

        res.json({
            success: true,
            data: {
                balance: parseFloat(wallet.balance),
                availableBalance: parseFloat(wallet.balance) - parseFloat(wallet.locked_balance || 0),
                currency: 'UGX',
                unreadNotifications: notifCount[0].count,
                pendingTransactions: pendingCount[0].count
            }
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load summary'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
