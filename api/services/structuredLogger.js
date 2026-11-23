/**
 * Structured Logger Service
 * Production-grade logging with proper levels and formatting
 * Logs are JSON-formatted for easy parsing by log aggregators
 */

const winston = require('winston');
const path = require('path');

// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : (process.env.LOG_LEVEL || 'info');
};

// Custom format for structured logging
const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
    })
);

// Create transports
const transports = [];

// Console transport (always)
transports.push(
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat
    })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
    const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
    
    // Ensure log directory exists
    const fs = require('fs');
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Error log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                format: structuredFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            })
        );
        
        // Combined log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                format: structuredFormat,
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5
            })
        );
    } catch (err) {
        console.warn('Could not create log directory, using console only:', err.message);
    }
}

// Create logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false
});

// Sanitize sensitive data from logs
function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = ['password', 'pin', 'token', 'secret', 'authorization', 'cookie', 'pin_hash', 'cvv'];
    const sanitized = { ...obj };
    
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(s => lowerKey.includes(s))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }
    
    return sanitized;
}

// Wrapper functions with context
const log = {
    error: (message, meta = {}) => logger.error(message, sanitize(meta)),
    warn: (message, meta = {}) => logger.warn(message, sanitize(meta)),
    info: (message, meta = {}) => logger.info(message, sanitize(meta)),
    http: (message, meta = {}) => logger.http(message, sanitize(meta)),
    debug: (message, meta = {}) => logger.debug(message, sanitize(meta)),
    
    // Specialized loggers
    auth: (action, userId, success, meta = {}) => {
        logger.info(`AUTH: ${action}`, sanitize({
            action,
            userId,
            success,
            ...meta,
            category: 'auth'
        }));
    },
    
    transaction: (action, txnId, userId, amount, meta = {}) => {
        logger.info(`TXN: ${action}`, sanitize({
            action,
            transactionId: txnId,
            userId,
            amount,
            ...meta,
            category: 'transaction'
        }));
    },
    
    security: (event, severity, meta = {}) => {
        const logFn = severity === 'high' ? logger.error : logger.warn;
        logFn(`SECURITY: ${event}`, sanitize({
            event,
            severity,
            ...meta,
            category: 'security'
        }));
    },
    
    api: (method, path, statusCode, duration, meta = {}) => {
        logger.http(`${method} ${path} ${statusCode} ${duration}ms`, sanitize({
            method,
            path,
            statusCode,
            duration,
            ...meta,
            category: 'api'
        }));
    }
};

// Express middleware for HTTP logging
const httpLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        log.api(req.method, req.path, res.statusCode, duration, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id
        });
    });
    
    next();
};

module.exports = {
    logger,
    log,
    httpLogger,
    sanitize
};
