/**
 * Unit Tests - Authentication Middleware
 * Tests JWT verification, token validation, and role checks
 */

const jwt = require('jsonwebtoken');

// Mock JWT secret
const JWT_SECRET = 'test-secret-key-for-unit-tests';

// Mock authenticateToken middleware logic
function authenticateToken(token, secret = JWT_SECRET) {
    if (!token) {
        return { success: false, error: 'Access token required', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, secret);
        
        if (decoded.type !== 'access') {
            return { success: false, error: 'Invalid token type', status: 401 };
        }

        return { 
            success: true, 
            user: { id: decoded.id, phone: decoded.phone }
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { success: false, error: 'Token expired', status: 401 };
        }
        if (error.name === 'JsonWebTokenError') {
            return { success: false, error: 'Invalid token', status: 401 };
        }
        return { success: false, error: 'Authentication failed', status: 500 };
    }
}

// Generate test tokens
function generateToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

describe('Authentication Middleware', () => {

    describe('Token Validation', () => {
        test('rejects missing token', () => {
            const result = authenticateToken(null);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Access token required');
            expect(result.status).toBe(401);
        });

        test('rejects empty token', () => {
            const result = authenticateToken('');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Access token required');
        });

        test('accepts valid access token', () => {
            const token = generateToken({ id: 1, phone: '+256700000000', type: 'access' });
            const result = authenticateToken(token);
            
            expect(result.success).toBe(true);
            expect(result.user.id).toBe(1);
            expect(result.user.phone).toBe('+256700000000');
        });

        test('rejects refresh token used as access token', () => {
            const token = generateToken({ id: 1, phone: '+256700000000', type: 'refresh' });
            const result = authenticateToken(token);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid token type');
        });

        test('rejects expired token', () => {
            const token = generateToken({ id: 1, type: 'access' }, '-1s');
            const result = authenticateToken(token);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Token expired');
        });

        test('rejects malformed token', () => {
            const result = authenticateToken('not.a.valid.token');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid token');
        });

        test('rejects token with wrong secret', () => {
            const token = jwt.sign({ id: 1, type: 'access' }, 'wrong-secret');
            const result = authenticateToken(token);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid token');
        });
    });

    describe('Token Payload Extraction', () => {
        test('extracts user id from token', () => {
            const token = generateToken({ id: 123, phone: '+256700000000', type: 'access' });
            const result = authenticateToken(token);
            
            expect(result.user.id).toBe(123);
        });

        test('extracts phone from token', () => {
            const token = generateToken({ id: 1, phone: '+256712345678', type: 'access' });
            const result = authenticateToken(token);
            
            expect(result.user.phone).toBe('+256712345678');
        });
    });
});

describe('Token Generation', () => {
    test('generates valid JWT', () => {
        const token = generateToken({ id: 1, type: 'access' });
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3);
    });

    test('token contains correct payload', () => {
        const payload = { id: 42, phone: '+256700000000', type: 'access' };
        const token = generateToken(payload);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        expect(decoded.id).toBe(42);
        expect(decoded.phone).toBe('+256700000000');
        expect(decoded.type).toBe('access');
    });

    test('token has expiration', () => {
        const token = generateToken({ id: 1, type: 'access' }, '1h');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        expect(decoded.exp).toBeDefined();
        expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
});

describe('Role-Based Access', () => {
    function requireRole(userRole, allowedRoles) {
        if (!userRole) {
            return { success: false, error: 'Authentication required', status: 401 };
        }
        if (!allowedRoles.includes(userRole)) {
            return { success: false, error: 'Insufficient permissions', status: 403 };
        }
        return { success: true };
    }

    test('allows user with correct role', () => {
        const result = requireRole('admin', ['admin', 'superadmin']);
        expect(result.success).toBe(true);
    });

    test('rejects user with wrong role', () => {
        const result = requireRole('user', ['admin', 'superadmin']);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient permissions');
        expect(result.status).toBe(403);
    });

    test('rejects unauthenticated user', () => {
        const result = requireRole(null, ['admin']);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Authentication required');
        expect(result.status).toBe(401);
    });
});
