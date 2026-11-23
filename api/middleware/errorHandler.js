/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */

// Custom API Error class
class APIError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error types
const ErrorTypes = {
    BAD_REQUEST: (message) => new APIError(message || 'Bad request', 400, 'BAD_REQUEST'),
    UNAUTHORIZED: (message) => new APIError(message || 'Unauthorized', 401, 'UNAUTHORIZED'),
    FORBIDDEN: (message) => new APIError(message || 'Forbidden', 403, 'FORBIDDEN'),
    NOT_FOUND: (message) => new APIError(message || 'Resource not found', 404, 'NOT_FOUND'),
    CONFLICT: (message) => new APIError(message || 'Conflict', 409, 'CONFLICT'),
    VALIDATION: (message) => new APIError(message || 'Validation failed', 422, 'VALIDATION_ERROR'),
    RATE_LIMIT: (message) => new APIError(message || 'Too many requests', 429, 'RATE_LIMIT'),
    INTERNAL: (message) => new APIError(message || 'Internal server error', 500, 'INTERNAL_ERROR'),
    DATABASE: (message) => new APIError(message || 'Database error', 500, 'DATABASE_ERROR'),
    INSUFFICIENT_FUNDS: (message) => new APIError(message || 'Insufficient funds', 400, 'INSUFFICIENT_FUNDS'),
    INVALID_PIN: (message) => new APIError(message || 'Invalid PIN', 401, 'INVALID_PIN'),
    ACCOUNT_LOCKED: (message) => new APIError(message || 'Account locked', 403, 'ACCOUNT_LOCKED')
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user?.id,
        timestamp: new Date().toISOString()
    });

    // Handle known API errors
    if (err instanceof APIError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.code,
            message: err.message
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'INVALID_TOKEN',
            message: 'Invalid authentication token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired'
        });
    }

    // Handle Joi validation errors
    if (err.name === 'ValidationError' && err.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: err.details?.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }))
        });
    }

    // Handle MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            error: 'DUPLICATE_ENTRY',
            message: 'This record already exists'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            error: 'INVALID_REFERENCE',
            message: 'Referenced record does not exist'
        });
    }

    // Handle unknown errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'An unexpected error occurred';

    res.status(statusCode).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: message
    });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
    });
};

// Async handler wrapper (catches async errors)
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    APIError,
    ErrorTypes,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
