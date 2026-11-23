const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database pool for role lookups
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmg_uganda',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

// Load public key for verification
let publicKey;
try {
    publicKey = fs.readFileSync(
        process.env.JWT_PUBLIC_KEY_PATH || path.join(__dirname, '../keys/public.key'),
        'utf8'
    );
} catch (err) {
    console.error('Failed to load JWT public key:', err.message);
    publicKey = null;
}

// CRITICAL: No fallback secrets allowed
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }
    return secret;
};

/**
 * Authenticate JWT Token Middleware
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required',
            message: 'Please provide a valid access token'
        });
    }

    try {
        let decoded;
        
        if (publicKey) {
            // RS256 verification
            decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        } else {
            // HS256 with validated secret - NO FALLBACK
            decoded = jwt.verify(token, getJWTSecret());
        }

        // Check token type
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token type',
                message: 'Please use an access token'
            });
        }

        // Attach user to request
        req.user = {
            id: decoded.id,
            phone: decoded.phone,
            role: decoded.role || null
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Your session has expired. Please login again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }

        console.error('Token verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional Authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        let decoded;
        
        if (publicKey) {
            decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        } else {
            decoded = jwt.verify(token, getJWTSecret());
        }

        req.user = {
            id: decoded.id,
            phone: decoded.phone,
            role: decoded.role || null
        };
    } catch (error) {
        req.user = null;
    }

    next();
};

/**
 * Require specific user role (from token)
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};

/**
 * Require Admin Role - Database lookup for admin verification
 * More secure than token-based role check
 */
const requireAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        // Verify admin status from database (not just token)
        const [users] = await pool.execute(
            `SELECT role FROM users WHERE id = ? AND status = 'ACTIVE'`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        const userRole = users[0].role;
        
        if (!userRole || !['ADMIN', 'SUPERADMIN'].includes(userRole.toUpperCase())) {
            // Log unauthorized admin access attempt
            console.warn(`[SECURITY] Unauthorized admin access attempt by user ${req.user.id}`);
            
            return res.status(403).json({
                success: false,
                error: 'Admin access required',
                message: 'You do not have administrator privileges'
            });
        }

        // Attach verified role to request
        req.user.role = userRole;
        req.user.isAdmin = true;
        
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authorization check failed'
        });
    }
};

/**
 * Require Superadmin Role - Highest privilege level
 */
const requireSuperAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    try {
        const [users] = await pool.execute(
            `SELECT role FROM users WHERE id = ? AND status = 'ACTIVE'`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        if (users[0].role?.toUpperCase() !== 'SUPERADMIN') {
            console.warn(`[SECURITY] Unauthorized superadmin access attempt by user ${req.user.id}`);
            
            return res.status(403).json({
                success: false,
                error: 'Superadmin access required'
            });
        }

        req.user.role = 'SUPERADMIN';
        req.user.isSuperAdmin = true;
        
        next();
    } catch (error) {
        console.error('Superadmin verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authorization check failed'
        });
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireSuperAdmin,
    getJWTSecret
};
