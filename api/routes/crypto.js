/**
 * Crypto Exchange Routes - Bity API Integration
 * Buy/Sell cryptocurrency with fiat currencies
 */

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Import Bity exchange service
const bityExchange = require('../services/bityExchange');

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
 * GET /api/crypto/currencies
 * Get supported cryptocurrencies
 */
router.get('/currencies', async (req, res) => {
    try {
        const { type } = req.query; // 'crypto', 'fiat', or 'all'
        
        let currencies;
        if (type === 'crypto') {
            currencies = await bityExchange.getCryptoCurrencies();
        } else if (type === 'fiat') {
            currencies = await bityExchange.getFiatCurrencies();
        } else {
            currencies = await bityExchange.getCurrencies();
        }

        res.json({
            success: true,
            data: currencies.map(c => ({
                code: c.code,
                maxDecimals: c.max_digits_in_decimal_part,
                tags: c.tags,
                inputMethods: c.input_methods
            }))
        });
    } catch (error) {
        console.error('Get currencies error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get currencies',
            message: error.message
        });
    }
});

/**
 * GET /api/crypto/pairs
 * Get supported trading pairs
 */
router.get('/pairs', async (req, res) => {
    try {
        const { input, output } = req.query;
        
        const pairs = await bityExchange.getCurrencyPairs({
            input,
            output,
            enabled: true
        });

        res.json({
            success: true,
            data: pairs.filter(p => p.enabled).map(p => ({
                input: p.input,
                output: p.output,
                pair: `${p.input}/${p.output}`
            }))
        });
    } catch (error) {
        console.error('Get pairs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trading pairs'
        });
    }
});

/**
 * POST /api/crypto/estimate
 * Get exchange rate estimate
 */
router.post('/estimate', async (req, res) => {
    try {
        const {
            inputCurrency,
            outputCurrency,
            inputAmount,
            outputAmount,
            inputType,
            outputType
        } = req.body;

        if (!inputCurrency || !outputCurrency) {
            return res.status(400).json({
                success: false,
                error: 'inputCurrency and outputCurrency are required'
            });
        }

        if (!inputAmount && !outputAmount) {
            return res.status(400).json({
                success: false,
                error: 'Either inputAmount or outputAmount is required'
            });
        }

        const estimate = await bityExchange.estimateAmount({
            inputCurrency,
            outputCurrency,
            inputAmount,
            outputAmount,
            inputType,
            outputType
        });

        // Calculate effective rate
        const effectiveRate = parseFloat(estimate.output.amount) / parseFloat(estimate.input.amount);

        res.json({
            success: true,
            data: {
                input: estimate.input,
                output: estimate.output,
                effectiveRate: effectiveRate.toFixed(8),
                fees: estimate.priceBreakdown,
                requirements: estimate.orderingRequirements
            }
        });
    } catch (error) {
        console.error('Estimate error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.error || 'Estimation failed',
            details: error.details
        });
    }
});

/**
 * POST /api/crypto/buy
 * Buy cryptocurrency with fiat (CHF/EUR → BTC/ETH)
 */
router.post('/buy', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const {
            fiatCurrency,      // CHF, EUR
            cryptoCurrency,    // BTC, ETH
            fiatAmount,        // Amount in fiat to spend
            cryptoAmount,      // OR desired crypto amount
            cryptoAddress,     // Destination wallet address
            contactEmail
        } = req.body;

        // Validate input
        if (!fiatCurrency || !cryptoCurrency || !cryptoAddress) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'fiatCurrency, cryptoCurrency, and cryptoAddress are required'
            });
        }

        if (!fiatAmount && !cryptoAmount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Either fiatAmount or cryptoAmount is required'
            });
        }

        // Validate crypto address format
        const addressPatterns = {
            BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
            ETH: /^0x[a-fA-F0-9]{40}$/
        };

        if (addressPatterns[cryptoCurrency] && !addressPatterns[cryptoCurrency].test(cryptoAddress)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: `Invalid ${cryptoCurrency} address format`
            });
        }

        // Get estimate first
        const estimate = await bityExchange.estimateAmount({
            inputCurrency: fiatCurrency,
            outputCurrency: cryptoCurrency,
            inputAmount: fiatAmount,
            outputAmount: cryptoAmount
        });

        // Place order with Bity
        const orderResult = await bityExchange.placeOrder({
            inputCurrency: fiatCurrency,
            outputCurrency: cryptoCurrency,
            inputAmount: fiatAmount || estimate.input.amount,
            cryptoAddress,
            contactEmail
        });

        // Get order details
        const orderDetails = await bityExchange.getOrder(orderResult.orderId);

        // Create local transaction record
        const reference = `CRYPTO_BUY_${Date.now()}`;
        
        await connection.execute(
            `INSERT INTO transactions 
             (reference, external_reference, user_id, transaction_type, 
              amount, currency, status, description, metadata, created_at)
             VALUES (?, ?, ?, 'CRYPTO_BUY', ?, ?, 'PENDING', ?, ?, NOW())`,
            [
                reference,
                orderResult.orderId,
                userId,
                estimate.input.amount,
                fiatCurrency,
                `Buy ${cryptoCurrency} with ${fiatCurrency}`,
                JSON.stringify({
                    bityOrderId: orderResult.orderId,
                    inputCurrency: fiatCurrency,
                    outputCurrency: cryptoCurrency,
                    inputAmount: estimate.input.amount,
                    outputAmount: estimate.output.amount,
                    cryptoAddress,
                    paymentDetails: orderDetails.paymentDetails
                })
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Crypto purchase order created',
            data: {
                reference,
                bityOrderId: orderResult.orderId,
                status: orderDetails.status,
                input: {
                    currency: fiatCurrency,
                    amount: estimate.input.amount
                },
                output: {
                    currency: cryptoCurrency,
                    amount: estimate.output.amount,
                    address: cryptoAddress
                },
                paymentDetails: orderDetails.paymentDetails,
                priceGuaranteedUntil: orderDetails.timestamps.priceGuaranteed,
                fees: estimate.priceBreakdown
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Buy crypto error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.error || 'Failed to create buy order',
            details: error.details
        });
    } finally {
        connection.release();
    }
});


/**
 * POST /api/crypto/sell
 * Sell cryptocurrency for fiat (BTC/ETH → CHF/EUR)
 */
router.post('/sell', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const {
            cryptoCurrency,    // BTC, ETH
            fiatCurrency,      // CHF, EUR
            cryptoAmount,      // Amount of crypto to sell
            fiatAmount,        // OR desired fiat amount
            // Bank account details for receiving fiat
            iban,
            bicSwift,
            ownerName,
            ownerAddress,
            ownerCity,
            ownerCountry,
            ownerZip,
            // Optional: source crypto address for verification
            sourceCryptoAddress,
            contactEmail
        } = req.body;

        // Validate input
        if (!cryptoCurrency || !fiatCurrency) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'cryptoCurrency and fiatCurrency are required'
            });
        }

        if (!cryptoAmount && !fiatAmount) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Either cryptoAmount or fiatAmount is required'
            });
        }

        if (!iban || !ownerName) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Bank account details (iban, ownerName) are required'
            });
        }

        // Validate IBAN format (basic check)
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
        if (!ibanRegex.test(iban.replace(/\s/g, '').toUpperCase())) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Invalid IBAN format'
            });
        }

        // Get estimate first
        const estimate = await bityExchange.estimateAmount({
            inputCurrency: cryptoCurrency,
            outputCurrency: fiatCurrency,
            inputAmount: cryptoAmount,
            outputAmount: fiatAmount
        });

        // Place order with Bity
        const orderResult = await bityExchange.placeOrder({
            inputCurrency: cryptoCurrency,
            outputCurrency: fiatCurrency,
            inputAmount: cryptoAmount || estimate.input.amount,
            inputCryptoAddress: sourceCryptoAddress,
            iban: iban.replace(/\s/g, '').toUpperCase(),
            bicSwift,
            ownerName,
            ownerAddress,
            ownerCity,
            ownerCountry,
            ownerZip,
            contactEmail
        });

        // Get order details
        const orderDetails = await bityExchange.getOrder(orderResult.orderId);

        // Create local transaction record
        const reference = `CRYPTO_SELL_${Date.now()}`;
        
        await connection.execute(
            `INSERT INTO transactions 
             (reference, external_reference, user_id, transaction_type, 
              amount, currency, status, description, metadata, created_at)
             VALUES (?, ?, ?, 'CRYPTO_SELL', ?, ?, 'PENDING', ?, ?, NOW())`,
            [
                reference,
                orderResult.orderId,
                userId,
                estimate.input.amount,
                cryptoCurrency,
                `Sell ${cryptoCurrency} for ${fiatCurrency}`,
                JSON.stringify({
                    bityOrderId: orderResult.orderId,
                    inputCurrency: cryptoCurrency,
                    outputCurrency: fiatCurrency,
                    inputAmount: estimate.input.amount,
                    outputAmount: estimate.output.amount,
                    destinationIban: iban,
                    paymentDetails: orderDetails.paymentDetails
                })
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Crypto sell order created',
            data: {
                reference,
                bityOrderId: orderResult.orderId,
                status: orderDetails.status,
                input: {
                    currency: cryptoCurrency,
                    amount: estimate.input.amount
                },
                output: {
                    currency: fiatCurrency,
                    amount: estimate.output.amount,
                    iban: iban
                },
                paymentDetails: orderDetails.paymentDetails,
                priceGuaranteedUntil: orderDetails.timestamps.priceGuaranteed,
                fees: estimate.priceBreakdown,
                instructions: orderDetails.paymentDetails?.type === 'crypto_address' 
                    ? `Send exactly ${estimate.input.amount} ${cryptoCurrency} to ${orderDetails.paymentDetails.crypto_address}`
                    : null
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Sell crypto error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.error || 'Failed to create sell order',
            details: error.details
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/crypto/order/:orderId
 * Get order status and details
 */
router.get('/order/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Verify user owns this order
        const [transactions] = await pool.execute(
            `SELECT id, reference, metadata FROM transactions 
             WHERE external_reference = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Get live status from Bity
        const orderDetails = await bityExchange.getOrder(orderId);

        // Update local transaction status if changed
        const newStatus = mapBityStatus(orderDetails.status);
        await pool.execute(
            `UPDATE transactions SET status = ?, updated_at = NOW() WHERE external_reference = ?`,
            [newStatus, orderId]
        );

        res.json({
            success: true,
            data: {
                localReference: transactions[0].reference,
                bityOrderId: orderId,
                status: orderDetails.status,
                input: orderDetails.input,
                output: orderDetails.output,
                paymentDetails: orderDetails.paymentDetails,
                timestamps: orderDetails.timestamps,
                messageToSign: orderDetails.messageToSign
            }
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: 'Failed to get order details'
        });
    }
});

/**
 * POST /api/crypto/order/:orderId/cancel
 * Cancel a pending order
 */
router.post('/order/:orderId/cancel', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Verify user owns this order
        const [transactions] = await pool.execute(
            `SELECT id FROM transactions 
             WHERE external_reference = ? AND user_id = ? AND status = 'PENDING'`,
            [orderId, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found or cannot be cancelled'
            });
        }

        // Cancel with Bity
        const result = await bityExchange.cancelOrder(orderId);

        if (result.success) {
            // Update local status
            await pool.execute(
                `UPDATE transactions SET status = 'CANCELLED', updated_at = NOW() 
                 WHERE external_reference = ?`,
                [orderId]
            );
        }

        res.json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel order'
        });
    }
});

/**
 * POST /api/crypto/order/:orderId/sign
 * Submit signature for crypto-to-crypto orders
 */
router.post('/order/:orderId/sign', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { signature } = req.body;
        const userId = req.user.id;

        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Signature is required'
            });
        }

        // Verify user owns this order
        const [transactions] = await pool.execute(
            `SELECT id FROM transactions WHERE external_reference = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Submit signature to Bity
        const result = await bityExchange.submitSignature(orderId, signature);

        res.json({
            success: result.success,
            message: result.message
        });

    } catch (error) {
        console.error('Submit signature error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit signature'
        });
    }
});

/**
 * GET /api/crypto/orders
 * List user's crypto orders
 */
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT id, reference, external_reference, transaction_type,
                   amount, currency, status, description, metadata,
                   created_at, updated_at
            FROM transactions
            WHERE user_id = ? AND transaction_type IN ('CRYPTO_BUY', 'CRYPTO_SELL')`;
        
        const params = [userId];

        if (status) {
            query += ` AND status = ?`;
            params.push(status.toUpperCase());
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await pool.execute(query, params);

        res.json({
            success: true,
            data: orders.map(o => ({
                id: o.id,
                reference: o.reference,
                bityOrderId: o.external_reference,
                type: o.transaction_type,
                amount: parseFloat(o.amount),
                currency: o.currency,
                status: o.status,
                description: o.description,
                details: o.metadata ? JSON.parse(o.metadata) : null,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            }))
        });

    } catch (error) {
        console.error('List orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list orders'
        });
    }
});

/**
 * GET /api/crypto/status
 * Check Bity API status and configuration
 */
router.get('/status', (req, res) => {
    const configured = bityExchange.isConfigured();
    
    res.json({
        success: true,
        data: {
            provider: 'Bity',
            configured,
            authenticated: configured,
            supportedFiat: ['CHF', 'EUR'],
            supportedCrypto: ['BTC', 'ETH', 'USDC'],
            features: {
                buyWithBankTransfer: true,
                buyWithCard: true,
                sellToBankAccount: true,
                cryptoToCrypto: true
            },
            documentation: 'https://doc.bity.com/exchange/'
        }
    });
});

// Helper function to map Bity status to local status
function mapBityStatus(bityStatus) {
    const statusMap = {
        'PENDING': 'PENDING',
        'AWAITING_SIGNATURE': 'PENDING',
        'AWAITING_PAYMENT': 'PENDING',
        'PROCESSING': 'PROCESSING',
        'COMPLETED': 'COMPLETED',
        'CANCELLED': 'CANCELLED'
    };
    return statusMap[bityStatus] || 'PENDING';
}

module.exports = router;
