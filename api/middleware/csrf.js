/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');

// Token store (use Redis in production for distributed systems)
const tokenStore = new Map();

// Token expiry: 1 hour
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate CSRF token
 */
function generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(token, {
        sessionId,
        createdAt: Date.now()
    });
    return token;
}

/**
 * Validate CSRF token
 */
function validateToken(token, sessionId) {
    const stored = tokenStore.get(token);
    if (!stored) return false;
    
    // Check expiry
    if (Date.now() - stored.createdAt > TOKEN_EXPIRY) {
        tokenStore.delete(token);
        return false;
    }
    
    // Check session match
    if (stored.sessionId !== sessionId) return false;
    
    // Single use - delete after validation
    tokenStore.delete(token);
    return true;
}

/**
 * Cleanup expired tokens (run periodically)
 */
function cleanupTokens() {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
        if (now - data.createdAt > TOKEN_EXPIRY) {
            tokenStore.delete(token);
        }
    }
}

// Cleanup every 10 minutes (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
    setInterval(cleanupTokens, 10 * 60 * 1000);
}

/**
 * CSRF Protection Middleware
 */
const csrfProtection = (req, res, next) => {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    // Skip for API calls with Bearer token (already authenticated)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return next();
    }
    
    // Skip for webhooks (they have their own signature verification)
    if (req.path.includes('/webhooks/')) {
        return next();
    }
    
    // Check CSRF token
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (!token || !sessionId) {
        return res.status(403).json({
            success: false,
            error: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token required'
        });
    }
    
    if (!validateToken(token, sessionId)) {
        return res.status(403).json({
            success: false,
            error: 'CSRF_TOKEN_INVALID',
            message: 'Invalid or expired CSRF token'
        });
    }
    
    next();
};

/**
 * Generate CSRF token endpoint handler
 */
const csrfTokenHandler = (req, res) => {
    const sessionId = req.headers['x-session-id'] || crypto.randomBytes(16).toString('hex');
    const token = generateToken(sessionId);
    
    res.json({
        success: true,
        data: {
            csrfToken: token,
            sessionId,
            expiresIn: TOKEN_EXPIRY / 1000
        }
    });
};

module.exports = {
    csrfProtection,
    csrfTokenHandler,
    generateToken,
    validateToken
};
