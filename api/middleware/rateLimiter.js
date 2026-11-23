/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

// Use memory store for development (simpler and works without Redis)
// In production, you can enable Redis store

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please slow down and try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Please wait 15 minutes before trying again'
    },
    skipSuccessfulRequests: true
});

// Transaction limiter
const transactionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 transactions per minute
    message: {
        success: false,
        error: 'Transaction rate limit exceeded',
        message: 'Please wait before making another transaction'
    }
});

// OTP limiter
const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1, // 1 OTP per minute per IP
    message: {
        success: false,
        error: 'OTP rate limit exceeded',
        message: 'Please wait 1 minute before requesting another OTP'
    }
});

module.exports = {
    globalLimiter,
    authLimiter,
    transactionLimiter,
    otpLimiter
};
