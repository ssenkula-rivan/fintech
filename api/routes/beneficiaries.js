const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
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

// Normalize phone number to +256 format
function normalizePhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '256' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('256')) {
        cleaned = '256' + cleaned;
    }
    return '+' + cleaned;
}

/**
 * POST /api/beneficiaries/add
 * Add a new beneficiary
 */
router.post('/add', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { name, phone, nickname } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Name and phone are required'
            });
        }

        const phoneRegex = /^(\+?256|0)?[7][0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone format'
            });
        }

        const normalizedPhone = normalizePhone(phone);

        const [currentUser] = await connection.execute(
            `SELECT phone FROM users WHERE id = ?`,
            [userId]
        );

        if (currentUser.length > 0 && currentUser[0].phone === normalizedPhone) {
            return res.status(400).json({
                success: false,
                error: 'Cannot add yourself as beneficiary'
            });
        }

        const [existing] = await connection.execute(
            `SELECT id FROM beneficiaries WHERE user_id = ? AND phone = ?`,
            [userId, normalizedPhone]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Beneficiary already exists'
            });
        }

        const [recipient] = await connection.execute(
            `SELECT id, first_name, last_name, status FROM users WHERE phone = ?`,
            [normalizedPhone]
        );

        let recipientId = null;
        let recipientName = name;

        if (recipient.length > 0) {
            recipientId = recipient[0].id;
            recipientName = `${recipient[0].first_name || ''} ${recipient[0].last_name || ''}`.trim() || name;
        }

        await connection.execute(
            `INSERT INTO beneficiaries (user_id, phone, name, nickname, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [userId, normalizedPhone, recipientName, nickname || null]
        );

        // Get the inserted ID
        const [insertResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const beneficiaryId = insertResult[0].id;

        res.json({
            success: true,
            message: 'Beneficiary added',
            data: { id: beneficiaryId, name: recipientName, phone: normalizedPhone, isRegistered: recipientId !== null }
        });

    } catch (error) {
        console.error('Add beneficiary error:', error);
        res.status(500).json({ success: false, error: 'Failed to add beneficiary' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/beneficiaries/list
 */
router.get('/list', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;

        const [beneficiaries] = await connection.execute(
            `SELECT b.id, b.phone, b.name, b.nickname, b.favorite, b.send_count, b.created_at,
                    u.id as user_id, u.first_name, u.last_name, u.status as user_status
             FROM beneficiaries b
             LEFT JOIN users u ON b.phone = u.phone
             WHERE b.user_id = ?
             ORDER BY b.favorite DESC, b.send_count DESC, b.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                count: beneficiaries.length,
                beneficiaries: beneficiaries.map(b => ({
                    id: b.id,
                    name: b.first_name ? `${b.first_name} ${b.last_name || ''}`.trim() : b.name,
                    phone: b.phone,
                    nickname: b.nickname,
                    favorite: b.favorite === 1,
                    sendCount: b.send_count,
                    isRegistered: b.user_id !== null,
                    status: b.user_status || 'NOT_REGISTERED'
                }))
            }
        });

    } catch (error) {
        console.error('List beneficiaries error:', error);
        res.status(500).json({ success: false, error: 'Failed to get beneficiaries' });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /api/beneficiaries/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const beneficiaryId = req.params.id;

        const [beneficiaries] = await connection.execute(
            `SELECT id FROM beneficiaries WHERE id = ? AND user_id = ?`,
            [beneficiaryId, userId]
        );

        if (beneficiaries.length === 0) {
            return res.status(404).json({ success: false, error: 'Beneficiary not found' });
        }

        await connection.execute(
            `DELETE FROM beneficiaries WHERE id = ?`,
            [beneficiaryId]
        );

        res.json({ success: true, message: 'Beneficiary removed' });

    } catch (error) {
        console.error('Delete beneficiary error:', error);
        res.status(500).json({ success: false, error: 'Failed to remove beneficiary' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/beneficiaries/search
 */
router.get('/search', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }

        const normalizedPhone = normalizePhone(phone);

        const [users] = await connection.execute(
            `SELECT id, phone, first_name, last_name, chipptertag, status FROM users WHERE phone = ?`,
            [normalizedPhone]
        );

        if (users.length === 0) {
            return res.json({ success: true, found: false, message: 'User not registered' });
        }

        const user = users[0];

        res.json({
            success: true,
            found: true,
            canReceive: user.status === 'ACTIVE',
            data: {
                id: user.id,
                phone: user.phone,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                chipptertag: user.chipptertag,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    } finally {
        connection.release();
    }
});

module.exports = router;
