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

// Generate unique ID
function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Verify MTN webhook signature
function verifyMTNSignature(payload, signature, secret) {
    if (!signature || !secret) return false;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const calculated = hmac.digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculated));
    } catch {
        return false;
    }
}

// Verify Airtel webhook signature
function verifyAirtelSignature(payload, signature, secret) {
    if (!signature || !secret) return false;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const calculated = hmac.digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculated));
    } catch {
        return false;
    }
}

/**
 * POST /api/webhooks/mtn-callback
 * MTN Mobile Money payment callback
 */
router.post('/mtn-callback', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const signature = req.headers['x-mtn-signature'];
        const payload = req.body;
        const MTN_SECRET = process.env.MTN_WEBHOOK_SECRET;
        
        if (!MTN_SECRET && process.env.NODE_ENV === 'production') {
            console.error('FATAL: MTN_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Verify signature in production
        if (process.env.NODE_ENV === 'production') {
            if (!verifyMTNSignature(payload, signature, MTN_SECRET)) {
                console.error('Invalid MTN webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const { external_reference, transaction_id: mtnTxnId, status, amount, currency, timestamp } = payload;

        if (!external_reference) {
            return res.status(400).json({ error: 'Missing external_reference' });
        }

        await connection.beginTransaction();

        // Find pending transaction
        const [transactions] = await connection.execute(
            `SELECT id, user_id, amount, currency, status, credit_wallet_id
             FROM transactions
             WHERE external_reference = ? AND transaction_type = 'DEPOSIT' AND status = 'PENDING'
             FOR UPDATE`,
            [external_reference]
        );

        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Transaction not found or already processed' });
        }

        const transaction = transactions[0];
        const newStatus = status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED';

        // Update transaction status
        await connection.execute(
            `UPDATE transactions 
             SET status = ?, external_transaction_id = ?, completed_at = NOW(), updated_at = NOW()
             WHERE id = ?`,
            [newStatus, mtnTxnId || external_reference, transaction.id]
        );

        if (status === 'SUCCESSFUL') {
            // Get wallet for balance update
            const [wallets] = await connection.execute(
                `SELECT id, balance FROM wallets WHERE id = ? FOR UPDATE`,
                [transaction.credit_wallet_id]
            );

            if (wallets.length > 0) {
                const wallet = wallets[0];
                const oldBalance = parseFloat(wallet.balance);
                const newBalance = oldBalance + parseFloat(transaction.amount);

                // Credit wallet
                await connection.execute(
                    `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
                    [newBalance, wallet.id]
                );

                // Update transaction balance info
                await connection.execute(
                    `UPDATE transactions SET balance_before = ?, balance_after = ? WHERE id = ?`,
                    [oldBalance, newBalance, transaction.id]
                );

                // Create ledger entry
                await connection.execute(
                    `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
                     VALUES (?, ?, 'CREDIT', ?, ?, ?)`,
                    [transaction.id, wallet.id, transaction.amount, oldBalance, newBalance]
                );
            }

            // Create success notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, 'Deposit Successful', ?, 'TRANSACTION', NOW())`,
                [transaction.user_id,
                 `Your deposit of ${transaction.currency} ${parseFloat(transaction.amount).toLocaleString()} has been credited.`]
            );

            console.log(`✓ MTN deposit successful: ${transaction.id}`);
        } else {
            // Create failure notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, 'Deposit Failed', ?, 'TRANSACTION', NOW())`,
                [transaction.user_id,
                 `Your deposit of ${transaction.currency} ${parseFloat(transaction.amount).toLocaleString()} failed.`]
            );

            console.log(`✗ MTN deposit failed: ${transaction.id}`);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Webhook processed',
            transactionId: transaction.id,
            status: newStatus
        });

    } catch (error) {
        await connection.rollback();
        console.error('MTN webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/webhooks/airtel-callback
 * Airtel Money payment callback
 */
router.post('/airtel-callback', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const signature = req.headers['x-airtel-signature'];
        const payload = req.body;
        const AIRTEL_SECRET = process.env.AIRTEL_WEBHOOK_SECRET || 'airtel-secret-key';

        if (process.env.NODE_ENV === 'production') {
            if (!verifyAirtelSignature(payload, signature, AIRTEL_SECRET)) {
                console.error('Invalid Airtel webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const { reference, transaction_id: airtelTxnId, status } = payload;

        if (!reference) {
            return res.status(400).json({ error: 'Missing reference' });
        }

        await connection.beginTransaction();

        const [transactions] = await connection.execute(
            `SELECT id, user_id, amount, currency, status, credit_wallet_id
             FROM transactions
             WHERE external_reference = ? AND transaction_type = 'DEPOSIT' AND status = 'PENDING'
             FOR UPDATE`,
            [reference]
        );

        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Transaction not found or already processed' });
        }

        const transaction = transactions[0];
        const newStatus = status === 'SUCCESS' ? 'COMPLETED' : 'FAILED';

        await connection.execute(
            `UPDATE transactions 
             SET status = ?, external_transaction_id = ?, completed_at = NOW(), updated_at = NOW()
             WHERE id = ?`,
            [newStatus, airtelTxnId || reference, transaction.id]
        );

        if (status === 'SUCCESS') {
            const [wallets] = await connection.execute(
                `SELECT id, balance FROM wallets WHERE id = ? FOR UPDATE`,
                [transaction.credit_wallet_id]
            );

            if (wallets.length > 0) {
                const wallet = wallets[0];
                const oldBalance = parseFloat(wallet.balance);
                const newBalance = oldBalance + parseFloat(transaction.amount);

                await connection.execute(
                    `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
                    [newBalance, wallet.id]
                );

                await connection.execute(
                    `UPDATE transactions SET balance_before = ?, balance_after = ? WHERE id = ?`,
                    [oldBalance, newBalance, transaction.id]
                );

                await connection.execute(
                    `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
                     VALUES (?, ?, 'CREDIT', ?, ?, ?)`,
                    [transaction.id, wallet.id, transaction.amount, oldBalance, newBalance]
                );
            }

            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, 'Deposit Successful', ?, 'TRANSACTION', NOW())`,
                [transaction.user_id,
                 `Your deposit of ${transaction.currency} ${parseFloat(transaction.amount).toLocaleString()} has been credited.`]
            );

            console.log(`✓ Airtel deposit successful: ${transaction.id}`);
        } else {
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, 'Deposit Failed', ?, 'TRANSACTION', NOW())`,
                [transaction.user_id,
                 `Your deposit failed. Please try again.`]
            );

            console.log(`✗ Airtel deposit failed: ${transaction.id}`);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Webhook processed',
            transactionId: transaction.id,
            status: newStatus
        });

    } catch (error) {
        await connection.rollback();
        console.error('Airtel webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/webhooks/test-webhook (Development only)
 */
router.post('/test-webhook', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    const { external_reference, status = 'SUCCESSFUL', provider = 'MTN' } = req.body;

    if (!external_reference) {
        return res.status(400).json({ error: 'external_reference required' });
    }

    const testPayload = {
        external_reference,
        transaction_id: `TEST${Date.now()}`,
        status,
        amount: 50000,
        currency: 'UGX',
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        message: 'Test webhook payload generated',
        payload: testPayload,
        instructions: `POST this to /api/webhooks/${provider.toLowerCase()}-callback`
    });
});

module.exports = router;
