/**
 * Currency Routes - REAL Exchange Rate Integration
 * Uses live rates from Open Exchange Rates API
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Import REAL exchange rate service
const exchangeRateService = require('../services/exchangeRates');

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

// Calculate fee (1.5% for currency exchange)
function calculateExchangeFee(amount) {
    return Math.round(amount * 0.015 * 100) / 100;
}

/**
 * GET /api/currency/rates
 * Get LIVE exchange rates from Open Exchange Rates API
 */
router.get('/rates', async (req, res) => {
    try {
        const { base = 'UGX' } = req.query;
        
        // Use REAL exchange rate service
        const ratesData = await exchangeRateService.getRatesForBase(base);

        res.json({
            success: true,
            data: {
                base: ratesData.base,
                rates: ratesData.rates,
                updatedAt: ratesData.timestamp,
                cached: ratesData.cached,
                source: 'openexchangerates.org'
            }
        });
    } catch (error) {
        console.error('Get rates error:', error);
        
        // Check if it's a configuration error
        if (error.message.includes('not configured')) {
            return res.status(503).json({
                success: false,
                error: 'Exchange rate service not configured',
                message: error.message,
                setup: 'Set OPENEXCHANGERATES_APP_ID in .env file'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to get exchange rates',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/currency/convert
 * Convert amount between currencies using LIVE rates
 */
router.get('/convert', async (req, res) => {
    try {
        const { from, to, amount } = req.query;

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing parameters: from, to, amount required'
            });
        }

        const inputAmount = parseFloat(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be a positive number'
            });
        }

        // Use REAL exchange rate service
        const conversion = await exchangeRateService.convert(
            inputAmount,
            from.toUpperCase(),
            to.toUpperCase()
        );

        const fee = calculateExchangeFee(inputAmount);
        const feeInTarget = fee * conversion.rate;
        const finalAmount = conversion.convertedAmount - feeInTarget;

        res.json({
            success: true,
            data: {
                from: conversion.from,
                to: conversion.to,
                inputAmount: conversion.amount,
                rate: conversion.rate,
                inverseRate: conversion.inverseRate,
                convertedAmount: conversion.convertedAmount,
                fee,
                feeInTarget: Math.round(feeInTarget * 100) / 100,
                finalAmount: Math.round(finalAmount * 100) / 100,
                rateTimestamp: conversion.timestamp,
                cached: conversion.cached,
                source: 'openexchangerates.org'
            }
        });
    } catch (error) {
        console.error('Convert error:', error);
        
        if (error.message.includes('Unsupported currency')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        
        if (error.message.includes('not configured')) {
            return res.status(503).json({
                success: false,
                error: 'Exchange rate service not configured',
                setup: 'Set OPENEXCHANGERATES_APP_ID in .env file'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Conversion failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/currency/rate
 * Get specific exchange rate between two currencies
 */
router.get('/rate', async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                error: 'Missing parameters: from, to required'
            });
        }

        const rate = await exchangeRateService.getRate(from, to);
        
        if (rate === null) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported currency pair'
            });
        }

        res.json({
            success: true,
            data: {
                from: from.toUpperCase(),
                to: to.toUpperCase(),
                rate: Math.round(rate * 1000000) / 1000000,
                inverseRate: Math.round((1 / rate) * 1000000) / 1000000,
                source: 'openexchangerates.org'
            }
        });
    } catch (error) {
        console.error('Get rate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get exchange rate'
        });
    }
});

/**
 * POST /api/currency/exchange
 * Execute currency exchange with LIVE rates
 */
router.post('/exchange', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { fromCurrency, toCurrency, amount, pin } = req.body;

        // Validate input
        if (!fromCurrency || !toCurrency || !amount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: fromCurrency, toCurrency, amount'
            });
        }

        if (amount <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Amount must be greater than 0'
            });
        }

        // Get LIVE exchange rate
        let conversion;
        try {
            conversion = await exchangeRateService.convert(
                parseFloat(amount),
                fromCurrency.toUpperCase(),
                toCurrency.toUpperCase()
            );
        } catch (rateError) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: rateError.message
            });
        }

        const rate = conversion.rate;

        // Get source wallet
        const [sourceWallets] = await connection.execute(
            `SELECT id, balance, status FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
            [userId, fromCurrency.toUpperCase()]
        );

        if (sourceWallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: `No ${fromCurrency} wallet found`
            });
        }

        const sourceWallet = sourceWallets[0];
        
        if (sourceWallet.status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'Source wallet is not active'
            });
        }

        const fee = calculateExchangeFee(parseFloat(amount));
        const totalDebit = parseFloat(amount) + fee;

        if (parseFloat(sourceWallet.balance) < totalDebit) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance',
                available: parseFloat(sourceWallet.balance),
                required: totalDebit,
                breakdown: {
                    amount: parseFloat(amount),
                    fee
                }
            });
        }

        // Get or create destination wallet
        let [destWallets] = await connection.execute(
            `SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ?`,
            [userId, toCurrency.toUpperCase()]
        );

        let destWallet;
        if (destWallets.length === 0) {
            // Create new wallet for destination currency
            await connection.execute(
                `INSERT INTO wallets (user_id, currency, balance, status, last_reset_date) 
                 VALUES (?, ?, 0, 'ACTIVE', CURDATE())`,
                [userId, toCurrency.toUpperCase()]
            );
            const [newWallet] = await connection.execute(
                `SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ?`,
                [userId, toCurrency.toUpperCase()]
            );
            destWallet = newWallet[0];
        } else {
            destWallet = destWallets[0];
        }

        // Calculate amounts using LIVE rate
        const convertedAmount = conversion.convertedAmount;
        const sourceOldBalance = parseFloat(sourceWallet.balance);
        const sourceNewBalance = sourceOldBalance - totalDebit;
        const destOldBalance = parseFloat(destWallet.balance);
        const destNewBalance = destOldBalance + convertedAmount;

        // Update source wallet
        await connection.execute(
            `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
            [sourceNewBalance, sourceWallet.id]
        );

        // Update destination wallet
        await connection.execute(
            `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
            [destNewBalance, destWallet.id]
        );

        // Create transaction record with rate metadata
        const reference = `EXC${Date.now()}`;
        const rateMetadata = JSON.stringify({
            rate: rate,
            inverseRate: conversion.inverseRate,
            rateTimestamp: conversion.timestamp,
            source: 'openexchangerates.org',
            cached: conversion.cached
        });

        await connection.execute(
            `INSERT INTO transactions 
             (reference, user_id, transaction_type, amount, currency, fee,
              debit_wallet_id, credit_wallet_id, status, description, metadata,
              balance_before, balance_after, completed_at, created_at)
             VALUES (?, ?, 'EXCHANGE', ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, NOW(), NOW())`,
            [reference, userId, amount, fromCurrency.toUpperCase(), fee,
             sourceWallet.id, destWallet.id,
             `Currency exchange: ${fromCurrency} to ${toCurrency} at rate ${rate.toFixed(6)}`,
             rateMetadata, sourceOldBalance, sourceNewBalance]
        );

        // Create notification
        await connection.execute(
            `INSERT INTO notifications (user_id, title, message, type, created_at)
             VALUES (?, 'Currency Exchange', ?, 'TRANSACTION', NOW())`,
            [userId, `Exchanged ${fromCurrency} ${amount} to ${toCurrency} ${convertedAmount.toFixed(2)} (Rate: ${rate.toFixed(4)})`]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Exchange successful',
            data: {
                reference,
                fromCurrency: fromCurrency.toUpperCase(),
                toCurrency: toCurrency.toUpperCase(),
                fromAmount: parseFloat(amount),
                toAmount: convertedAmount,
                rate,
                inverseRate: conversion.inverseRate,
                fee,
                sourceNewBalance,
                destNewBalance,
                rateSource: 'openexchangerates.org',
                rateTimestamp: conversion.timestamp,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Exchange error:', error);
        res.status(500).json({
            success: false,
            error: 'Exchange failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/currency/supported
 * Get list of supported currencies
 */
router.get('/supported', (req, res) => {
    const currencies = exchangeRateService.getSupportedCurrencies();

    res.json({
        success: true,
        data: currencies
    });
});

/**
 * GET /api/currency/status
 * Check exchange rate service status
 */
router.get('/status', async (req, res) => {
    try {
        const rates = await exchangeRateService.getRates();
        
        res.json({
            success: true,
            data: {
                status: 'operational',
                provider: 'openexchangerates.org',
                cached: rates.cached,
                cacheAge: rates.cacheAge,
                lastUpdate: new Date(rates.timestamp).toISOString(),
                currencyCount: Object.keys(rates.rates).length
            }
        });
    } catch (error) {
        res.json({
            success: false,
            data: {
                status: 'unavailable',
                error: error.message,
                configured: !!process.env.OPENEXCHANGERATES_APP_ID
            }
        });
    }
});

module.exports = router;
