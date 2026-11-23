/**
 * IP Whitelist Middleware
 * Restricts admin routes to specific IP addresses
 */

// Load whitelist from environment
const getWhitelist = () => {
    const whitelist = process.env.ADMIN_IP_WHITELIST || '';
    return whitelist.split(',').map(ip => ip.trim()).filter(Boolean);
};

// Check if IP matches (supports CIDR notation)
function ipMatches(clientIp, pattern) {
    // Exact match
    if (clientIp === pattern) return true;
    
    // CIDR match (e.g., 192.168.1.0/24)
    if (pattern.includes('/')) {
        const [network, bits] = pattern.split('/');
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        const clientNum = ipToNumber(clientIp);
        const networkNum = ipToNumber(network);
        return (clientNum & mask) === (networkNum & mask);
    }
    
    // Wildcard match (e.g., 192.168.1.*)
    if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+') + '$');
        return regex.test(clientIp);
    }
    
    return false;
}

function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Get client IP from request
 */
function getClientIp(req) {
    // Check X-Forwarded-For header (behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    // Check X-Real-IP header (nginx)
    const realIp = req.headers['x-real-ip'];
    if (realIp) return realIp;
    
    // Direct connection
    return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
}

/**
 * IP Whitelist Middleware for Admin Routes
 */
const adminIpWhitelist = (req, res, next) => {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    const whitelist = getWhitelist();
    
    // If no whitelist configured, allow all (with warning)
    if (whitelist.length === 0) {
        console.warn('[SECURITY] ADMIN_IP_WHITELIST not configured - admin routes accessible from any IP');
        return next();
    }
    
    const clientIp = getClientIp(req);
    
    // Check if IP is whitelisted
    const isAllowed = whitelist.some(pattern => ipMatches(clientIp, pattern));
    
    if (!isAllowed) {
        console.warn(`[SECURITY] Blocked admin access from IP: ${clientIp}`);
        return res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Access denied from this IP address'
        });
    }
    
    next();
};

/**
 * Log all admin access attempts
 */
const adminAccessLogger = (req, res, next) => {
    const clientIp = getClientIp(req);
    const userId = req.user?.id || 'anonymous';
    
    console.log(`[ADMIN ACCESS] ${req.method} ${req.path} | IP: ${clientIp} | User: ${userId}`);
    
    next();
};

module.exports = {
    adminIpWhitelist,
    adminAccessLogger,
    getClientIp
};
