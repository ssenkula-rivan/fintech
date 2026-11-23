/**
 * API v1 Router
 * Versioned API endpoints for backward compatibility
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('../auth');
const walletRoutes = require('../wallet');
const transactionsRoutes = require('../transactions');
const dashboardRoutes = require('../dashboard');
const beneficiariesRoutes = require('../beneficiaries');
const kycRoutes = require('../kyc');
const currencyRoutes = require('../currency');
const cryptoRoutes = require('../crypto');
const cryptoWalletRoutes = require('../cryptoWallet');
const notificationsRoutes = require('../notifications');
const billsRoutes = require('../bills');
const tradingRoutes = require('../trading');

// Mount v1 routes
router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/beneficiaries', beneficiariesRoutes);
router.use('/kyc', kycRoutes);
router.use('/currency', currencyRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/crypto-wallet', cryptoWalletRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/bills', billsRoutes);
router.use('/trading', tradingRoutes);

// v1 API info
router.get('/', (req, res) => {
    res.json({
        version: '1.0.0',
        status: 'stable',
        endpoints: {
            auth: '/v1/auth',
            wallet: '/v1/wallet',
            transactions: '/v1/transactions',
            dashboard: '/v1/dashboard',
            beneficiaries: '/v1/beneficiaries',
            kyc: '/v1/kyc',
            currency: '/v1/currency',
            crypto: '/v1/crypto',
            cryptoWallet: '/v1/crypto-wallet',
            notifications: '/v1/notifications',
            bills: '/v1/bills',
            trading: '/v1/trading'
        },
        deprecation: null
    });
});

module.exports = router;
