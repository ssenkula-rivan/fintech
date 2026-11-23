/**
 * Transaction Routes - REAL Mobile Money Integration
 * Uses MTN MoMo and Airtel Money APIs for deposits/withdrawals
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Import REAL mobile money services
const mtnMomo = require('../services/mtnMomo');
const airtelMoney = require('../services/airtelMoney');

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

// Calculate transaction fee based on amount and KYC tier
function calculateFee(amount, transactionType, kycTier) {
    let baseFee = 0;
    
    if (transactionType === 'TRANSFER') {
        baseFee = Math.max(amount * 0.005, 100); // 0.5% or min 100 UGX
    } else if (transactionType === 'WITHDRAWAL') {
        baseFee = Math.max(amount * 0.01, 500); // 1% or min 500 UGX
    }
    
    // KYC tier discounts
    const discount = kycTier === 'TIER_3' ? 0.5 : kycTier === 'TIER_2' ? 0.75 : 1.0;
    return Math.round(baseFee * discount);
}

// Calculate fraud risk score
function calculateFraudRisk(accountAgeDays, transactionCount, amount, avgTransaction, failedAttempts) {
    let risk = 0;
    
    if (accountAgeDays < 7) risk += 30;
    else if (accountAgeDays < 30) risk += 15;
    
    if (transactionCount < 5) risk += 20;
    
    if (avgTransaction > 0 && amount > avgTransaction * 5) risk += 25;
    
    if (failedAttempts > 3) risk += 15;
    
    return Math.min(risk, 100);
}

// Detect mobile money provider from phone number
function detectProvider(phone) {
    const normalized = phone.replace(/\D/g, '');
    const prefix = normalized.startsWith('256') ? normalized.substring(3, 5) : normalized.substring(1, 3);
    
    // MTN Uganda prefixes: 77, 78, 76
    if (['77', '78', '76'].includes(prefix)) {
        return 'MTN';
    }
    // Airtel Uganda prefixes: 70, 74, 75
    if (['70', '74', '75'].includes(prefix)) {
        return 'AIRTEL';
    }
    // Africell Uganda prefixes: 79
    if (prefix === '79') {
        return 'AFRICELL';
    }
    
    return null;
}


/**
 * POST /api/transactions/send
 * Send money to another user (internal transfer)
 */
router.post('/send', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const senderId = req.user.id;
        const { recipient_phone, amount, currency = 'UGX', description, pin } = req.body;

        // Validate required fields
        if (!recipient_phone || !amount || !pin) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'recipient_phone, amount, and pin are required'
            });
        }

        if (amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid amount',
                message: 'Amount must be greater than 0'
            });
        }

        // Validate phone format
        const phoneRegex = /^(\+?256|0)?[7][0-9]{8}$/;
        if (!phoneRegex.test(recipient_phone)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid phone format',
                message: 'Phone must be in format +256XXXXXXXXX or 07XXXXXXXX'
            });
        }

        // Normalize phone
        let normalizedPhone = recipient_phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '256' + normalizedPhone.substring(1);
        }
        if (!normalizedPhone.startsWith('256')) {
            normalizedPhone = '256' + normalizedPhone;
        }
        normalizedPhone = '+' + normalizedPhone;

        // Get sender with PIN
        const [senders] = await connection.execute(
            `SELECT id, phone, pin_hash, status, login_attempts, kyc_tier, created_at
             FROM users WHERE id = ?`,
            [senderId]
        );

        if (senders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Sender not found'
            });
        }

        const sender = senders[0];

        // Check account lock
        if (sender.login_attempts >= 3) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Account locked',
                message: 'Too many failed attempts. Contact support.'
            });
        }

        // Verify PIN
        const pinValid = await bcrypt.compare(pin, sender.pin_hash);
        if (!pinValid) {
            await connection.execute(
                `UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?`,
                [senderId]
            );
            await connection.commit();
            return res.status(401).json({
                success: false,
                error: 'Invalid PIN',
                attemptsRemaining: 2 - sender.login_attempts
            });
        }

        // Reset failed attempts on successful PIN
        await connection.execute(
            `UPDATE users SET login_attempts = 0 WHERE id = ?`,
            [senderId]
        );

        // Get recipient
        const [recipients] = await connection.execute(
            `SELECT id, phone, first_name, last_name, status
             FROM users WHERE phone = ?`,
            [normalizedPhone]
        );

        if (recipients.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Recipient not found',
                message: 'No GMG Global account found with this phone number'
            });
        }

        const recipient = recipients[0];

        // Cannot send to self
        if (senderId === recipient.id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction',
                message: 'Cannot send money to yourself'
            });
        }

        // Check recipient status
        if (recipient.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Recipient account inactive',
                message: `Recipient account is ${recipient.status.toLowerCase()}`
            });
        }

        // Get sender wallet with lock
        const [senderWallets] = await connection.execute(
            `SELECT id, balance, locked_balance, daily_limit, monthly_limit, 
                    daily_spent, monthly_spent, status
             FROM wallets 
             WHERE user_id = ? AND currency = ?
             FOR UPDATE`,
            [senderId, currency]
        );

        if (senderWallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Sender wallet not found'
            });
        }

        const senderWallet = senderWallets[0];

        if (senderWallet.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Wallet inactive'
            });
        }

        // Calculate fee
        const fee = calculateFee(parseFloat(amount), 'TRANSFER', sender.kyc_tier);
        const totalDebit = parseFloat(amount) + fee;

        // Check available balance
        const availableBalance = parseFloat(senderWallet.balance) - parseFloat(senderWallet.locked_balance);
        if (availableBalance < totalDebit) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance',
                available: availableBalance,
                required: totalDebit,
                breakdown: { amount: parseFloat(amount), fee }
            });
        }

        // Check daily limit
        const dailyAvailable = parseFloat(senderWallet.daily_limit) - parseFloat(senderWallet.daily_spent);
        if (totalDebit > dailyAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Daily limit exceeded',
                available: dailyAvailable
            });
        }

        // Check monthly limit
        const monthlyAvailable = parseFloat(senderWallet.monthly_limit) - parseFloat(senderWallet.monthly_spent);
        if (totalDebit > monthlyAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Monthly limit exceeded',
                available: monthlyAvailable
            });
        }

        // Calculate fraud risk
        const accountAgeDays = Math.floor((Date.now() - new Date(sender.created_at).getTime()) / (1000 * 60 * 60 * 24));
        
        const [txnStats] = await connection.execute(
            `SELECT COUNT(*) as count, AVG(amount) as avg_amount
             FROM transactions 
             WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [senderId]
        );

        const riskScore = calculateFraudRisk(
            accountAgeDays,
            parseInt(txnStats[0].count || 0),
            parseFloat(amount),
            parseFloat(txnStats[0].avg_amount || 0),
            sender.login_attempts || 0
        );

        if (riskScore > 70) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Transaction flagged',
                message: 'This transaction requires manual review'
            });
        }

        // Get recipient wallet with lock
        const [recipientWallets] = await connection.execute(
            `SELECT id, balance, status
             FROM wallets 
             WHERE user_id = ? AND currency = ?
             FOR UPDATE`,
            [recipient.id, currency]
        );

        if (recipientWallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Recipient wallet not found'
            });
        }

        const recipientWallet = recipientWallets[0];

        // Calculate balances
        const senderOldBalance = parseFloat(senderWallet.balance);
        const senderNewBalance = senderOldBalance - totalDebit;
        const recipientOldBalance = parseFloat(recipientWallet.balance);
        const recipientNewBalance = recipientOldBalance + parseFloat(amount);

        // Update sender wallet
        await connection.execute(
            `UPDATE wallets 
             SET balance = ?, daily_spent = daily_spent + ?, monthly_spent = monthly_spent + ?, updated_at = NOW()
             WHERE id = ?`,
            [senderNewBalance, totalDebit, totalDebit, senderWallet.id]
        );

        // Update recipient wallet
        await connection.execute(
            `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
            [recipientNewBalance, recipientWallet.id]
        );

        // Create transaction record
        const reference = `TRF${Date.now()}`;
        const recipientName = `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim();

        await connection.execute(
            `INSERT INTO transactions 
             (reference, user_id, transaction_type, amount, currency, fee,
              debit_wallet_id, credit_wallet_id, counterparty_user_id, counterparty_phone, counterparty_name,
              status, description, balance_before, balance_after,
              completed_at, created_at)
             VALUES (?, ?, 'TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, NOW(), NOW())`,
            [reference, senderId, amount, currency, fee,
             senderWallet.id, recipientWallet.id, recipient.id, normalizedPhone, recipientName,
             description || 'Money transfer', senderOldBalance, senderNewBalance]
        );

        // Get the inserted transaction ID
        const [insertResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const txnId = insertResult[0].id;

        // Create ledger entries (double-entry accounting)
        await connection.execute(
            `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
             VALUES (?, ?, 'DEBIT', ?, ?, ?)`,
            [txnId, senderWallet.id, totalDebit, senderOldBalance, senderNewBalance]
        );

        await connection.execute(
            `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
             VALUES (?, ?, 'CREDIT', ?, ?, ?)`,
            [txnId, recipientWallet.id, amount, recipientOldBalance, recipientNewBalance]
        );

        // Create notifications
        await connection.execute(
            `INSERT INTO notifications (user_id, title, message, type, created_at)
             VALUES (?, 'Money Sent', ?, 'TRANSACTION', NOW())`,
            [senderId, 
             `You sent ${currency} ${parseFloat(amount).toLocaleString()} to ${recipientName || normalizedPhone}`]
        );

        await connection.execute(
            `INSERT INTO notifications (user_id, title, message, type, created_at)
             VALUES (?, 'Money Received', ?, 'TRANSACTION', NOW())`,
            [recipient.id,
             `You received ${currency} ${parseFloat(amount).toLocaleString()} from ${sender.phone}`]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Transfer successful',
            data: {
                transactionId: txnId,
                reference,
                status: 'COMPLETED',
                recipientId: recipient.id,
                recipientName,
                recipientPhone: normalizedPhone,
                amount: parseFloat(amount),
                fee,
                totalDebited: totalDebit,
                currency,
                description: description || 'Money transfer',
                newBalance: senderNewBalance,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Send money error:', error);
        res.status(500).json({
            success: false,
            error: 'Transfer failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});


/**
 * POST /api/transactions/deposit
 * Initiate REAL mobile money deposit via MTN MoMo or Airtel Money
 */
router.post('/deposit', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { amount, currency = 'UGX', method, phone } = req.body;

        // Validate input
        if (!amount || !method) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'amount and method are required'
            });
        }

        if (amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid amount',
                message: 'Amount must be greater than 0'
            });
        }

        const validMethods = ['MTN', 'AIRTEL', 'AFRICELL'];
        const normalizedMethod = method.toUpperCase();
        if (!validMethods.includes(normalizedMethod)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid method',
                message: 'Method must be MTN, AIRTEL, or AFRICELL'
            });
        }

        // Get user
        const [users] = await connection.execute(
            `SELECT id, phone, first_name, status FROM users WHERE id = ?`,
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
        const depositPhone = phone || user.phone;

        // Validate phone matches provider
        const detectedProvider = detectProvider(depositPhone);
        if (detectedProvider && detectedProvider !== normalizedMethod && normalizedMethod !== 'AFRICELL') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Phone number mismatch',
                message: `Phone number appears to be ${detectedProvider}, not ${normalizedMethod}`
            });
        }

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT id, status FROM wallets WHERE user_id = ? AND currency = ?`,
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

        // Create pending transaction first
        const reference = `DEP${Date.now()}`;
        const externalRef = crypto.randomBytes(16).toString('hex');

        await connection.execute(
            `INSERT INTO transactions 
             (reference, external_reference, user_id, transaction_type, amount, currency,
              credit_wallet_id, counterparty_phone, payment_method, status, description, created_at)
             VALUES (?, ?, ?, 'DEPOSIT', ?, ?, ?, ?, ?, 'PENDING', 'Mobile money deposit', NOW())`,
            [reference, externalRef, userId, amount, currency, wallet.id, depositPhone, normalizedMethod]
        );

        const [insertResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const txnId = insertResult[0].id;

        await connection.commit();

        // Now initiate REAL mobile money request
        let momoResult;
        let paymentInstructions;

        try {
            if (normalizedMethod === 'MTN') {
                // Check if MTN is configured
                if (!mtnMomo.isConfigured()) {
                    return res.json({
                        success: true,
                        message: 'Deposit request created (MTN API not configured)',
                        data: {
                            transactionId: txnId,
                            reference,
                            status: 'PENDING',
                            amount: parseFloat(amount),
                            currency,
                            method: normalizedMethod,
                            phone: depositPhone,
                            apiConfigured: false,
                            paymentInstructions: 'MTN MoMo API not configured. Set MTN_MOMO_* environment variables.',
                            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                        }
                    });
                }

                // REAL MTN MoMo API call
                momoResult = await mtnMomo.requestPayment({
                    phone: depositPhone,
                    amount: parseFloat(amount),
                    currency,
                    externalId: reference,
                    payerMessage: `GMG Global deposit - ${reference}`,
                    payeeNote: `Wallet deposit for user ${userId}`
                });

                // Update transaction with MTN reference
                await pool.execute(
                    `UPDATE transactions SET external_reference = ?, metadata = ? WHERE id = ?`,
                    [momoResult.referenceId, JSON.stringify({ mtnReferenceId: momoResult.referenceId }), txnId]
                );

                paymentInstructions = 'A payment prompt has been sent to your phone. Please enter your MTN MoMo PIN to approve.';

            } else if (normalizedMethod === 'AIRTEL') {
                // Check if Airtel is configured
                if (!airtelMoney.isConfigured()) {
                    return res.json({
                        success: true,
                        message: 'Deposit request created (Airtel API not configured)',
                        data: {
                            transactionId: txnId,
                            reference,
                            status: 'PENDING',
                            amount: parseFloat(amount),
                            currency,
                            method: normalizedMethod,
                            phone: depositPhone,
                            apiConfigured: false,
                            paymentInstructions: 'Airtel Money API not configured. Set AIRTEL_* environment variables.',
                            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                        }
                    });
                }

                // REAL Airtel Money API call
                momoResult = await airtelMoney.requestPayment({
                    phone: depositPhone,
                    amount: parseFloat(amount),
                    reference: reference,
                    transactionId: externalRef
                });

                // Update transaction with Airtel reference
                await pool.execute(
                    `UPDATE transactions SET external_reference = ?, metadata = ? WHERE id = ?`,
                    [momoResult.transactionId, JSON.stringify({ airtelTransactionId: momoResult.transactionId }), txnId]
                );

                paymentInstructions = 'A payment prompt has been sent to your phone. Please enter your Airtel Money PIN to approve.';

            } else if (normalizedMethod === 'AFRICELL') {
                // Africell not yet integrated
                paymentInstructions = 'Africell Money integration coming soon. Please use MTN or Airtel.';
                momoResult = { success: false, message: 'Africell not yet supported' };
            }

        } catch (momoError) {
            console.error('Mobile money API error:', momoError);
            
            // Update transaction as failed
            await pool.execute(
                `UPDATE transactions SET status = 'FAILED', failure_reason = ?, failed_at = NOW() WHERE id = ?`,
                [momoError.message, txnId]
            );

            return res.status(502).json({
                success: false,
                error: 'Mobile money request failed',
                message: momoError.message,
                transactionId: txnId,
                reference
            });
        }

        res.json({
            success: true,
            message: momoResult?.success ? 'Payment request sent to your phone' : 'Deposit request created',
            data: {
                transactionId: txnId,
                reference,
                externalReference: momoResult?.referenceId || momoResult?.transactionId || externalRef,
                status: 'PENDING',
                amount: parseFloat(amount),
                currency,
                method: normalizedMethod,
                phone: depositPhone,
                apiConfigured: true,
                paymentInstructions,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            error: 'Deposit request failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/transactions/withdraw
 * Initiate REAL mobile money withdrawal (disbursement)
 */
router.post('/withdraw', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { amount, currency = 'UGX', method, phone, pin } = req.body;

        // Validate input
        if (!amount || !method || !pin) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'amount, method, and pin are required'
            });
        }

        if (amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        const normalizedMethod = method.toUpperCase();
        if (!['MTN', 'AIRTEL'].includes(normalizedMethod)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid method',
                message: 'Withdrawal method must be MTN or AIRTEL'
            });
        }

        // Get user and verify PIN
        const [users] = await connection.execute(
            `SELECT id, phone, pin_hash, status, login_attempts, kyc_tier FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = users[0];
        const withdrawPhone = phone || user.phone;

        // Check account lock
        if (user.login_attempts >= 3) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Account locked'
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
        await connection.execute(`UPDATE users SET login_attempts = 0 WHERE id = ?`, [userId]);

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT id, balance, locked_balance, daily_limit, daily_spent, status
             FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
            [userId, currency]
        );

        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Wallet not found' });
        }

        const wallet = wallets[0];

        // Calculate fee
        const fee = calculateFee(parseFloat(amount), 'WITHDRAWAL', user.kyc_tier);
        const totalDebit = parseFloat(amount) + fee;

        // Check balance
        const availableBalance = parseFloat(wallet.balance) - parseFloat(wallet.locked_balance);
        if (availableBalance < totalDebit) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance',
                available: availableBalance,
                required: totalDebit
            });
        }

        // Check daily limit
        const dailyAvailable = parseFloat(wallet.daily_limit) - parseFloat(wallet.daily_spent);
        if (totalDebit > dailyAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Daily limit exceeded',
                available: dailyAvailable
            });
        }

        // Debit wallet immediately (lock funds)
        const oldBalance = parseFloat(wallet.balance);
        const newBalance = oldBalance - totalDebit;

        await connection.execute(
            `UPDATE wallets SET balance = ?, daily_spent = daily_spent + ?, updated_at = NOW() WHERE id = ?`,
            [newBalance, totalDebit, wallet.id]
        );

        // Create transaction record
        const reference = `WDR${Date.now()}`;
        const externalRef = crypto.randomBytes(16).toString('hex');

        await connection.execute(
            `INSERT INTO transactions 
             (reference, external_reference, user_id, transaction_type, amount, currency, fee,
              debit_wallet_id, counterparty_phone, payment_method, status, description,
              balance_before, balance_after, created_at)
             VALUES (?, ?, ?, 'WITHDRAWAL', ?, ?, ?, ?, ?, ?, 'PENDING', 'Mobile money withdrawal', ?, ?, NOW())`,
            [reference, externalRef, userId, amount, currency, fee, wallet.id, withdrawPhone, normalizedMethod, oldBalance, newBalance]
        );

        const [insertResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const txnId = insertResult[0].id;

        await connection.commit();

        // Initiate REAL mobile money transfer
        let transferResult;

        try {
            if (normalizedMethod === 'MTN') {
                if (!mtnMomo.isConfigured()) {
                    return res.json({
                        success: true,
                        message: 'Withdrawal initiated (MTN API not configured)',
                        data: {
                            transactionId: txnId,
                            reference,
                            status: 'PENDING',
                            amount: parseFloat(amount),
                            fee,
                            currency,
                            method: normalizedMethod,
                            phone: withdrawPhone,
                            apiConfigured: false,
                            newBalance
                        }
                    });
                }

                transferResult = await mtnMomo.transfer({
                    phone: withdrawPhone,
                    amount: parseFloat(amount),
                    currency,
                    externalId: reference,
                    payerMessage: `GMG Global withdrawal - ${reference}`,
                    payeeNote: `Wallet withdrawal for user ${userId}`
                });

                await pool.execute(
                    `UPDATE transactions SET external_reference = ?, metadata = ? WHERE id = ?`,
                    [transferResult.referenceId, JSON.stringify({ mtnReferenceId: transferResult.referenceId }), txnId]
                );

            } else if (normalizedMethod === 'AIRTEL') {
                if (!airtelMoney.isConfigured()) {
                    return res.json({
                        success: true,
                        message: 'Withdrawal initiated (Airtel API not configured)',
                        data: {
                            transactionId: txnId,
                            reference,
                            status: 'PENDING',
                            amount: parseFloat(amount),
                            fee,
                            currency,
                            method: normalizedMethod,
                            phone: withdrawPhone,
                            apiConfigured: false,
                            newBalance
                        }
                    });
                }

                transferResult = await airtelMoney.transfer({
                    phone: withdrawPhone,
                    amount: parseFloat(amount),
                    reference: reference,
                    transactionId: externalRef
                });

                await pool.execute(
                    `UPDATE transactions SET external_reference = ?, metadata = ? WHERE id = ?`,
                    [transferResult.transactionId, JSON.stringify({ airtelTransactionId: transferResult.transactionId }), txnId]
                );
            }

        } catch (transferError) {
            console.error('Mobile money transfer error:', transferError);

            // Refund the wallet on failure
            await pool.execute(
                `UPDATE wallets SET balance = balance + ?, daily_spent = daily_spent - ? WHERE id = ?`,
                [totalDebit, totalDebit, wallet.id]
            );

            await pool.execute(
                `UPDATE transactions SET status = 'FAILED', failure_reason = ?, failed_at = NOW() WHERE id = ?`,
                [transferError.message, txnId]
            );

            return res.status(502).json({
                success: false,
                error: 'Withdrawal failed',
                message: transferError.message,
                refunded: true
            });
        }

        res.json({
            success: true,
            message: 'Withdrawal initiated',
            data: {
                transactionId: txnId,
                reference,
                externalReference: transferResult?.referenceId || transferResult?.transactionId,
                status: 'PENDING',
                amount: parseFloat(amount),
                fee,
                totalDebited: totalDebit,
                currency,
                method: normalizedMethod,
                phone: withdrawPhone,
                apiConfigured: true,
                newBalance,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Withdraw error:', error);
        res.status(500).json({
            success: false,
            error: 'Withdrawal failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});


/**
 * GET /api/transactions/status/:reference
 * Check REAL mobile money transaction status
 */
router.get('/status/:reference', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { reference } = req.params;

        // Get transaction
        const [transactions] = await pool.execute(
            `SELECT id, reference, external_reference, transaction_type, amount, currency,
                    payment_method, status, metadata, created_at
             FROM transactions WHERE reference = ? AND user_id = ?`,
            [reference, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        const txn = transactions[0];
        let liveStatus = null;

        // Check live status from mobile money provider
        if (txn.status === 'PENDING' && txn.external_reference) {
            try {
                const metadata = txn.metadata ? JSON.parse(txn.metadata) : {};

                if (txn.payment_method === 'MTN' && mtnMomo.isConfigured()) {
                    const mtnRef = metadata.mtnReferenceId || txn.external_reference;
                    liveStatus = await mtnMomo.getPaymentStatus(mtnRef);

                    // Update transaction if status changed
                    if (liveStatus.status === 'SUCCESSFUL') {
                        await updateTransactionStatus(txn.id, 'COMPLETED', liveStatus);
                        txn.status = 'COMPLETED';
                    } else if (liveStatus.status === 'FAILED') {
                        await updateTransactionStatus(txn.id, 'FAILED', liveStatus);
                        txn.status = 'FAILED';
                    }

                } else if (txn.payment_method === 'AIRTEL' && airtelMoney.isConfigured()) {
                    const airtelRef = metadata.airtelTransactionId || txn.external_reference;
                    liveStatus = await airtelMoney.getPaymentStatus(airtelRef);

                    if (liveStatus.status === 'TS') { // Transaction Successful
                        await updateTransactionStatus(txn.id, 'COMPLETED', liveStatus);
                        txn.status = 'COMPLETED';
                    } else if (liveStatus.status === 'TF') { // Transaction Failed
                        await updateTransactionStatus(txn.id, 'FAILED', liveStatus);
                        txn.status = 'FAILED';
                    }
                }
            } catch (statusError) {
                console.error('Status check error:', statusError);
                // Continue with database status
            }
        }

        res.json({
            success: true,
            data: {
                reference: txn.reference,
                externalReference: txn.external_reference,
                type: txn.transaction_type,
                amount: parseFloat(txn.amount),
                currency: txn.currency,
                method: txn.payment_method,
                status: txn.status,
                liveStatus: liveStatus,
                createdAt: txn.created_at
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check status'
        });
    }
});

// Helper function to update transaction status
async function updateTransactionStatus(txnId, status, providerResponse) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get transaction details
        const [txns] = await connection.execute(
            `SELECT id, user_id, transaction_type, amount, currency, fee, credit_wallet_id, debit_wallet_id
             FROM transactions WHERE id = ? FOR UPDATE`,
            [txnId]
        );

        if (txns.length === 0) {
            await connection.rollback();
            return;
        }

        const txn = txns[0];

        if (status === 'COMPLETED') {
            // For deposits, credit the wallet
            if (txn.transaction_type === 'DEPOSIT' && txn.credit_wallet_id) {
                await connection.execute(
                    `UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?`,
                    [parseFloat(txn.amount), txn.credit_wallet_id]
                );
            }

            await connection.execute(
                `UPDATE transactions SET status = 'COMPLETED', completed_at = NOW(), 
                 metadata = JSON_SET(COALESCE(metadata, '{}'), '$.providerResponse', ?) WHERE id = ?`,
                [JSON.stringify(providerResponse), txnId]
            );

            // Create notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, ?, ?, 'TRANSACTION', NOW())`,
                [txn.user_id, 
                 txn.transaction_type === 'DEPOSIT' ? 'Deposit Successful' : 'Withdrawal Successful',
                 `Your ${txn.transaction_type.toLowerCase()} of ${txn.currency} ${parseFloat(txn.amount).toLocaleString()} was successful.`]
            );

        } else if (status === 'FAILED') {
            // For withdrawals, refund the wallet
            if (txn.transaction_type === 'WITHDRAWAL' && txn.debit_wallet_id) {
                const refundAmount = parseFloat(txn.amount) + parseFloat(txn.fee || 0);
                await connection.execute(
                    `UPDATE wallets SET balance = balance + ?, daily_spent = daily_spent - ?, updated_at = NOW() WHERE id = ?`,
                    [refundAmount, refundAmount, txn.debit_wallet_id]
                );
            }

            await connection.execute(
                `UPDATE transactions SET status = 'FAILED', failed_at = NOW(), 
                 failure_reason = ?, metadata = JSON_SET(COALESCE(metadata, '{}'), '$.providerResponse', ?) WHERE id = ?`,
                [providerResponse.reason || 'Payment failed', JSON.stringify(providerResponse), txnId]
            );

            // Create notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES (?, ?, ?, 'TRANSACTION', NOW())`,
                [txn.user_id,
                 txn.transaction_type === 'DEPOSIT' ? 'Deposit Failed' : 'Withdrawal Failed',
                 `Your ${txn.transaction_type.toLowerCase()} of ${txn.currency} ${parseFloat(txn.amount).toLocaleString()} failed. ${providerResponse.reason || ''}`]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Update transaction status error:', error);
    } finally {
        connection.release();
    }
}

/**
 * GET /api/transactions/history
 * Get transaction history
 */
router.get('/history', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { type, status, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                t.id, t.reference, t.transaction_type, t.amount, t.currency, t.fee,
                t.counterparty_user_id, t.counterparty_phone, t.counterparty_name,
                t.payment_method, t.status, t.description, t.balance_before, t.balance_after,
                t.created_at, t.completed_at
            FROM transactions t
            WHERE t.user_id = ?`;

        const params = [userId];

        if (type) {
            query += ` AND t.transaction_type = ?`;
            params.push(type.toUpperCase());
        }

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status.toUpperCase());
        }

        const limitNum = Math.min(Math.max(1, parseInt(limit) || 50), 100);
        const offsetNum = Math.max(0, parseInt(offset) || 0);
        query += ` ORDER BY t.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
        // Note: LIMIT/OFFSET are integers, not parameterized to avoid MySQL type issues

        const [transactions] = await connection.execute(query, params);

        // Get total count
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                total: countResult[0].total,
                count: transactions.length,
                offset: parseInt(offset),
                transactions: transactions.map(t => ({
                    id: t.id,
                    reference: t.reference,
                    type: t.transaction_type,
                    amount: parseFloat(t.amount),
                    currency: t.currency,
                    fee: parseFloat(t.fee || 0),
                    recipientId: t.counterparty_user_id,
                    recipientPhone: t.counterparty_phone,
                    recipientName: t.counterparty_name,
                    paymentMethod: t.payment_method,
                    status: t.status,
                    description: t.description,
                    balanceBefore: parseFloat(t.balance_before || 0),
                    balanceAfter: parseFloat(t.balance_after || 0),
                    createdAt: t.created_at,
                    completedAt: t.completed_at
                }))
            }
        });

    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction history'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/transactions/:id
 * Get single transaction details
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;

        const [transactions] = await connection.execute(
            `SELECT 
                t.id, t.reference, t.external_reference, t.transaction_type, 
                t.amount, t.currency, t.fee,
                t.debit_wallet_id, t.credit_wallet_id,
                t.counterparty_user_id, t.counterparty_phone, t.counterparty_name,
                t.payment_method, t.metadata,
                t.status, t.description, t.balance_before, t.balance_after,
                t.created_at, t.completed_at, t.failed_at, t.failure_reason
             FROM transactions t
             WHERE t.id = ? AND (t.user_id = ? OR t.counterparty_user_id = ?)`,
            [transactionId, userId, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        const t = transactions[0];

        res.json({
            success: true,
            data: {
                id: t.id,
                reference: t.reference,
                externalReference: t.external_reference,
                type: t.transaction_type,
                amount: parseFloat(t.amount),
                currency: t.currency,
                fee: parseFloat(t.fee || 0),
                recipientId: t.counterparty_user_id,
                recipientPhone: t.counterparty_phone,
                recipientName: t.counterparty_name,
                paymentMethod: t.payment_method,
                metadata: t.metadata ? JSON.parse(t.metadata) : null,
                status: t.status,
                description: t.description,
                balanceBefore: parseFloat(t.balance_before || 0),
                balanceAfter: parseFloat(t.balance_after || 0),
                createdAt: t.created_at,
                completedAt: t.completed_at,
                failedAt: t.failed_at,
                failureReason: t.failure_reason
            }
        });

    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/transactions/providers/status
 * Check mobile money provider configuration status
 */
router.get('/providers/status', (req, res) => {
    res.json({
        success: true,
        data: {
            mtn: {
                configured: mtnMomo.isConfigured(),
                environment: mtnMomo.isConfigured() ? mtnMomo.getConfig().environment : null
            },
            airtel: {
                configured: airtelMoney.isConfigured(),
                environment: airtelMoney.isConfigured() ? airtelMoney.getConfig().environment : null
            },
            africell: {
                configured: false,
                message: 'Coming soon'
            }
        }
    });
});

module.exports = router;
