/**
 * Unit Tests - Trading Logic
 * Tests price calculations, margin requirements, and P&L
 */

// Trading pair configurations
const TRADING_PAIRS = {
    forex: [
        { symbol: 'EUR/USD', spread: 0.0002 },
        { symbol: 'GBP/USD', spread: 0.0003 },
        { symbol: 'USD/UGX', spread: 5 }
    ],
    crypto: [
        { symbol: 'BTC/USD', spread: 50 },
        { symbol: 'ETH/USD', spread: 5 }
    ]
};

// Market prices
const marketPrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/UGX': 3750,
    'BTC/USD': 43500,
    'ETH/USD': 2280
};

// Get market price with small variation
function getMarketPrice(symbol) {
    const basePrice = marketPrices[symbol];
    if (!basePrice) return null;
    const variation = (Math.random() - 0.5) * 0.002 * basePrice;
    return Math.round((basePrice + variation) * 10000) / 10000;
}

// Calculate margin required
function calculateMargin(price, quantity, leverage) {
    const positionValue = price * quantity;
    return positionValue / leverage;
}

// Calculate P&L
function calculatePnL(entryPrice, currentPrice, quantity, positionType, leverage = 1) {
    const priceDiff = positionType === 'BUY'
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
    return priceDiff * quantity * leverage;
}

// Calculate P&L percentage
function calculatePnLPercent(entryPrice, currentPrice, positionType, leverage = 1) {
    const priceDiff = positionType === 'BUY'
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
    return (priceDiff / entryPrice) * 100 * leverage;
}

describe('Trading Logic', () => {

    describe('Market Price', () => {
        test('returns price for valid symbol', () => {
            const price = getMarketPrice('EUR/USD');
            expect(price).toBeDefined();
            expect(price).toBeGreaterThan(1.0);
            expect(price).toBeLessThan(1.2);
        });

        test('returns null for invalid symbol', () => {
            const price = getMarketPrice('INVALID/PAIR');
            expect(price).toBeNull();
        });

        test('price varies slightly from base', () => {
            const prices = [];
            for (let i = 0; i < 10; i++) {
                prices.push(getMarketPrice('BTC/USD'));
            }
            // Should have some variation
            const unique = new Set(prices);
            expect(unique.size).toBeGreaterThan(1);
        });
    });

    describe('Margin Calculation', () => {
        test('calculates margin without leverage', () => {
            const margin = calculateMargin(100, 10, 1);
            expect(margin).toBe(1000);
        });

        test('calculates margin with 10x leverage', () => {
            const margin = calculateMargin(100, 10, 10);
            expect(margin).toBe(100);
        });

        test('calculates margin with 100x leverage', () => {
            const margin = calculateMargin(43500, 1, 100);
            expect(margin).toBe(435);
        });

        test('higher leverage requires less margin', () => {
            const margin1x = calculateMargin(1000, 1, 1);
            const margin10x = calculateMargin(1000, 1, 10);
            const margin100x = calculateMargin(1000, 1, 100);
            
            expect(margin1x).toBeGreaterThan(margin10x);
            expect(margin10x).toBeGreaterThan(margin100x);
        });
    });

    describe('P&L Calculation', () => {
        describe('BUY positions', () => {
            test('profit when price goes up', () => {
                const pnl = calculatePnL(100, 110, 10, 'BUY');
                expect(pnl).toBe(100); // (110-100) * 10
            });

            test('loss when price goes down', () => {
                const pnl = calculatePnL(100, 90, 10, 'BUY');
                expect(pnl).toBe(-100); // (90-100) * 10
            });

            test('zero P&L when price unchanged', () => {
                const pnl = calculatePnL(100, 100, 10, 'BUY');
                expect(pnl).toBe(0);
            });

            test('leverage multiplies profit', () => {
                const pnl1x = calculatePnL(100, 110, 10, 'BUY', 1);
                const pnl10x = calculatePnL(100, 110, 10, 'BUY', 10);
                expect(pnl10x).toBe(pnl1x * 10);
            });

            test('leverage multiplies loss', () => {
                const pnl1x = calculatePnL(100, 90, 10, 'BUY', 1);
                const pnl10x = calculatePnL(100, 90, 10, 'BUY', 10);
                expect(pnl10x).toBe(pnl1x * 10);
            });
        });

        describe('SELL positions', () => {
            test('profit when price goes down', () => {
                const pnl = calculatePnL(100, 90, 10, 'SELL');
                expect(pnl).toBe(100); // (100-90) * 10
            });

            test('loss when price goes up', () => {
                const pnl = calculatePnL(100, 110, 10, 'SELL');
                expect(pnl).toBe(-100); // (100-110) * 10
            });

            test('zero P&L when price unchanged', () => {
                const pnl = calculatePnL(100, 100, 10, 'SELL');
                expect(pnl).toBe(0);
            });
        });
    });

    describe('P&L Percentage', () => {
        test('calculates percentage gain', () => {
            const pnlPercent = calculatePnLPercent(100, 110, 'BUY');
            expect(pnlPercent).toBe(10); // 10% gain
        });

        test('calculates percentage loss', () => {
            const pnlPercent = calculatePnLPercent(100, 90, 'BUY');
            expect(pnlPercent).toBe(-10); // 10% loss
        });

        test('leverage multiplies percentage', () => {
            const pnl1x = calculatePnLPercent(100, 110, 'BUY', 1);
            const pnl10x = calculatePnLPercent(100, 110, 'BUY', 10);
            expect(pnl10x).toBe(100); // 10% * 10x = 100%
        });
    });

    describe('Trading Pairs', () => {
        test('forex pairs have small spreads', () => {
            TRADING_PAIRS.forex.forEach(pair => {
                expect(pair.spread).toBeLessThan(10);
            });
        });

        test('crypto pairs have larger spreads', () => {
            TRADING_PAIRS.crypto.forEach(pair => {
                expect(pair.spread).toBeGreaterThanOrEqual(5);
            });
        });

        test('all pairs have symbol and spread', () => {
            Object.values(TRADING_PAIRS).flat().forEach(pair => {
                expect(pair.symbol).toBeDefined();
                expect(pair.spread).toBeDefined();
                expect(pair.spread).toBeGreaterThan(0);
            });
        });
    });

    describe('Order Validation', () => {
        function validateOrder(order) {
            const errors = [];
            
            if (!order.symbol) errors.push('Symbol required');
            if (!order.type || !['BUY', 'SELL'].includes(order.type)) {
                errors.push('Type must be BUY or SELL');
            }
            if (!order.quantity || order.quantity <= 0) {
                errors.push('Quantity must be positive');
            }
            if (order.leverage && (order.leverage < 1 || order.leverage > 100)) {
                errors.push('Leverage must be 1-100');
            }
            
            return { valid: errors.length === 0, errors };
        }

        test('valid order passes validation', () => {
            const result = validateOrder({
                symbol: 'BTC/USD',
                type: 'BUY',
                quantity: 1,
                leverage: 10
            });
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('missing symbol fails', () => {
            const result = validateOrder({ type: 'BUY', quantity: 1 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Symbol required');
        });

        test('invalid type fails', () => {
            const result = validateOrder({ symbol: 'BTC/USD', type: 'HOLD', quantity: 1 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Type must be BUY or SELL');
        });

        test('zero quantity fails', () => {
            const result = validateOrder({ symbol: 'BTC/USD', type: 'BUY', quantity: 0 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Quantity must be positive');
        });

        test('negative quantity fails', () => {
            const result = validateOrder({ symbol: 'BTC/USD', type: 'BUY', quantity: -1 });
            expect(result.valid).toBe(false);
        });

        test('leverage over 100 fails', () => {
            const result = validateOrder({ symbol: 'BTC/USD', type: 'BUY', quantity: 1, leverage: 150 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Leverage must be 1-100');
        });
    });
});
