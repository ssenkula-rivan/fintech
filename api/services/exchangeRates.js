/**
 * Exchange Rate Service - REAL API Integration
 * Uses Open Exchange Rates API for live forex data
 * 
 * REQUIRED ENV:
 * - OPENEXCHANGERATES_APP_ID: Your API key from openexchangerates.org
 * 
 * Free tier: 1000 requests/month, hourly updates
 * Paid tier: Real-time rates, more currencies
 */

const https = require('https');

// Cache for rates (refresh every hour)
let ratesCache = {
    rates: null,
    timestamp: null,
    base: 'USD'
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rates from Open Exchange Rates API
 * @returns {Promise<object>} Exchange rates with USD as base
 */
async function fetchLiveRates() {
    const appId = process.env.OPENEXCHANGERATES_APP_ID;
    
    if (!appId) {
        throw new Error('OPENEXCHANGERATES_APP_ID not configured. Get a free key at https://openexchangerates.org/signup/free');
    }

    return new Promise((resolve, reject) => {
        const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.error) {
                        reject(new Error(parsed.description || 'API error'));
                        return;
                    }
                    
                    resolve({
                        base: parsed.base,
                        rates: parsed.rates,
                        timestamp: parsed.timestamp * 1000
                    });
                } catch (e) {
                    reject(new Error('Failed to parse exchange rate response'));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Get current exchange rates (with caching)
 * @param {boolean} forceRefresh - Force API call ignoring cache
 * @returns {Promise<object>} Exchange rates
 */
async function getRates(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached rates if valid
    if (!forceRefresh && ratesCache.rates && ratesCache.timestamp) {
        const age = now - ratesCache.timestamp;
        if (age < CACHE_TTL_MS) {
            return {
                ...ratesCache,
                cached: true,
                cacheAge: Math.round(age / 1000)
            };
        }
    }
    
    // Fetch fresh rates
    const liveRates = await fetchLiveRates();
    
    // Update cache
    ratesCache = {
        rates: liveRates.rates,
        timestamp: now,
        base: liveRates.base
    };
    
    return {
        ...ratesCache,
        cached: false
    };
}

/**
 * Convert amount between currencies using live rates
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @returns {Promise<object>} Conversion result
 */
async function convert(amount, from, to) {
    if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }
    
    from = from.toUpperCase();
    to = to.toUpperCase();
    
    const { rates, timestamp, cached } = await getRates();
    
    if (!rates[from]) {
        throw new Error(`Unsupported currency: ${from}`);
    }
    if (!rates[to]) {
        throw new Error(`Unsupported currency: ${to}`);
    }
    
    // Convert via USD (base currency)
    // from -> USD -> to
    const amountInUSD = amount / rates[from];
    const convertedAmount = amountInUSD * rates[to];
    const rate = rates[to] / rates[from];
    
    return {
        from,
        to,
        amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: Math.round(rate * 1000000) / 1000000,
        inverseRate: Math.round((1 / rate) * 1000000) / 1000000,
        timestamp: new Date(timestamp).toISOString(),
        cached
    };
}

/**
 * Get rate for specific currency pair
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @returns {Promise<number>} Exchange rate
 */
async function getRate(from, to) {
    const { rates } = await getRates();
    
    from = from.toUpperCase();
    to = to.toUpperCase();
    
    if (!rates[from] || !rates[to]) {
        return null;
    }
    
    return rates[to] / rates[from];
}

/**
 * Get all rates for a specific base currency
 * @param {string} base - Base currency code
 * @returns {Promise<object>} All rates relative to base
 */
async function getRatesForBase(base) {
    base = base.toUpperCase();
    const { rates, timestamp, cached } = await getRates();
    
    if (!rates[base]) {
        throw new Error(`Unsupported base currency: ${base}`);
    }
    
    const baseRate = rates[base];
    const convertedRates = {};
    
    for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== base) {
            convertedRates[currency] = Math.round((rate / baseRate) * 1000000) / 1000000;
        }
    }
    
    return {
        base,
        rates: convertedRates,
        timestamp: new Date(timestamp).toISOString(),
        cached
    };
}

/**
 * Supported African currencies for GMG Uganda
 */
const SUPPORTED_CURRENCIES = [
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', country: 'Uganda' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', country: 'Kenya' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', country: 'Tanzania' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', flag: '🇷🇼', country: 'Rwanda' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', country: 'Nigeria' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', country: 'Ghana' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'South Africa' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' }
];

function getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
}

function isSupportedCurrency(code) {
    return SUPPORTED_CURRENCIES.some(c => c.code === code.toUpperCase());
}

module.exports = {
    getRates,
    getRate,
    convert,
    getRatesForBase,
    getSupportedCurrencies,
    isSupportedCurrency,
    fetchLiveRates
};
