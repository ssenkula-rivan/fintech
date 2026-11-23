/**
 * Unit Tests - CSRF Protection
 */

const { generateToken, validateToken } = require('../../middleware/csrf');

describe('CSRF Protection', () => {
    describe('generateToken', () => {
        test('generates unique tokens', () => {
            const token1 = generateToken('session1');
            const token2 = generateToken('session1');
            
            expect(token1).toBeDefined();
            expect(token2).toBeDefined();
            expect(token1).not.toBe(token2);
        });

        test('generates 64-character hex tokens', () => {
            const token = generateToken('session1');
            expect(token.length).toBe(64);
            expect(/^[a-f0-9]+$/.test(token)).toBe(true);
        });
    });

    describe('validateToken', () => {
        test('validates correct token and session', () => {
            const sessionId = 'test-session-123';
            const token = generateToken(sessionId);
            
            const isValid = validateToken(token, sessionId);
            expect(isValid).toBe(true);
        });

        test('rejects token with wrong session', () => {
            const token = generateToken('session1');
            
            const isValid = validateToken(token, 'session2');
            expect(isValid).toBe(false);
        });

        test('rejects invalid token', () => {
            const isValid = validateToken('invalid-token', 'session1');
            expect(isValid).toBe(false);
        });

        test('token is single-use', () => {
            const sessionId = 'test-session';
            const token = generateToken(sessionId);
            
            // First validation should succeed
            expect(validateToken(token, sessionId)).toBe(true);
            
            // Second validation should fail (token consumed)
            expect(validateToken(token, sessionId)).toBe(false);
        });

        test('rejects null/undefined tokens', () => {
            expect(validateToken(null, 'session')).toBe(false);
            expect(validateToken(undefined, 'session')).toBe(false);
            expect(validateToken('', 'session')).toBe(false);
        });
    });
});
