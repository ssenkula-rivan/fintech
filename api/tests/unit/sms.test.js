/**
 * Unit Tests - SMS Service
 * Tests SMS formatting and template generation
 */

const { templates } = require('../../services/sms');

describe('SMS Service', () => {

    describe('SMS Templates', () => {
        test('OTP_LOGIN template includes OTP code', () => {
            const message = templates.OTP_LOGIN('123456');
            expect(message).toContain('123456');
            expect(message).toContain('GMG Global');
            expect(message).toContain('5 minutes');
        });

        test('OTP_TRANSACTION template includes OTP and amount', () => {
            const message = templates.OTP_TRANSACTION('654321', '50,000');
            expect(message).toContain('654321');
            expect(message).toContain('50,000');
        });

        test('TRANSFER_SENT template includes amount and recipient', () => {
            const message = templates.TRANSFER_SENT('100,000', 'John Doe');
            expect(message).toContain('100,000');
            expect(message).toContain('John Doe');
            expect(message).toContain('sent');
        });

        test('TRANSFER_RECEIVED template includes amount and sender', () => {
            const message = templates.TRANSFER_RECEIVED('50,000', '+256771234567');
            expect(message).toContain('50,000');
            expect(message).toContain('+256771234567');
            expect(message).toContain('received');
        });

        test('DEPOSIT_SUCCESS template includes amount', () => {
            const message = templates.DEPOSIT_SUCCESS('200,000');
            expect(message).toContain('200,000');
            expect(message).toContain('successful');
        });

        test('DEPOSIT_FAILED template includes amount', () => {
            const message = templates.DEPOSIT_FAILED('200,000');
            expect(message).toContain('200,000');
            expect(message).toContain('failed');
        });

        test('LOW_BALANCE template includes balance', () => {
            const message = templates.LOW_BALANCE('5,000');
            expect(message).toContain('5,000');
            expect(message).toContain('low');
        });

        test('WELCOME template includes user name', () => {
            const message = templates.WELCOME('John');
            expect(message).toContain('John');
            expect(message).toContain('Welcome');
        });
    });


    describe('SMS Message Length', () => {
        test('OTP messages are under 160 characters', () => {
            const message = templates.OTP_LOGIN('123456');
            expect(message.length).toBeLessThanOrEqual(160);
        });

        test('Transfer notifications are under 160 characters', () => {
            const sent = templates.TRANSFER_SENT('1,000,000', 'John Doe');
            const received = templates.TRANSFER_RECEIVED('1,000,000', '+256771234567');
            
            expect(sent.length).toBeLessThanOrEqual(160);
            expect(received.length).toBeLessThanOrEqual(160);
        });
    });

    describe('Phone Number Validation', () => {
        test('validates Uganda phone format', () => {
            const validPhones = [
                '+256771234567',
                '+256701234567',
                '+256781234567',
            ];
            
            validPhones.forEach(phone => {
                expect(phone).toMatch(/^\+256[7][0-9]{8}$/);
            });
        });

        test('rejects invalid phone formats', () => {
            const invalidPhones = [
                '0771234567',      // missing +256
                '+25677123456',    // too short
                '+2567712345678',  // too long
                '+256671234567',   // wrong prefix (6 instead of 7)
            ];
            
            invalidPhones.forEach(phone => {
                expect(phone).not.toMatch(/^\+256[7][0-9]{8}$/);
            });
        });
    });
});
