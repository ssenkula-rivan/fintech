const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { adminIpWhitelist, adminAccessLogger } = require('../middleware/ipWhitelist');
const { createBackup, listBackups, restoreBackup } = require('../services/backup');

// Apply IP whitelist and logging to all admin routes
router.use(adminIpWhitelist);
router.use(adminAccessLogger);

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

/**
 * GET /api/admin/users
 * Get all users with their wallet balances
 * REQUIRES: Admin or Superadmin role
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { status, search, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT u.id, u.phone, u.email, u.first_name, u.last_name,
                   u.kyc_tier, u.kyc_status, u.status, u.last_login, u.created_at,
                   COALESCE(w.balance, 0) as balance
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id AND w.currency = 'UGX'
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND u.status = ?';
            params.push(status.toUpperCase());
        }

        if (search) {
            query += ' AND (u.phone LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await connection.execute(query, params);

        // Get total count
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');

        res.json({
            success: true,
            data: users,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/admin/users/:id
 * Get single user details
 * REQUIRES: Admin or Superadmin role
 */
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        const [users] = await connection.execute(`
            SELECT u.*, COALESCE(w.balance, 0) as balance
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id AND w.currency = 'UGX'
            WHERE u.id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get user's transactions
        const [transactions] = await connection.execute(`
            SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
        `, [id]);

        res.json({
            success: true,
            data: {
                user: users[0],
                transactions
            }
        });

    } catch (error) {
        console.error('Admin user detail error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    } finally {
        connection.release();
    }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (suspend/activate)
 * REQUIRES: Admin or Superadmin role
 */
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'SUSPENDED', 'LOCKED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        await connection.execute(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );

        // Log the action
        await connection.execute(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'USER_STATUS_CHANGE', 'user', ?, ?)
        `, [req.user.id, id, JSON.stringify({ newStatus: status })]);

        res.json({
            success: true,
            message: `User status updated to ${status}`
        });

    } catch (error) {
        console.error('Admin status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user status'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/admin/transactions
 * Get all transactions
 * REQUIRES: Admin or Superadmin role
 */
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { status, type, search, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT t.*, u.phone as user_phone, u.first_name, u.last_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND t.status = ?';
            params.push(status.toUpperCase());
        }

        if (type) {
            query += ' AND t.type = ?';
            params.push(type.toUpperCase());
        }

        if (search) {
            query += ' AND (t.reference LIKE ? OR t.description LIKE ? OR u.phone LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [transactions] = await connection.execute(query, params);

        // Get stats
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as total_volume,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
            FROM transactions
        `);

        res.json({
            success: true,
            data: transactions,
            stats: stats[0],
            pagination: {
                total: stats[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Admin transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 * REQUIRES: Admin or Superadmin role
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // User stats
        const [userStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_users,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM users
        `);

        // Transaction stats
        const [txnStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as total_volume,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count
            FROM transactions
        `);

        // Wallet stats
        const [walletStats] = await connection.execute(`
            SELECT SUM(balance) as total_balance FROM wallets WHERE status = 'ACTIVE'
        `);

        res.json({
            success: true,
            data: {
                users: userStats[0],
                transactions: txnStats[0],
                wallets: walletStats[0]
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/admin/backups
 * List available database backups
 * REQUIRES: Superadmin role
 */
router.get('/backups', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const backups = listBackups();
        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('List backups error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list backups'
        });
    }
});

/**
 * POST /api/admin/backups
 * Create new database backup
 * REQUIRES: Superadmin role
 */
router.post('/backups', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { compress = true, encrypt = false } = req.body;
        const result = await createBackup({ compress, encrypt });
        
        // Log the action
        await pool.execute(`
            INSERT INTO audit_logs (user_id, action, entity_type, details)
            VALUES (?, 'BACKUP_CREATED', 'system', ?)
        `, [req.user.id, JSON.stringify(result)]);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create backup',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/backups/:filename/restore
 * Restore database from backup
 * REQUIRES: Superadmin role
 */
router.post('/backups/:filename/restore', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Double confirmation required
        const { confirm } = req.body;
        if (confirm !== 'RESTORE_DATABASE') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required',
                message: 'Send { confirm: "RESTORE_DATABASE" } to proceed'
            });
        }

        const result = await restoreBackup(filename);
        
        // Log the action
        await pool.execute(`
            INSERT INTO audit_logs (user_id, action, entity_type, details)
            VALUES (?, 'BACKUP_RESTORED', 'system', ?)
        `, [req.user.id, JSON.stringify({ filename })]);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore backup',
            message: error.message
        });
    }
});

module.exports = router;
