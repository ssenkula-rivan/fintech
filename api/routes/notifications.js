/**
 * Notifications Routes
 * User notification management
 */

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
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, unread_only } = req.query;

        let query = `
            SELECT id, title, message, type, is_read, data, created_at
            FROM notifications
            WHERE user_id = ?`;
        
        const params = [userId];

        if (unread_only === 'true') {
            query += ` AND is_read = FALSE`;
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [notifications] = await pool.execute(query, params);

        // Get unread count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                notifications: notifications.map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    is_read: n.is_read === 1,
                    data: n.data ? JSON.parse(n.data) : null,
                    created_at: n.created_at
                })),
                unreadCount: countResult[0].count,
                total: notifications.length
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
        });
    }
});

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        await pool.execute(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?`,
            [notificationId, userId]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.execute(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notifications as read'
        });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        await pool.execute(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [notificationId, userId]
        );

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await pool.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                count: result[0].count
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread count'
        });
    }
});

/**
 * POST /api/notifications/register-device
 * Register device for push notifications
 */
router.post('/register-device', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pushToken, platform, deviceName } = req.body;

        if (!pushToken || !platform) {
            return res.status(400).json({
                success: false,
                error: 'pushToken and platform are required'
            });
        }

        // Upsert device token
        await pool.execute(
            `INSERT INTO user_devices (user_id, push_token, platform, device_name, last_active)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
                push_token = VALUES(push_token),
                device_name = VALUES(device_name),
                last_active = NOW(),
                is_active = TRUE`,
            [userId, pushToken, platform, deviceName || null]
        );

        res.json({
            success: true,
            message: 'Device registered for push notifications'
        });

    } catch (error) {
        console.error('Register device error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register device'
        });
    }
});

/**
 * DELETE /api/notifications/unregister-device
 * Unregister device from push notifications
 */
router.delete('/unregister-device', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({
                success: false,
                error: 'pushToken is required'
            });
        }

        await pool.execute(
            `UPDATE user_devices SET is_active = FALSE WHERE user_id = ? AND push_token = ?`,
            [userId, pushToken]
        );

        res.json({
            success: true,
            message: 'Device unregistered from push notifications'
        });

    } catch (error) {
        console.error('Unregister device error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unregister device'
        });
    }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { enabled, transactions, security, promotions, kyc } = req.body;

        await pool.execute(
            `INSERT INTO notification_preferences (user_id, enabled, transactions, security, promotions, kyc)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                transactions = VALUES(transactions),
                security = VALUES(security),
                promotions = VALUES(promotions),
                kyc = VALUES(kyc),
                updated_at = NOW()`,
            [userId, enabled ?? true, transactions ?? true, security ?? true, promotions ?? true, kyc ?? true]
        );

        res.json({
            success: true,
            message: 'Notification preferences updated'
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `SELECT enabled, transactions, security, promotions, kyc 
             FROM notification_preferences WHERE user_id = ?`,
            [userId]
        );

        const preferences = rows[0] || {
            enabled: true,
            transactions: true,
            security: true,
            promotions: true,
            kyc: true
        };

        res.json({
            success: true,
            data: preferences
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get preferences'
        });
    }
});

module.exports = router;
