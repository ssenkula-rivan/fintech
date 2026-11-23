/**
 * Input Validation Middleware
 * Validates and sanitizes all user inputs
 */

const Joi = require('joi');

// Phone number validation (Uganda format)
const phoneSchema = Joi.string()
    .pattern(/^(\+?256|0)?[7][0-9]{8}$/)
    .required()
    .messages({
        'string.pattern.base': 'Phone number must be in format +256XXXXXXXXX or 07XXXXXXXX'
    });

// PIN validation
const pinSchema = Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
        'string.length': 'PIN must be exactly 6 digits',
        'string.pattern.base': 'PIN must contain only numbers'
    });

// Amount validation
const amountSchema = Joi.number()
    .positive()
    .precision(4)
    .min(100)
    .max(100000000)
    .required()
    .messages({
        'number.positive': 'Amount must be positive',
        'number.min': 'Minimum amount is 100',
        'number.max': 'Maximum amount is 100,000,000'
    });

// Validation schemas
const schemas = {
    // Authentication
    sendOTP: Joi.object({
        phone: phoneSchema,
        channel: Joi.string().valid('sms', 'whatsapp').default('sms')
    }),
    
    verifyOTP: Joi.object({
        phone: phoneSchema,
        otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    }),
    
    // Transactions
    sendMoney: Joi.object({
        recipient_phone: phoneSchema,
        amount: amountSchema,
        currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('UGX'),
        description: Joi.string().max(200).optional(),
        pin: pinSchema
    }),
    
    deposit: Joi.object({
        method: Joi.string().valid('MTN', 'AIRTEL', 'AFRICELL').required(),
        amount: amountSchema,
        currency: Joi.string().valid('UGX').default('UGX'),
        phone: phoneSchema.optional()
    }),
    
    withdraw: Joi.object({
        method: Joi.string().valid('MTN', 'AIRTEL').required(),
        amount: amountSchema,
        currency: Joi.string().valid('UGX').default('UGX'),
        phone: phoneSchema.optional(),
        pin: pinSchema
    }),
    
    // Bills
    buyAirtime: Joi.object({
        network: Joi.string().valid('MTN', 'AIRTEL', 'AFRICELL').required(),
        phone: phoneSchema,
        amount: Joi.number().min(500).max(500000).required(),
        pin: pinSchema
    }),
    
    buyData: Joi.object({
        network: Joi.string().valid('MTN', 'AIRTEL').required(),
        phone: phoneSchema,
        bundle_id: Joi.string().required(),
        pin: pinSchema
    }),
    
    payBill: Joi.object({
        bill_type: Joi.string().valid('ELECTRICITY', 'WATER', 'TV', 'INTERNET').required(),
        provider: Joi.string().required(),
        account_number: Joi.string().max(50).required(),
        amount: amountSchema,
        pin: pinSchema
    }),
    
    // KYC
    submitKYC: Joi.object({
        tier: Joi.number().valid(2, 3).required(),
        personalInfo: Joi.object({
            fullName: Joi.string().min(3).max(100).required(),
            dob: Joi.date().max('2006-12-31').required(),
            gender: Joi.string().valid('M', 'F').required(),
            nationalId: Joi.string().length(14).pattern(/^[A-Z0-9]+$/).required(),
            district: Joi.string().min(2).max(50).required()
        }).required(),
        documents: Joi.object({
            idFront: Joi.string().required(),
            idBack: Joi.string().required(),
            selfie: Joi.string().required()
        }).required()
    }),
    
    // Currency Exchange
    exchange: Joi.object({
        from_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'RWF', 'NGN').required(),
        to_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'RWF', 'NGN').required(),
        amount: amountSchema,
        pin: pinSchema
    }),
    
    // Crypto Wallet
    createWallet: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        phone: phoneSchema,
        email: Joi.string().email().required(),
        pin: pinSchema
    }),
    
    cryptoSend: Joi.object({
        token: Joi.string().valid('ETH', 'BTC', 'BNB', 'MATIC', 'USDT', 'USDC').required(),
        to_address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required().messages({
            'string.pattern.base': 'Invalid Ethereum address format'
        }),
        amount: Joi.number().positive().precision(8).required(),
        pin: pinSchema
    })
};

// Validation middleware factory
function validate(schemaName) {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        
        if (!schema) {
            return res.status(500).json({
                success: false,
                error: 'Validation schema not found'
            });
        }
        
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));
            
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: 'Please check your input and try again',
                details: errors
            });
        }
        
        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Sanitize object recursively
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? sanitizeHtml(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    
    return sanitized;
}

// Sanitization middleware
function sanitize(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    
    next();
}

// Phone number normalization
function normalizePhoneNumber(phone) {
    if (!phone) return phone;
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('+256')) {
        return cleaned;
    } else if (cleaned.startsWith('256')) {
        return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        return '+256' + cleaned.substring(1);
    }
    
    return '+256' + cleaned;
}

// String sanitization
function sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return str;
    
    // Remove HTML tags (basic)
    let sanitized = str.replace(/[<>]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
}

// Validators object for direct validation
const validators = {
    isValidUgandaPhone(phone) {
        if (!phone) return false;
        const normalized = normalizePhoneNumber(phone);
        return /^\+256[7][0-9]{8}$/.test(normalized);
    },
    
    isValidPIN(pin) {
        if (!pin || typeof pin !== 'string') return false;
        return /^[0-9]{6}$/.test(pin);
    },
    
    isValidAmount(amount, min = 1000, max = 50000000) {
        if (typeof amount !== 'number' || isNaN(amount)) return false;
        return amount > 0 && amount >= min && amount <= max;
    },
    
    isValidEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

module.exports = {
    validate,
    sanitize,
    schemas,
    normalizePhoneNumber,
    sanitizeString,
    validators
};