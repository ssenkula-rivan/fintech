/**
 * Unit Tests - Validation Middleware
 * Tests phone validation, PIN validation, and amount validation
 */

const { validators, normalizePhoneNumber, sanitizeString } = require('../../middleware/validation');

describe('Validation Middleware', () => {
    
    describe('normalizePhoneNumber', () => {
        test('converts 07XXXXXXXX to +256XXXXXXXXX', () => {
            expect(normalizePhoneNumber('0771234567')).toBe('+256771234567');
        });

        test('converts 256XXXXXXXXX to +256XXXXXXXXX', () => {
            expect(normalizePhoneNumber('256771234567')).toBe('+256771234567');
        });

        test('keeps +256XXXXXXXXX unchanged', () => {
            expect(normalizePhoneNumber('+256771234567')).toBe('+256771234567');
        });

        test('removes non-digit characters', () => {
            expect(normalizePhoneNumber('077-123-4567')).toBe('+256771234567');
            expect(normalizePhoneNumber('077 123 4567')).toBe('+256771234567');
        });
    });

    describe('validators.isValidUgandaPhone', () => {
        test('accepts valid Uganda phone numbers', () => {
            expect(validators.isValidUgandaPhone('0771234567')).toBe(true);
            expect(validators.isValidUgandaPhone('+256771234567')).toBe(true);
            expect(validators.isValidUgandaPhone('256771234567')).toBe(true);
            expect(validators.isValidUgandaPhone('0701234567')).toBe(true);
            expect(validators.isValidUgandaPhone('0781234567')).toBe(true);
        });

        test('rejects invalid phone numbers', () => {
            expect(validators.isValidUgandaPhone('077123456')).toBe(false);  // too short
            expect(validators.isValidUgandaPhone('07712345678')).toBe(false); // too long
            expect(validators.isValidUgandaPhone('0671234567')).toBe(false);  // wrong prefix
            expect(validators.isValidUgandaPhone('abc')).toBe(false);
        });
    });


    describe('validators.isValidPIN', () => {
        test('accepts valid 6-digit PINs', () => {
            expect(validators.isValidPIN('123456')).toBe(true);
            expect(validators.isValidPIN('000000')).toBe(true);
            expect(validators.isValidPIN('999999')).toBe(true);
        });

        test('rejects invalid PINs', () => {
            expect(validators.isValidPIN('12345')).toBe(false);   // too short
            expect(validators.isValidPIN('1234567')).toBe(false); // too long
            expect(validators.isValidPIN('12345a')).toBe(false);  // contains letter
            expect(validators.isValidPIN('')).toBe(false);
            expect(validators.isValidPIN(null)).toBe(false);
        });
    });

    describe('validators.isValidAmount', () => {
        test('accepts valid amounts within default range', () => {
            expect(validators.isValidAmount(1000)).toBe(true);
            expect(validators.isValidAmount(50000000)).toBe(true);
            expect(validators.isValidAmount(100000)).toBe(true);
        });

        test('rejects amounts outside default range', () => {
            expect(validators.isValidAmount(999)).toBe(false);     // below min
            expect(validators.isValidAmount(50000001)).toBe(false); // above max
            expect(validators.isValidAmount(-1000)).toBe(false);
            expect(validators.isValidAmount(0)).toBe(false);
        });

        test('accepts custom min/max range', () => {
            expect(validators.isValidAmount(500, 100, 1000)).toBe(true);
            expect(validators.isValidAmount(50, 100, 1000)).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        test('removes HTML tags', () => {
            expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
        });

        test('trims whitespace', () => {
            expect(sanitizeString('  hello world  ')).toBe('hello world');
        });

        test('truncates long strings', () => {
            const longString = 'a'.repeat(2000);
            expect(sanitizeString(longString).length).toBe(1000);
        });

        test('handles non-string input', () => {
            expect(sanitizeString(123)).toBe(123);
            expect(sanitizeString(null)).toBe(null);
        });
    });
});
