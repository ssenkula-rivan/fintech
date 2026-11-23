/**
 * Production Logger Service
 * Structured logging with levels, no sensitive data exposure
 */

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize data to remove sensitive fields
 */
function sanitize(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = [
        'password', 'pin', 'secret', 'token', 'key', 'mnemonic',
        'privateKey', 'private_key', 'authorization', 'cookie'
    ];
    
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(f => lowerKey.includes(f))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }
    
    return sanitized;
}

/**
 * Format log entry
 */
function formatLog(level, message, meta = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...sanitize(meta)
    };
    
    if (isProduction) {
        return JSON.stringify(entry);
    }
    
    return `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(sanitize(meta)) : ''}`;
}

const logger = {
    error(message, meta = {}) {
        if (currentLevel >= LOG_LEVELS.error) {
            console.error(formatLog('error', message, meta));
        }
    },
    
    warn(message, meta = {}) {
        if (currentLevel >= LOG_LEVELS.warn) {
            console.warn(formatLog('warn', message, meta));
        }
    },
    
    info(message, meta = {}) {
        if (currentLevel >= LOG_LEVELS.info) {
            console.info(formatLog('info', message, meta));
        }
    },
    
    debug(message, meta = {}) {
        if (currentLevel >= LOG_LEVELS.debug) {
            console.log(formatLog('debug', message, meta));
        }
    },
    
    // HTTP request logger middleware
    requestLogger(req, res, next) {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info('HTTP Request', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip
            });
        });
        
        next();
    }
};

module.exports = logger;
