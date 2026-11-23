const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Validate environment variables before starting
const { validateEnvironment } = require('./config/validateEnv');
validateEnvironment();

// Import structured logger early for use throughout
const { log, httpLogger } = require('./services/structuredLogger');

const app = express();

// Security headers (helmet)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false
}));

// CORS with environment-based origins - Allow all in development
const corsOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://app.gmguganda.com,https://api.gmguganda.com').split(',')
    : true; // Allow all origins in development

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database pool configuration (production-ready)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmg_uganda',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20'),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    // Connection timeout
    connectTimeout: 30000,
    // Timezone handling
    timezone: '+00:00',
    // Character set
    charset: 'utf8mb4'
};

// Create database pool
const pool = mysql.createPool(dbConfig);

// Database connection with retry logic
async function connectWithRetry(maxRetries = 10, delay = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const conn = await pool.getConnection();
            await conn.execute('SELECT 1');
            conn.release();
            log.info('Database connected successfully', { 
                component: 'database',
                host: dbConfig.host,
                database: dbConfig.database,
                attempt
            });
            return true;
        } catch (err) {
            log.warn(`Database connection attempt ${attempt}/${maxRetries} failed`, {
                component: 'database',
                error: err.code || err.message,
                host: dbConfig.host
            });
            
            if (attempt === maxRetries) {
                log.error('Database connection failed after all retries', {
                    component: 'database',
                    error: err.message
                });
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

// Initialize database connection
connectWithRetry();

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const { requestTracker, getHealth, getMetrics } = require('./services/monitoring');
const { csrfTokenHandler } = require('./middleware/csrf');

// Apply global rate limiter
app.use(globalLimiter);

// Request tracking for monitoring
app.use(requestTracker);

// Serve uploaded files (profile photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Structured HTTP logging
app.use(httpLogger);

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transactionsRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const beneficiariesRoutes = require('./routes/beneficiaries');
const webhooksRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const kycRoutes = require('./routes/kyc');
const currencyRoutes = require('./routes/currency');
const cryptoRoutes = require('./routes/crypto');
const cryptoWalletRoutes = require('./routes/cryptoWallet');
const notificationsRoutes = require('./routes/notifications');
const billsRoutes = require('./routes/bills');
const tradingRoutes = require('./routes/trading');
const exchangeRoutes = require('./routes/exchange');
const appRoutes = require('./routes/app');
const userRoutes = require('./routes/user');
const v1Router = require('./routes/v1');

// Mount routes
app.use('/api/app', appRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/crypto-wallet', cryptoWalletRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/exchange', exchangeRoutes);

// Blockchain/Crypto trading routes
const { router: blockchainRoutes, initController: initBlockchain } = require('./routes/blockchain');
initBlockchain(pool);
app.use('/api/blockchain', blockchainRoutes);

// API v1 (versioned routes for backward compatibility)
app.use('/api/v1', v1Router);

// Health check
app.get('/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1');
        const health = getHealth();
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            ...health
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Metrics endpoint (protected in production)
app.get('/metrics', (req, res) => {
    // In production, require admin auth
    if (process.env.NODE_ENV === 'production') {
        const authHeader = req.headers.authorization;
        const metricsKey = process.env.METRICS_API_KEY;
        if (!metricsKey || authHeader !== `Bearer ${metricsKey}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    res.json(getMetrics());
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenHandler);

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'GMG Global API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            wallet: '/api/wallet',
            transactions: '/api/transactions',
            dashboard: '/api/dashboard',
            beneficiaries: '/api/beneficiaries',
            webhooks: '/api/webhooks',
            currency: '/api/currency',
            crypto: '/api/crypto',
            cryptoWallet: '/api/crypto-wallet',
            trading: '/api/trading',
            exchange: '/api/exchange'
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server (only if not in test mode)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        log.info('Server started', {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version
        });
    });
}

// Export for testing
module.exports = { app, pool };
