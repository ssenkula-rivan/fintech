/**
 * Unit Tests - Error Handler Middleware
 * Tests error response consistency and HTTP status codes
 */

const { APIError, ErrorTypes, errorHandler, notFoundHandler } = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {

    describe('APIError class', () => {
        test('creates error with correct properties', () => {
            const error = new APIError('Test error', 400, 'TEST_ERROR');
            
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.isOperational).toBe(true);
        });

        test('uses default values when not provided', () => {
            const error = new APIError('Test error');
            
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('INTERNAL_ERROR');
        });
    });

    describe('ErrorTypes factory functions', () => {
        test('BAD_REQUEST returns 400 status', () => {
            const error = ErrorTypes.BAD_REQUEST('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('BAD_REQUEST');
        });

        test('UNAUTHORIZED returns 401 status', () => {
            const error = ErrorTypes.UNAUTHORIZED();
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
        });

        test('FORBIDDEN returns 403 status', () => {
            const error = ErrorTypes.FORBIDDEN();
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('FORBIDDEN');
        });

        test('NOT_FOUND returns 404 status', () => {
            const error = ErrorTypes.NOT_FOUND('User not found');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
        });


        test('RATE_LIMIT returns 429 status', () => {
            const error = ErrorTypes.RATE_LIMIT();
            expect(error.statusCode).toBe(429);
            expect(error.code).toBe('RATE_LIMIT');
        });

        test('INSUFFICIENT_FUNDS returns 400 status', () => {
            const error = ErrorTypes.INSUFFICIENT_FUNDS();
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('INSUFFICIENT_FUNDS');
        });

        test('INVALID_PIN returns 401 status', () => {
            const error = ErrorTypes.INVALID_PIN();
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('INVALID_PIN');
        });

        test('ACCOUNT_LOCKED returns 403 status', () => {
            const error = ErrorTypes.ACCOUNT_LOCKED();
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('ACCOUNT_LOCKED');
        });
    });

    describe('errorHandler middleware', () => {
        let mockReq, mockRes, mockNext;

        beforeEach(() => {
            mockReq = { path: '/test', method: 'GET', ip: '127.0.0.1', user: { id: 1 } };
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            mockNext = jest.fn();
        });

        test('handles APIError correctly', () => {
            const error = new APIError('Test error', 400, 'TEST_ERROR');
            
            errorHandler(error, mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'TEST_ERROR',
                message: 'Test error'
            });
        });

        test('handles JWT TokenExpiredError', () => {
            const error = new Error('jwt expired');
            error.name = 'TokenExpiredError';
            
            errorHandler(error, mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'TOKEN_EXPIRED'
            }));
        });

        test('handles JWT JsonWebTokenError', () => {
            const error = new Error('invalid token');
            error.name = 'JsonWebTokenError';
            
            errorHandler(error, mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'INVALID_TOKEN'
            }));
        });

        test('handles MySQL duplicate entry error', () => {
            const error = new Error('Duplicate entry');
            error.code = 'ER_DUP_ENTRY';
            
            errorHandler(error, mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'DUPLICATE_ENTRY'
            }));
        });
    });

    describe('notFoundHandler middleware', () => {
        test('returns 404 with route info', () => {
            const mockReq = { method: 'GET', path: '/unknown' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            
            notFoundHandler(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'NOT_FOUND',
                message: 'Route GET /unknown not found'
            });
        });
    });
});
