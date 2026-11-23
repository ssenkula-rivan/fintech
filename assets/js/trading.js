/**
 * GMG Uganda - Trading Module
 * PRODUCTION - NO MOCKS
 * Real API integration for Forex, Stocks, Crypto, Commodities
 */

const Trading = {
    portfolio: { forex: 0, stocks: 0, crypto: 0, commodities: 0, total: 0 },
    positions: [],
    trades: [],
    prices: {},
    priceUpdateInterval: null,
    tradeType: 'BUY',

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════

    async init() {
        console.log('[Trading] Initializing...');
        await Promise.all([
            this.loadPortfolio(),
            this.loadPositions(),
            this.loadPrices()
        ]);
        this.startPriceUpdates();
    },

    // ═══════════════════════════════════════════════════════════════════
    // REAL DATA LOADING
    // ═══════════════════════════════════════════════════════════════════

    async loadPortfolio() {
        try {
            const response = await fetch('/api/trading/portfolio', {
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.portfolio = data.portfolio || this.portfolio;
                this.updatePortfolioDisplay();
            }
        } catch (error) {
            console.error('[Trading] Portfolio error:', error);
        }
    },

    async loadPositions() {
        try {
            const response = await fetch('/api/trading/positions', {
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.positions = data.positions || [];
                this.renderPositions();
            }
        } catch (error) {
            console.error('[Trading] Positions error:', error);
        }
    },


    async loadPrices() {
        try {
            const response = await fetch('/api/trading/prices');
            if (response.ok) {
                const data = await response.json();
                this.prices = data;
                this.updateMarketTicker();
            }
        } catch (error) {
            console.error('[Trading] Prices error:', error);
        }
    },

    async loadTrades() {
        try {
            const response = await fetch('/api/trading/history', {
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.trades = data.trades || [];
                this.renderTrades();
            }
        } catch (error) {
            console.error('[Trading] Trades error:', error);
        }
    },

    getAuthHeaders() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    // ═══════════════════════════════════════════════════════════════════
    // UI UPDATES
    // ═══════════════════════════════════════════════════════════════════

    updatePortfolioDisplay() {
        const totalEl = document.getElementById('portfolio-value');
        const changeEl = document.getElementById('portfolio-change');
        
        if (totalEl) totalEl.textContent = `$${this.formatNumber(this.portfolio.total)}`;
        
        if (changeEl) {
            const change = this.portfolio.change24h || 0;
            const isPositive = change >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}$${this.formatNumber(Math.abs(change))}`;
            changeEl.className = `text-sm ${isPositive ? 'text-green-300' : 'text-red-300'}`;
        }
    },

    renderPositions() {
        const container = document.getElementById('open-positions-list');
        const countEl = document.getElementById('positions-count');
        
        if (countEl) countEl.textContent = `${this.positions.length} position${this.positions.length !== 1 ? 's' : ''}`;
        if (!container) return;

        if (this.positions.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-4"><p class="text-sm">No open positions</p></div>';
            return;
        }

        container.innerHTML = this.positions.map(pos => {
            const pnl = pos.unrealizedPnl || 0;
            const isProfit = pnl >= 0;
            return `
                <div class="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <div class="text-white font-bold text-sm">${pos.symbol}</div>
                        <div class="text-gray-400 text-xs">${pos.type} • ${pos.quantity} units</div>
                    </div>
                    <div class="text-right">
                        <div class="${isProfit ? 'text-green-400' : 'text-red-400'} font-bold text-sm">
                            ${isProfit ? '+' : ''}$${this.formatNumber(pnl)}
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    renderTrades() {
        const container = document.getElementById('recent-trades-list');
        if (!container) return;

        if (this.trades.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-4"><p class="text-sm">No recent trades</p></div>';
            return;
        }

        container.innerHTML = this.trades.slice(0, 5).map(trade => `
            <div class="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <div class="text-white font-bold text-sm">${trade.symbol}</div>
                    <div class="text-gray-400 text-xs">${trade.side} • ${this.formatRelativeTime(trade.createdAt)}</div>
                </div>
                <div class="text-right">
                    <div class="text-white font-bold text-sm">$${this.formatNumber(trade.amount)}</div>
                    <div class="${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'} text-xs">${trade.status}</div>
                </div>
            </div>`).join('');
    },

    // ═══════════════════════════════════════════════════════════════════
    // REAL PRICE TICKER
    // ═══════════════════════════════════════════════════════════════════

    updateMarketTicker() {
        const ticker = document.getElementById('market-ticker');
        if (!ticker || !this.prices) return;

        const items = [];
        
        if (this.prices.crypto) {
            for (const [symbol, data] of Object.entries(this.prices.crypto)) {
                const change = data.change24h || 0;
                items.push(`<span class="${change >= 0 ? 'text-green-400' : 'text-red-400'}">${symbol} $${this.formatNumber(data.price)} <span class="text-xs">${change >= 0 ? '+' : ''}${change.toFixed(1)}%</span></span>`);
            }
        }
        
        if (this.prices.forex?.pairs) {
            for (const [pair, rate] of Object.entries(this.prices.forex.pairs)) {
                items.push(`<span class="text-blue-400">${pair} ${rate.toFixed(4)}</span>`);
            }
        }

        ticker.innerHTML = items.join(' ');
    },

    startPriceUpdates() {
        this.priceUpdateInterval = setInterval(() => this.loadPrices(), 30000); // 30 seconds
    },

    stopPriceUpdates() {
        if (this.priceUpdateInterval) clearInterval(this.priceUpdateInterval);
    },


    // ═══════════════════════════════════════════════════════════════════
    // TRADING ACTIONS - REAL API CALLS
    // ═══════════════════════════════════════════════════════════════════

    selectPair(pair) { this.openTradeModal('forex', pair); },
    selectStock(symbol) { this.openTradeModal('stock', symbol); },
    selectCrypto(symbol) { this.openTradeModal('crypto', symbol); },
    selectCommodity(symbol) { this.openTradeModal('commodity', symbol); },

    openTradeModal(type, symbol) {
        document.getElementById('trade-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'trade-modal';
        modal.className = 'modal active';
        modal.onclick = (e) => { if (e.target === modal) this.closeTradeModal(); };
        
        modal.innerHTML = `
            <div class="modal-content bg-gray-900 text-white" style="max-width: 400px; margin: 20px; padding: 24px; border-radius: 16px;">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Trade ${symbol}</h2>
                    <button onclick="Trading.closeTradeModal()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-2">
                        <button id="btn-buy" onclick="Trading.setTradeType('BUY')" class="py-3 rounded-xl font-bold bg-green-600 text-white">BUY</button>
                        <button id="btn-sell" onclick="Trading.setTradeType('SELL')" class="py-3 rounded-xl font-bold bg-gray-700 text-gray-400">SELL</button>
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Amount (USD)</label>
                        <input type="number" id="trade-amount" placeholder="0.00" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg">
                    </div>
                    
                    <div class="grid grid-cols-4 gap-2">
                        <button onclick="Trading.setAmount(50)" class="py-2 bg-gray-800 rounded-lg text-sm">$50</button>
                        <button onclick="Trading.setAmount(100)" class="py-2 bg-gray-800 rounded-lg text-sm">$100</button>
                        <button onclick="Trading.setAmount(500)" class="py-2 bg-gray-800 rounded-lg text-sm">$500</button>
                        <button onclick="Trading.setAmount(1000)" class="py-2 bg-gray-800 rounded-lg text-sm">$1000</button>
                    </div>
                    
                    ${type === 'forex' ? `
                    <div>
                        <label class="block text-sm text-gray-400 mb-2">Leverage</label>
                        <select id="trade-leverage" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                            <option value="1">1:1</option>
                            <option value="10">1:10</option>
                            <option value="50">1:50</option>
                            <option value="100" selected>1:100</option>
                        </select>
                    </div>` : ''}
                    
                    <div class="bg-gray-800 rounded-xl p-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-gray-400">Asset</span>
                            <span class="text-white">${symbol}</span>
                        </div>
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-gray-400">Current Price</span>
                            <span class="text-white" id="current-price">Loading...</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Fee</span>
                            <span class="text-white">0.1%</span>
                        </div>
                    </div>
                    
                    <button onclick="Trading.executeTrade('${type}', '${symbol}')" class="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        Place Order
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.tradeType = 'BUY';
        this.loadAssetPrice(type, symbol);
    },

    closeTradeModal() {
        document.getElementById('trade-modal')?.remove();
    },

    setTradeType(type) {
        this.tradeType = type;
        const buyBtn = document.getElementById('btn-buy');
        const sellBtn = document.getElementById('btn-sell');
        
        if (type === 'BUY') {
            buyBtn.className = 'py-3 rounded-xl font-bold bg-green-600 text-white';
            sellBtn.className = 'py-3 rounded-xl font-bold bg-gray-700 text-gray-400';
        } else {
            buyBtn.className = 'py-3 rounded-xl font-bold bg-gray-700 text-gray-400';
            sellBtn.className = 'py-3 rounded-xl font-bold bg-red-600 text-white';
        }
    },

    setAmount(amount) {
        const input = document.getElementById('trade-amount');
        if (input) input.value = amount;
    },

    async loadAssetPrice(type, symbol) {
        const priceEl = document.getElementById('current-price');
        if (!priceEl) return;

        try {
            const response = await fetch(`/api/trading/price/${type}/${symbol}`);
            if (response.ok) {
                const data = await response.json();
                priceEl.textContent = type === 'forex' ? data.price.toFixed(4) : `$${this.formatNumber(data.price)}`;
            }
        } catch (error) {
            priceEl.textContent = 'N/A';
        }
    },

    async executeTrade(type, symbol) {
        const amount = parseFloat(document.getElementById('trade-amount')?.value);
        const leverage = parseInt(document.getElementById('trade-leverage')?.value) || 1;

        if (!amount || amount < 10) {
            alert('Minimum trade amount is $10');
            return;
        }

        try {
            const response = await fetch('/api/trading/order', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    type,
                    symbol,
                    side: this.tradeType,
                    amount,
                    leverage
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`✅ ${this.tradeType} order placed for ${symbol}!`);
                this.closeTradeModal();
                this.loadPortfolio();
                this.loadPositions();
            } else {
                alert(`❌ ${data.error || 'Order failed'}`);
            }
        } catch (error) {
            alert('Order failed. Please try again.');
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    },

    formatRelativeTime(dateString) {
        if (!dateString) return '';
        const diffMins = Math.floor((Date.now() - new Date(dateString)) / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    }
};

// Page integration
const originalShowPageTrading = window.showPage;
window.showPage = function(pageId) {
    if (originalShowPageTrading) originalShowPageTrading(pageId);
    if (['trading-page', 'forex-page', 'stocks-page', 'crypto-trading-page'].includes(pageId)) {
        Trading.init();
    }
};

window.Trading = Trading;
console.log('✅ Trading Module loaded - NO MOCKS');
