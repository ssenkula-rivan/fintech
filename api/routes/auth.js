const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Note: bcrypt removed - PIN verification is in transactions.js

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

// In-memory OTP storage (fallback when Redis unavailable)
const otpStore = new Map();

// Load JWT RSA keys (optional - for RS256 algorithm)
let privateKey = null;
let publicKey = null;
try {
    privateKey = fs.readFileSync(path.join(__dirname, '../keys/private.key'), 'utf8');
    publicKey = fs.readFileSync(path.join(__dirname, '../keys/public.key'), 'utf8');
    console.log('✓ JWT RSA keys loaded');
} catch (err) {
    console.warn('⚠ JWT RSA keys not found, will use secret-based JWT');
}

// JWT Secret validation - ZERO TOLERANCE FOR WEAK SECRETS
const JWT_SECRET = process.env.JWT_SECRET;

// Rule 1: Must have either JWT_SECRET or RSA keys
if (!JWT_SECRET && !privateKey) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('FATAL ERROR: Authentication cannot be initialized');
    console.error('');
    console.error('You must provide ONE of the following:');
    console.error('  1. JWT_SECRET environment variable (minimum 32 characters)');
    console.error('  2. RSA key pair in api/keys/ directory');
    console.error('');
    console.error('To generate a secure JWT_SECRET, run:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
}

// Rule 2: If JWT_SECRET is provided (even empty string), validate it
if (JWT_SECRET !== undefined) {
    if (JWT_SECRET.length === 0) {
        console.error('FATAL: JWT_SECRET cannot be empty');
        process.exit(1);
    }
    
    if (JWT_SECRET.length < 32) {
        console.error('FATAL: JWT_SECRET must be at least 32 characters');
        console.error('Current length:', JWT_SECRET.length);
        console.error('Required: 32+ characters (64+ recommended)');
        process.exit(1);
    }
    
    // Rule 3: Production requires stronger secret
    if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 64) {
        console.error('FATAL: JWT_SECRET must be at least 64 characters in production');
        console.error('Current length:', JWT_SECRET.length);
        process.exit(1);
    }
    
    console.log('✓ JWT_SECRET validated (' + JWT_SECRET.length + ' characters)');
}

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique ID
function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Sign JWT token
function signToken(payload, expiresIn = '24h') {
    if (privateKey) {
        return jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn,
            issuer: 'gmg-uganda'
        });
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn, issuer: 'gmg-uganda' });
}

// Verify JWT token
function verifyToken(token) {
    if (publicKey) {
        return jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: 'gmg-uganda' });
    }
    return jwt.verify(token, JWT_SECRET, { issuer: 'gmg-uganda' });
}

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number via SMS or WhatsApp
 * @param {string} phone - Phone number with country code
 * @param {string} channel - 'sms' (default) or 'whatsapp'
 */
router.post('/send-otp', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { phone, channel = 'sms' } = req.body;

        // Validate phone
        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number required'
            });
        }

        // Accept any phone format with country code (African countries)
        // Format: +XXX followed by 6-12 digits
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone format',
                message: 'Please enter a valid phone number with country code'
            });
        }

        // Normalize phone - ensure it starts with +
        let normalizedPhone = cleanPhone;
        if (!normalizedPhone.startsWith('+')) {
            normalizedPhone = '+' + normalizedPhone;
        }

        // Check if user exists (optional for Google sign-in flow)
        const [users] = await connection.execute(
            `SELECT id, phone, first_name, last_name, status 
             FROM users 
             WHERE phone = ?`,
            [normalizedPhone]
        );

        // For WhatsApp channel (Google sign-in), allow new users
        // For SMS channel (direct login), require existing user
        if (users.length === 0 && channel !== 'whatsapp') {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'No account found with this phone number'
            });
        }

        if (users.length > 0) {
            const user = users[0];
            // Check account status for existing users
            if (user.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    error: 'Account inactive',
                    message: `Your account is ${user.status.toLowerCase()}`
                });
            }
        }

        // Check rate limit - max 1 OTP per minute per phone
        const [recentOtp] = await connection.execute(
            `SELECT id FROM otp_codes 
             WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
             LIMIT 1`,
            [normalizedPhone]
        );
        
        if (recentOtp.length > 0) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: 'Please wait 1 minute before requesting another OTP'
            });
        }

        // Cleanup old expired OTPs for this phone (prevent table bloat)
        await connection.execute(
            `DELETE FROM otp_codes WHERE phone = ? AND (expires_at < NOW() OR verified = TRUE)`,
            [normalizedPhone]
        );

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in database
        await connection.execute(
            `INSERT INTO otp_codes (phone, code, type, expires_at)
             VALUES (?, ?, 'LOGIN', ?)`,
            [normalizedPhone, otp, expiresAt]
        );

        // Also store in memory (backup)
        otpStore.set(`otp:${normalizedPhone}`, {
            code: otp,
            expiresAt: expiresAt.getTime()
        });

        // Send OTP via SMS or WhatsApp
        try {
            const smsService = require('../services/sms');
            if (channel === 'whatsapp') {
                await smsService.sendWhatsAppOTP(normalizedPhone, otp, 'LOGIN');
                console.log(`[WHATSAPP] OTP sent to ${normalizedPhone}`);
            } else {
                await smsService.sendOTP(normalizedPhone, otp, 'LOGIN');
                console.log(`[SMS] OTP sent to ${normalizedPhone}`);
            }
        } catch (smsError) {
            console.error(`[${channel.toUpperCase()}] Failed to send OTP:`, smsError.message);
            // Continue anyway - OTP is stored, user can retry
        }

        // For development, also log OTP to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] OTP for ${normalizedPhone}: ${otp}`);
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                phone: normalizedPhone,
                expiresIn: 300,
                expiresAt: expiresAt.toISOString()
            }
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login
 */
router.post('/verify-otp', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { phone, otp } = req.body;

        // Validate input
        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Phone and OTP required'
            });
        }

        // DEVELOPMENT/TESTING MODE: Accept 123456 as valid OTP for testing
        // Enable with NODE_ENV !== 'production' OR ALLOW_TEST_OTP=true
        const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_OTP === 'true';
        const isTestOtp = isDevelopment && otp === '123456';

        // Normalize phone
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '256' + normalizedPhone.substring(1);
        }
        if (!normalizedPhone.startsWith('256')) {
            normalizedPhone = '256' + normalizedPhone;
        }
        normalizedPhone = '+' + normalizedPhone;

        // Check OTP in database
        const [otpRecords] = await connection.execute(
            `SELECT id, code, attempts, expires_at, verified
             FROM otp_codes 
             WHERE phone = ? AND type = 'LOGIN' AND verified = FALSE
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedPhone]
        );

        // DEVELOPMENT: Skip OTP validation if test OTP
        if (!isTestOtp) {
            if (otpRecords.length === 0) {
                // Check memory fallback
                const memoryOtp = otpStore.get(`otp:${normalizedPhone}`);
                if (!memoryOtp || memoryOtp.expiresAt < Date.now()) {
                    return res.status(400).json({
                        success: false,
                        error: 'OTP expired',
                        message: 'Please request a new OTP'
                    });
                }
                if (memoryOtp.code !== otp) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid OTP'
                    });
                }
                otpStore.delete(`otp:${normalizedPhone}`);
            } else {
                const otpRecord = otpRecords[0];

                // Check expiry
                if (new Date(otpRecord.expires_at) < new Date()) {
                    return res.status(400).json({
                        success: false,
                    error: 'OTP expired',
                    message: 'Please request a new OTP'
                });
            }

            // Check attempts
            if (otpRecord.attempts >= 3) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many attempts',
                    message: 'Please request a new OTP'
                });
            }

            // Verify OTP (skip if test OTP in development)
            if (otpRecord.code !== otp && !isTestOtp) {
                await connection.execute(
                    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`,
                    [otpRecord.id]
                );
                return res.status(401).json({
                    success: false,
                    error: 'Invalid OTP',
                    attemptsRemaining: 2 - otpRecord.attempts
                });
            }

                // Mark OTP as verified
                await connection.execute(
                    `UPDATE otp_codes SET verified = TRUE WHERE id = ?`,
                    [otpRecord.id]
                );
            }
        }

        // Get user
        const [users] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name, 
                    kyc_tier, kyc_status, status, created_at
             FROM users WHERE phone = ?`,
            [normalizedPhone]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        // Update last login
        await connection.execute(
            `UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        const refreshToken = signToken({
            id: user.id,
            type: 'refresh'
        }, '30d');

        // Store refresh token
        await connection.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [user.id, refreshToken]
        );

        // Get wallet balance
        const [wallets] = await connection.execute(
            `SELECT currency, balance, status FROM wallets WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400,
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    status: user.status
                },
                wallets: wallets.map(w => ({
                    currency: w.currency,
                    balance: parseFloat(w.balance),
                    status: w.status
                }))
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/validate
 * Validate access token
 */
router.post('/validate', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token required'
            });
        }

        const decoded = verifyToken(token);

        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token type'
            });
        }

        // Get user from database
        const [users] = await pool.execute(
            `SELECT id, phone, email, first_name, last_name, 
                    kyc_tier, kyc_status, status
             FROM users WHERE id = ?`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        res.json({
            success: true,
            valid: true,
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    status: user.status
                },
                token: {
                    issuedAt: new Date(decoded.iat * 1000).toISOString(),
                    expiresAt: new Date(decoded.exp * 1000).toISOString()
                }
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        console.error('Validate error:', error);
        res.status(500).json({
            success: false,
            error: 'Validation failed'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token required'
            });
        }

        const decoded = verifyToken(refreshToken);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token type'
            });
        }

        // Verify token exists in database
        const [tokens] = await connection.execute(
            `SELECT id FROM refresh_tokens 
             WHERE user_id = ? AND token = ? AND revoked = FALSE AND expires_at > NOW()`,
            [decoded.id, refreshToken]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        // Get user
        const [users] = await connection.execute(
            `SELECT id, phone, status FROM users WHERE id = ?`,
            [decoded.id]
        );

        if (users.length === 0 || users[0].status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        const user = users[0];

        // Generate new access token
        const newAccessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                expiresIn: 86400
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Refresh token expired'
            });
        }
        console.error('Refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/logout
 * Logout and revoke tokens
 */
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = verifyToken(token);
                // Revoke all refresh tokens for user
                await pool.execute(
                    `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?`,
                    [decoded.id]
                );
            } catch (e) {
                // Token invalid, but still logout
            }
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.json({
            success: true,
            message: 'Logged out'
        });
    }
});

/**
 * POST /api/auth/google
 * Google Sign-In authentication with real token verification
 */
router.post('/google', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { credential, email, name, picture } = req.body;

        let verifiedEmail = email;
        let verifiedName = name;

        // Verify Google credential if provided
        if (credential) {
            try {
                const { OAuth2Client } = require('google-auth-library');
                const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                
                const payload = ticket.getPayload();
                verifiedEmail = payload.email;
                verifiedName = payload.name;
                
                console.log('[GOOGLE] Verified user:', verifiedEmail);
            } catch (verifyError) {
                console.error('[GOOGLE] Token verification failed:', verifyError.message);
                // Fall back to provided email if verification fails
            }
        }

        if (!verifiedEmail) {
            return res.status(400).json({
                success: false,
                error: 'Email required'
            });
        }

        // Check if user exists by email
        let [users] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
             FROM users WHERE email = ?`,
            [verifiedEmail]
        );

        let user;
        let isNewUser = false;

        if (users.length === 0) {
            // Create new user with Google account
            const nameParts = (verifiedName || 'Google User').split(' ');
            const firstName = nameParts[0] || 'Google';
            const lastName = nameParts.slice(1).join(' ') || 'User';
            
            // Generate a placeholder phone for Google users
            const placeholderPhone = `+256700${Date.now().toString().slice(-6)}`;

            await connection.execute(
                `INSERT INTO users (phone, email, first_name, last_name, status, kyc_tier, kyc_status)
                 VALUES (?, ?, ?, ?, 'ACTIVE', 1, 'PENDING')`,
                [placeholderPhone, verifiedEmail, firstName, lastName]
            );

            const [newUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE email = ?`,
                [verifiedEmail]
            );
            user = newUser[0];
            isNewUser = true;

            // Create wallet for new user
            await connection.execute(
                `INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'UGX', 0.00)`,
                [user.id]
            );

            // Welcome notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, 'Welcome to GMG Global!', 'Your account has been created. Add your phone number to enable all features.', 'SYSTEM')`,
                [user.id]
            );
        } else {
            user = users[0];
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        // Update last login
        await connection.execute(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        const refreshToken = signToken({
            id: user.id,
            type: 'refresh'
        }, '30d');

        // Store refresh token
        await connection.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [user.id, refreshToken]
        );

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT currency, balance FROM wallets WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400,
                isNewUser,
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    status: user.status
                },
                wallets: wallets.map(w => ({
                    currency: w.currency,
                    balance: parseFloat(w.balance)
                }))
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/google-with-phone
 * Google Sign-In with phone verification (WhatsApp OTP)
 * Flow: Google Auth → Phone Input → WhatsApp OTP → Complete Registration
 */
router.post('/google-with-phone', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { email, name, picture, googleId, phone, otp } = req.body;

        // Validate required fields
        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                error: 'Google account data required'
            });
        }

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Phone and OTP required'
            });
        }

        // Normalize phone
        let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!normalizedPhone.startsWith('+')) {
            normalizedPhone = '+' + normalizedPhone;
        }

        // Verify OTP
        const [otpRecords] = await connection.execute(
            `SELECT id, code, attempts, expires_at, verified
             FROM otp_codes 
             WHERE phone = ? AND type = 'LOGIN' AND verified = FALSE
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedPhone]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'OTP expired or not found',
                message: 'Please request a new OTP'
            });
        }

        const otpRecord = otpRecords[0];

        // Check expiry
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'OTP expired',
                message: 'Please request a new OTP'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            return res.status(429).json({
                success: false,
                error: 'Too many attempts',
                message: 'Please request a new OTP'
            });
        }

        // Verify OTP code
        if (otpRecord.code !== otp) {
            await connection.execute(
                `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`,
                [otpRecord.id]
            );
            return res.status(401).json({
                success: false,
                error: 'Invalid OTP',
                attemptsRemaining: 2 - otpRecord.attempts
            });
        }

        // Mark OTP as verified
        await connection.execute(
            `UPDATE otp_codes SET verified = TRUE WHERE id = ?`,
            [otpRecord.id]
        );

        // Check if user exists by email or phone
        let [existingUsers] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
             FROM users WHERE email = ? OR phone = ?`,
            [email, normalizedPhone]
        );

        let user;
        let isNewUser = false;

        if (existingUsers.length === 0) {
            // Create new user with Google + verified phone
            const nameParts = (name || 'Google User').split(' ');
            const firstName = nameParts[0] || 'Google';
            const lastName = nameParts.slice(1).join(' ') || 'User';

            await connection.execute(
                `INSERT INTO users (phone, email, first_name, last_name, google_id, profile_picture, status, kyc_tier, kyc_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, 'PENDING')`,
                [normalizedPhone, email, firstName, lastName, googleId, picture || null]
            );

            const [newUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE email = ?`,
                [email]
            );
            user = newUser[0];
            isNewUser = true;

            // Create wallet for new user
            await connection.execute(
                `INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'UGX', 0.00)`,
                [user.id]
            );

            // Welcome notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, 'Welcome to GMG Global!', 'Your account has been created with verified phone number. Enjoy our services!', 'SYSTEM')`,
                [user.id]
            );

            console.log(`[GOOGLE+PHONE] New user created: ${email} with phone ${normalizedPhone}`);
        } else {
            user = existingUsers[0];
            
            // Update existing user with Google info and verified phone
            await connection.execute(
                `UPDATE users SET 
                    google_id = COALESCE(google_id, ?),
                    phone = ?,
                    profile_picture = COALESCE(profile_picture, ?)
                 WHERE id = ?`,
                [googleId, normalizedPhone, picture, user.id]
            );

            // Refresh user data
            const [updatedUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE id = ?`,
                [user.id]
            );
            user = updatedUser[0];

            console.log(`[GOOGLE+PHONE] Existing user updated: ${email} with phone ${normalizedPhone}`);
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        // Update last login
        await connection.execute(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        const refreshToken = signToken({
            id: user.id,
            type: 'refresh'
        }, '30d');

        // Store refresh token
        await connection.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [user.id, refreshToken]
        );

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT currency, balance FROM wallets WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400,
                isNewUser,
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    status: user.status
                },
                wallets: wallets.map(w => ({
                    currency: w.currency,
                    balance: parseFloat(w.balance)
                }))
            }
        });

    } catch (error) {
        console.error('Google with phone auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/apple
 * Apple Sign-In (legacy - direct without phone verification)
 */
router.post('/apple', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { email, name, appleId } = req.body;

        if (!email || !appleId) {
            return res.status(400).json({
                success: false,
                error: 'Apple account data required'
            });
        }

        // Check if user exists
        let [existingUsers] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
             FROM users WHERE email = ? OR apple_id = ?`,
            [email, appleId]
        );

        let user;
        let isNewUser = false;

        if (existingUsers.length === 0) {
            // Create new user
            const nameParts = (name || 'Apple User').split(' ');
            const firstName = nameParts[0] || 'Apple';
            const lastName = nameParts.slice(1).join(' ') || 'User';

            await connection.execute(
                `INSERT INTO users (email, first_name, last_name, apple_id, status, kyc_tier, kyc_status)
                 VALUES (?, ?, ?, ?, 'ACTIVE', 1, 'PENDING')`,
                [email, firstName, lastName, appleId]
            );

            const [newUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE email = ?`,
                [email]
            );
            user = newUser[0];
            isNewUser = true;

            // Create wallet
            await connection.execute(
                `INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'UGX', 0.00)`,
                [user.id]
            );

            console.log(`[APPLE] New user created: ${email}`);
        } else {
            user = existingUsers[0];
            
            // Update Apple ID if not set
            await connection.execute(
                `UPDATE users SET apple_id = COALESCE(apple_id, ?) WHERE id = ?`,
                [appleId, user.id]
            );

            console.log(`[APPLE] Existing user login: ${email}`);
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        // Update last login
        await connection.execute(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        const refreshToken = signToken({
            id: user.id,
            type: 'refresh'
        }, '30d');

        // Store refresh token
        await connection.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [user.id, refreshToken]
        );

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT currency, balance FROM wallets WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: isNewUser ? 'Account created' : 'Login successful',
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400,
                isNewUser,
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    status: user.status
                },
                wallets: wallets.map(w => ({
                    currency: w.currency,
                    balance: parseFloat(w.balance)
                }))
            }
        });

    } catch (error) {
        console.error('Apple auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/auth/apple-with-phone
 * Apple Sign-In with phone verification (WhatsApp OTP)
 * Flow: Apple Auth → Phone Input → WhatsApp OTP → Complete Registration
 */
router.post('/apple-with-phone', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { email, name, appleId, phone, otp } = req.body;

        // Validate required fields
        if (!email || !appleId) {
            return res.status(400).json({
                success: false,
                error: 'Apple account data required'
            });
        }

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Phone and OTP required'
            });
        }

        // Normalize phone
        let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!normalizedPhone.startsWith('+')) {
            normalizedPhone = '+' + normalizedPhone;
        }

        // Verify OTP
        const [otpRecords] = await connection.execute(
            `SELECT id, code, attempts, expires_at, verified
             FROM otp_codes 
             WHERE phone = ? AND type = 'LOGIN' AND verified = FALSE
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedPhone]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'OTP expired or not found',
                message: 'Please request a new OTP'
            });
        }

        const otpRecord = otpRecords[0];

        // Check expiry
        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'OTP expired',
                message: 'Please request a new OTP'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            return res.status(429).json({
                success: false,
                error: 'Too many attempts',
                message: 'Please request a new OTP'
            });
        }

        // Verify OTP code
        if (otpRecord.code !== otp) {
            await connection.execute(
                `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`,
                [otpRecord.id]
            );
            return res.status(401).json({
                success: false,
                error: 'Invalid OTP',
                attemptsRemaining: 2 - otpRecord.attempts
            });
        }

        // Mark OTP as verified
        await connection.execute(
            `UPDATE otp_codes SET verified = TRUE WHERE id = ?`,
            [otpRecord.id]
        );

        // Check if user exists by email or phone
        let [existingUsers] = await connection.execute(
            `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
             FROM users WHERE email = ? OR phone = ?`,
            [email, normalizedPhone]
        );

        let user;
        let isNewUser = false;

        if (existingUsers.length === 0) {
            // Create new user with Apple + verified phone
            const nameParts = (name || 'Apple User').split(' ');
            const firstName = nameParts[0] || 'Apple';
            const lastName = nameParts.slice(1).join(' ') || 'User';

            await connection.execute(
                `INSERT INTO users (phone, email, first_name, last_name, apple_id, status, kyc_tier, kyc_status)
                 VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, 'PENDING')`,
                [normalizedPhone, email, firstName, lastName, appleId]
            );

            const [newUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE email = ?`,
                [email]
            );
            user = newUser[0];
            isNewUser = true;

            // Create wallet for new user
            await connection.execute(
                `INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'UGX', 0.00)`,
                [user.id]
            );

            // Welcome notification
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, 'Welcome to GMG Global!', 'Your account has been created with verified phone number. Enjoy our services!', 'SYSTEM')`,
                [user.id]
            );

            console.log(`[APPLE+PHONE] New user created: ${email} with phone ${normalizedPhone}`);
        } else {
            user = existingUsers[0];
            
            // Update existing user with Apple info and verified phone
            await connection.execute(
                `UPDATE users SET 
                    apple_id = COALESCE(apple_id, ?),
                    phone = ?
                 WHERE id = ?`,
                [appleId, normalizedPhone, user.id]
            );

            // Refresh user data
            const [updatedUser] = await connection.execute(
                `SELECT id, phone, email, first_name, last_name, kyc_tier, kyc_status, status
                 FROM users WHERE id = ?`,
                [user.id]
            );
            user = updatedUser[0];

            console.log(`[APPLE+PHONE] Existing user updated: ${email} with phone ${normalizedPhone}`);
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                error: 'Account inactive'
            });
        }

        // Update last login
        await connection.execute(
            `UPDATE users SET last_login = NOW() WHERE id = ?`,
            [user.id]
        );

        // Generate tokens
        const accessToken = signToken({
            id: user.id,
            phone: user.phone,
            type: 'access'
        }, '24h');

        const refreshToken = signToken({
            id: user.id,
            type: 'refresh'
        }, '30d');

        // Store refresh token
        await connection.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [user.id, refreshToken]
        );

        // Get wallet
        const [wallets] = await connection.execute(
            `SELECT currency, balance FROM wallets WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                accessToken,
                refreshToken,
                expiresIn: 86400,
                isNewUser,
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    kycTier: user.kyc_tier,
                    kycStatus: user.kyc_status,
                    status: user.status
                },
                wallets: wallets.map(w => ({
                    currency: w.currency,
                    balance: parseFloat(w.balance)
                }))
            }
        });

    } catch (error) {
        console.error('Apple with phone auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

module.exports = router;