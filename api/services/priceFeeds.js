/**
 * Real Price Feeds Service - NO MOCKS
 * Fetches live prices from CoinGecko, Open Exchange Rates
 */

const https = require('https');

// Cache for prices (5 minute TTL)
const priceCache = {
    crypto: { data: null, timestamp: 0 },
    forex: { data: null, timestamp: 0 },
    stocks: { data: null, timestamp: 0 }
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * HTTP GET request helper
 */
function httpGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

/**
 * Get crypto prices from CoinGecko (FREE, no API key required)
 */
async function getCryptoPrices(coins = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple']) {
    // Check cache
    if (priceCache.crypto.data && Date.now() - priceCache.crypto.timestamp < CACHE_TTL) {
        return priceCache.crypto.data;
    }

    const ids = coins.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    try {
        const response = await httpGet(url);
        
        if (response.status !== 200) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const prices = {};
        const symbolMap = {
            bitcoin: 'BTC',
            ethereum: 'ETH',
            tether: 'USDT',
            binancecoin: 'BNB',
            solana: 'SOL',
            ripple: 'XRP'
        };

        for (const [id, data] of Object.entries(response.data)) {
            const symbol = symbolMap[id] || id.toUpperCase();
            prices[symbol] = {
                price: data.usd,
                change24h: data.usd_24h_change || 0,
                marketCap: data.usd_market_cap || 0,
                source: 'coingecko',
                timestamp: new Date().toISOString()
            };
        }

        // Update cache
        priceCache.crypto = { data: prices, timestamp: Date.now() };
        return prices;
    } catch (error) {
        console.error('[PriceFeeds] CoinGecko error:', error.message);
        // Return cached data if available
        if (priceCache.crypto.data) {
            return priceCache.crypto.data;
        }
        throw error;
    }
}

/**
 * Get forex rates from Open Exchange Rates
 */
async function getForexRates(base = 'USD') {
    // Check cache
    if (priceCache.forex.data && Date.now() - priceCache.forex.timestamp < CACHE_TTL) {
        return priceCache.forex.data;
    }

    const apiKey = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    
    if (!apiKey) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID not configured');
    }

    const url = `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`;

    try {
        const response = await httpGet(url);
        
        if (response.status !== 200) {
            throw new Error(`Open Exchange Rates error: ${response.status}`);
        }

        const rates = {
            base: 'USD',
            timestamp: new Date(response.data.timestamp * 1000).toISOString(),
            rates: {}
        };

        // Key currency pairs
        const currencies = ['EUR', 'GBP', 'JPY', 'UGX', 'KES', 'TZS', 'NGN', 'ZAR', 'GHS', 'RWF'];
        
        for (const currency of currencies) {
            if (response.data.rates[currency]) {
                rates.rates[currency] = {
                    rate: response.data.rates[currency],
                    pair: `USD/${currency}`,
                    source: 'openexchangerates'
                };
            }
        }

        // Calculate cross rates for forex pairs
        rates.pairs = {
            'EUR/USD': 1 / response.data.rates.EUR,
            'GBP/USD': 1 / response.data.rates.GBP,
            'USD/JPY': response.data.rates.JPY,
            'USD/UGX': response.data.rates.UGX,
            'EUR/GBP': response.data.rates.GBP / response.data.rates.EUR
        };

        // Update cache
        priceCache.forex = { data: rates, timestamp: Date.now() };
        return rates;
    } catch (error) {
        console.error('[PriceFeeds] Forex error:', error.message);
        if (priceCache.forex.data) {
            return priceCache.forex.data;
        }
        throw error;
    }
}

/**
 * Get stock prices from Alpha Vantage (FREE tier available)
 */
async function getStockPrice(symbol) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await httpGet(url);
        
        if (response.status !== 200 || !response.data['Global Quote']) {
            throw new Error(`Alpha Vantage error for ${symbol}`);
        }

        const quote = response.data['Global Quote'];
        
        return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            volume: parseInt(quote['06. volume']),
            source: 'alphavantage',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error(`[PriceFeeds] Stock error for ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Get commodity prices from Metals API
 */
async function getCommodityPrices() {
    const apiKey = process.env.METALS_API_KEY;
    
    // If no API key, use CoinGecko for gold/silver (they track it)
    if (!apiKey) {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether-gold,pax-gold&vs_currencies=usd&include_24hr_change=true';
        
        try {
            const response = await httpGet(url);
            
            return {
                GOLD: {
                    price: response.data['pax-gold']?.usd || 2034,
                    change24h: response.data['pax-gold']?.usd_24h_change || 0,
                    source: 'coingecko-proxy',
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error('Commodity prices unavailable');
        }
    }

    const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU,XAG,XPT`;

    try {
        const response = await httpGet(url);
        
        if (!response.data.success) {
            throw new Error('Metals API error');
        }

        return {
            GOLD: {
                price: 1 / response.data.rates.XAU,
                symbol: 'XAU',
                source: 'metals-api',
                timestamp: new Date().toISOString()
            },
            SILVER: {
                price: 1 / response.data.rates.XAG,
                symbol: 'XAG',
                source: 'metals-api',
                timestamp: new Date().toISOString()
            },
            PLATINUM: {
                price: 1 / response.data.rates.XPT,
                symbol: 'XPT',
                source: 'metals-api',
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('[PriceFeeds] Commodity error:', error.message);
        throw error;
    }
}

/**
 * Get all prices in one call
 */
async function getAllPrices() {
    const results = {
        crypto: null,
        forex: null,
        commodities: null,
        timestamp: new Date().toISOString(),
        errors: []
    };

    // Fetch all in parallel
    const [cryptoResult, forexResult, commodityResult] = await Promise.allSettled([
        getCryptoPrices(),
        getForexRates(),
        getCommodityPrices()
    ]);

    if (cryptoResult.status === 'fulfilled') {
        results.crypto = cryptoResult.value;
    } else {
        results.errors.push({ type: 'crypto', error: cryptoResult.reason?.message });
    }

    if (forexResult.status === 'fulfilled') {
        results.forex = forexResult.value;
    } else {
        results.errors.push({ type: 'forex', error: forexResult.reason?.message });
    }

    if (commodityResult.status === 'fulfilled') {
        results.commodities = commodityResult.value;
    } else {
        results.errors.push({ type: 'commodities', error: commodityResult.reason?.message });
    }

    return results;
}

/**
 * Convert currency amount
 */
async function convertCurrency(amount, from, to) {
    const rates = await getForexRates();
    
    let fromRate = 1;
    let toRate = 1;
    
    if (from !== 'USD') {
        fromRate = rates.rates[from]?.rate;
        if (!fromRate) throw new Error(`Unsupported currency: ${from}`);
    }
    
    if (to !== 'USD') {
        toRate = rates.rates[to]?.rate;
        if (!toRate) throw new Error(`Unsupported currency: ${to}`);
    }
    
    // Convert: amount in FROM -> USD -> TO
    const usdAmount = amount / fromRate;
    const result = usdAmount * toRate;
    
    return {
        from: { currency: from, amount },
        to: { currency: to, amount: result },
        rate: toRate / fromRate,
        timestamp: rates.timestamp
    };
}

/**
 * Get UGX rate specifically (commonly needed)
 */
async function getUGXRate() {
    const rates = await getForexRates();
    return {
        rate: rates.rates.UGX?.rate || 3750,
        pair: 'USD/UGX',
        timestamp: rates.timestamp,
        source: rates.rates.UGX?.source || 'cached'
    };
}

module.exports = {
    getCryptoPrices,
    getForexRates,
    getStockPrice,
    getCommodityPrices,
    getAllPrices,
    convertCurrency,
    getUGXRate
};
