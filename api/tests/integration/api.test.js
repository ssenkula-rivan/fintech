/**
 * Integration Tests - API Endpoints
 * Tests actual HTTP requests to API endpoints
 * 
 * Run with: npm run test:integration
 */

const request = require('supertest');

// Set test environment BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'gmg_uganda_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-minimum-32-characters-long-for-testing';

// Mock the database before importing app
jest.mock('mysql2/promise', () => {
    const mockPool = {
        getConnection: jest.fn().mockResolvedValue({
            execute: jest.fn().mockResolvedValue([[]]),
            query: jest.fn().mockResolvedValue([[]]),
            release: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn()
        }),
        execute: jest.fn().mockResolvedValue([[]]),
        query: jest.fn().mockResolvedValue([[]])
    };
    return {
        createPool: jest.fn().mockReturnValue(mockPool)
    };
});

// Import app (not the server listener)
const { app } = require('../../server');

describe('API Integration Tests', () => {

    describe('Health Check', () => {
        test('GET /health returns healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('API Info', () => {
        test('GET /api returns API information', async () => {
            const response = await request(app)
                .get('/api')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('name', 'GMG Global API');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
        });
    });

    describe('404 Handler', () => {
        test('returns 404 for unknown routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent-endpoint')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('NOT_FOUND');
        });
    });

    describe('Authentication Endpoints', () => {
        describe('POST /api/auth/send-otp', () => {
            test('rejects missing phone number', async () => {
                const response = await request(app)
                    .post('/api/auth/send-otp')
                    .send({})
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Phone number required');
            });

            test('rejects invalid phone format', async () => {
                const response = await request(app)
                    .post('/api/auth/send-otp')
                    .send({ phone: 'invalid' })
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe('POST /api/auth/verify-otp', () => {
            test('rejects missing phone and OTP', async () => {
                const response = await request(app)
                    .post('/api/auth/verify-otp')
                    .send({})
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Phone and OTP required');
            });
        });

        describe('POST /api/auth/validate', () => {
            test('rejects missing token', async () => {
                const response = await request(app)
                    .post('/api/auth/validate')
                    .expect('Content-Type', /json/)
                    .expect(401);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Token required');
            });

            test('rejects invalid token', async () => {
                const response = await request(app)
                    .post('/api/auth/validate')
                    .set('Authorization', 'Bearer invalid-token')
                    .expect('Content-Type', /json/)
                    .expect(401);

                expect(response.body.success).toBe(false);
            });
        });

        describe('POST /api/auth/refresh', () => {
            test('rejects missing refresh token', async () => {
                const response = await request(app)
                    .post('/api/auth/refresh')
                    .send({})
                    .expect('Content-Type', /json/)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Refresh token required');
            });
        });
    });

    describe('Protected Endpoints (No Auth)', () => {
        test('GET /api/wallet/balance requires authentication', async () => {
            const response = await request(app)
                .get('/api/wallet/balance')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Access token required');
        });

        test('GET /api/transactions requires authentication', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .expect('Content-Type', /json/);

            // May return 401 (unauthorized) or 404 (route structure)
            expect([401, 404]).toContain(response.status);
            expect(response.body.success).toBe(false);
        });

        test('GET /api/dashboard requires authentication', async () => {
            const response = await request(app)
                .get('/api/dashboard')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Admin Endpoints (Role Check)', () => {
        const jwt = require('jsonwebtoken');
        
        // Generate a valid token for a regular user (not admin)
        const regularUserToken = jwt.sign(
            { id: 1, phone: '+256700000000', type: 'access', role: 'USER' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        test('GET /api/admin/users requires admin role', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .expect('Content-Type', /json/);

            // Should be 403 (forbidden) not 200
            // The exact status depends on whether DB lookup succeeds
            expect([401, 403, 500]).toContain(response.status);
        });

        test('GET /api/admin/stats requires admin role', async () => {
            const response = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .expect('Content-Type', /json/);

            expect([401, 403, 500]).toContain(response.status);
        });

        test('GET /api/admin/transactions requires admin role', async () => {
            const response = await request(app)
                .get('/api/admin/transactions')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .expect('Content-Type', /json/);

            expect([401, 403, 500]).toContain(response.status);
        });
    });

    describe('Rate Limiting', () => {
        test('applies rate limiting headers', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            // Rate limit headers should be present
            expect(response.headers).toHaveProperty('ratelimit-limit');
            expect(response.headers).toHaveProperty('ratelimit-remaining');
        });
    });

    describe('Security Headers', () => {
        test('includes security headers from helmet', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            // Helmet adds these headers
            expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(response.headers).toHaveProperty('x-frame-options');
        });
    });

    describe('CORS', () => {
        test('allows configured origins', async () => {
            const response = await request(app)
                .options('/api')
                .set('Origin', 'http://localhost:8080')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('Error Response Format', () => {
        test('returns consistent error format', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('message');
        });
    });
});

describe('Input Validation', () => {
    describe('Phone Number Validation', () => {
        test('accepts valid Uganda phone formats', async () => {
            const validPhones = [
                '+256700000000',
                '0700000000',
                '256700000000'
            ];

            for (const phone of validPhones) {
                const response = await request(app)
                    .post('/api/auth/send-otp')
                    .send({ phone });

                // Should not fail on format validation
                // May fail on user not found, which is expected
                expect([200, 404, 429]).toContain(response.status);
            }
        });

        test('rejects invalid phone formats', async () => {
            const invalidPhones = [
                'abc',
                '123',
                '+1234567890',
                ''
            ];

            for (const phone of invalidPhones) {
                const response = await request(app)
                    .post('/api/auth/send-otp')
                    .send({ phone });

                expect(response.body.success).toBe(false);
            }
        });
    });
});
