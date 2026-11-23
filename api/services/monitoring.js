/**
 * Application Monitoring Service
 * Tracks metrics, health, and alerts
 */

const os = require('os');

// Metrics storage
const metrics = {
    requests: { total: 0, success: 0, failed: 0 },
    transactions: { total: 0, success: 0, failed: 0, volume: 0 },
    auth: { logins: 0, failures: 0, otpSent: 0 },
    errors: [],
    responseTime: [],
    startTime: Date.now()
};

// Alert thresholds
const THRESHOLDS = {
    errorRate: 0.05,           // 5% error rate
    responseTime: 2000,        // 2 seconds
    memoryUsage: 0.85,         // 85% memory
    failedLogins: 10,          // per minute
    transactionFailRate: 0.1   // 10% transaction failures
};

/**
 * Record API request
 */
function recordRequest(success, responseTime, path) {
    metrics.requests.total++;
    if (success) {
        metrics.requests.success++;
    } else {
        metrics.requests.failed++;
    }
    
    // Keep last 1000 response times
    metrics.responseTime.push({ time: responseTime, path, timestamp: Date.now() });
    if (metrics.responseTime.length > 1000) {
        metrics.responseTime.shift();
    }
    
    checkAlerts();
}

/**
 * Record transaction
 */
function recordTransaction(success, amount = 0, type = 'unknown') {
    metrics.transactions.total++;
    if (success) {
        metrics.transactions.success++;
        metrics.transactions.volume += amount;
    } else {
        metrics.transactions.failed++;
    }
    
    checkAlerts();
}

/**
 * Record authentication event
 */
function recordAuth(event, success = true) {
    if (event === 'login') {
        metrics.auth.logins++;
        if (!success) metrics.auth.failures++;
    } else if (event === 'otp') {
        metrics.auth.otpSent++;
    }
    
    checkAlerts();
}

/**
 * Record error
 */
function recordError(error, context = {}) {
    metrics.errors.push({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
    });
    
    // Keep last 100 errors
    if (metrics.errors.length > 100) {
        metrics.errors.shift();
    }
}

/**
 * Check alert conditions
 */
function checkAlerts() {
    const alerts = [];
    
    // Error rate
    if (metrics.requests.total > 100) {
        const errorRate = metrics.requests.failed / metrics.requests.total;
        if (errorRate > THRESHOLDS.errorRate) {
            alerts.push({ type: 'HIGH_ERROR_RATE', value: errorRate, threshold: THRESHOLDS.errorRate });
        }
    }
    
    // Response time
    const recentTimes = metrics.responseTime.slice(-100);
    if (recentTimes.length > 0) {
        const avgTime = recentTimes.reduce((a, b) => a + b.time, 0) / recentTimes.length;
        if (avgTime > THRESHOLDS.responseTime) {
            alerts.push({ type: 'SLOW_RESPONSE', value: avgTime, threshold: THRESHOLDS.responseTime });
        }
    }
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedRatio = memUsage.heapUsed / totalMem;
    if (usedRatio > THRESHOLDS.memoryUsage) {
        alerts.push({ type: 'HIGH_MEMORY', value: usedRatio, threshold: THRESHOLDS.memoryUsage });
    }
    
    // Transaction failure rate
    if (metrics.transactions.total > 10) {
        const failRate = metrics.transactions.failed / metrics.transactions.total;
        if (failRate > THRESHOLDS.transactionFailRate) {
            alerts.push({ type: 'HIGH_TXN_FAILURE', value: failRate, threshold: THRESHOLDS.transactionFailRate });
        }
    }
    
    // Log alerts
    alerts.forEach(alert => {
        console.warn(`[ALERT] ${alert.type}: ${(alert.value * 100).toFixed(2)}% (threshold: ${(alert.threshold * 100).toFixed(2)}%)`);
    });
    
    return alerts;
}

/**
 * Get system health
 */
function getHealth() {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - metrics.startTime;
    
    return {
        status: 'healthy',
        uptime: Math.floor(uptime / 1000),
        memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: os.loadavg(),
        requests: metrics.requests,
        transactions: metrics.transactions,
        auth: metrics.auth,
        recentErrors: metrics.errors.slice(-5).map(e => ({
            message: e.message,
            timestamp: new Date(e.timestamp).toISOString()
        }))
    };
}

/**
 * Get detailed metrics
 */
function getMetrics() {
    const recentTimes = metrics.responseTime.slice(-100);
    const avgResponseTime = recentTimes.length > 0
        ? recentTimes.reduce((a, b) => a + b.time, 0) / recentTimes.length
        : 0;
    
    return {
        requests: {
            ...metrics.requests,
            errorRate: metrics.requests.total > 0 
                ? (metrics.requests.failed / metrics.requests.total * 100).toFixed(2) + '%'
                : '0%'
        },
        transactions: {
            ...metrics.transactions,
            successRate: metrics.transactions.total > 0
                ? (metrics.transactions.success / metrics.transactions.total * 100).toFixed(2) + '%'
                : '0%',
            volumeFormatted: `UGX ${metrics.transactions.volume.toLocaleString()}`
        },
        performance: {
            avgResponseTime: Math.round(avgResponseTime),
            p95ResponseTime: calculatePercentile(recentTimes.map(r => r.time), 95),
            p99ResponseTime: calculatePercentile(recentTimes.map(r => r.time), 99)
        },
        auth: metrics.auth,
        alerts: checkAlerts()
    };
}

function calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[index]);
}

/**
 * Express middleware for request tracking
 */
const requestTracker = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const success = res.statusCode < 400;
        recordRequest(success, duration, req.path);
    });
    
    next();
};

/**
 * Reset metrics (for testing)
 */
function resetMetrics() {
    metrics.requests = { total: 0, success: 0, failed: 0 };
    metrics.transactions = { total: 0, success: 0, failed: 0, volume: 0 };
    metrics.auth = { logins: 0, failures: 0, otpSent: 0 };
    metrics.errors = [];
    metrics.responseTime = [];
}

module.exports = {
    recordRequest,
    recordTransaction,
    recordAuth,
    recordError,
    getHealth,
    getMetrics,
    requestTracker,
    resetMetrics,
    checkAlerts
};
