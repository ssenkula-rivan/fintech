/**
 * Unit Tests - Monitoring Service
 */

const {
    recordRequest,
    recordTransaction,
    recordAuth,
    recordError,
    getHealth,
    getMetrics,
    resetMetrics,
    checkAlerts
} = require('../../services/monitoring');

describe('Monitoring Service', () => {
    beforeEach(() => {
        resetMetrics();
    });

    describe('recordRequest', () => {
        test('increments total requests', () => {
            recordRequest(true, 100, '/api/test');
            recordRequest(true, 150, '/api/test');
            
            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(2);
            expect(metrics.requests.success).toBe(2);
        });

        test('tracks failed requests', () => {
            recordRequest(true, 100, '/api/test');
            recordRequest(false, 200, '/api/error');
            
            const metrics = getMetrics();
            expect(metrics.requests.total).toBe(2);
            expect(metrics.requests.failed).toBe(1);
        });
    });

    describe('recordTransaction', () => {
        test('tracks successful transactions', () => {
            recordTransaction(true, 50000, 'TRANSFER');
            recordTransaction(true, 100000, 'DEPOSIT');
            
            const metrics = getMetrics();
            expect(metrics.transactions.total).toBe(2);
            expect(metrics.transactions.success).toBe(2);
            expect(metrics.transactions.volume).toBe(150000);
        });

        test('tracks failed transactions', () => {
            recordTransaction(true, 50000);
            recordTransaction(false, 0);
            
            const metrics = getMetrics();
            expect(metrics.transactions.failed).toBe(1);
        });
    });

    describe('recordAuth', () => {
        test('tracks login events', () => {
            recordAuth('login', true);
            recordAuth('login', true);
            recordAuth('login', false);
            
            const metrics = getMetrics();
            expect(metrics.auth.logins).toBe(3);
            expect(metrics.auth.failures).toBe(1);
        });

        test('tracks OTP events', () => {
            recordAuth('otp');
            recordAuth('otp');
            
            const metrics = getMetrics();
            expect(metrics.auth.otpSent).toBe(2);
        });
    });

    describe('getHealth', () => {
        test('returns health status', () => {
            const health = getHealth();
            
            expect(health.status).toBe('healthy');
            expect(health.uptime).toBeGreaterThanOrEqual(0);
            expect(health.memory).toBeDefined();
            expect(health.memory.heapUsed).toBeGreaterThan(0);
        });
    });

    describe('getMetrics', () => {
        test('returns formatted metrics', () => {
            recordRequest(true, 100, '/test');
            recordTransaction(true, 50000);
            
            const metrics = getMetrics();
            
            expect(metrics.requests).toBeDefined();
            expect(metrics.transactions).toBeDefined();
            expect(metrics.performance).toBeDefined();
            expect(metrics.performance.avgResponseTime).toBeDefined();
        });

        test('calculates error rate', () => {
            for (let i = 0; i < 90; i++) recordRequest(true, 100, '/test');
            for (let i = 0; i < 10; i++) recordRequest(false, 100, '/test');
            
            const metrics = getMetrics();
            expect(metrics.requests.errorRate).toBe('10.00%');
        });
    });

    describe('checkAlerts', () => {
        test('returns empty array when no alerts', () => {
            recordRequest(true, 100, '/test');
            const alerts = checkAlerts();
            expect(alerts).toEqual([]);
        });

        test('detects high error rate', () => {
            // Create 100+ requests with >5% error rate
            for (let i = 0; i < 90; i++) recordRequest(true, 100, '/test');
            for (let i = 0; i < 15; i++) recordRequest(false, 100, '/test');
            
            const alerts = checkAlerts();
            const errorAlert = alerts.find(a => a.type === 'HIGH_ERROR_RATE');
            expect(errorAlert).toBeDefined();
        });
    });
});
