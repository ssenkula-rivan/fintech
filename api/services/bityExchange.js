/**
 * Bity Exchange API Integration - REAL Implementation
 * Cryptocurrency exchange service for BTC, ETH ↔ CHF, EUR
 * 
 * API Documentation: https://doc.bity.com/exchange/
 * 
 * REQUIRED ENV:
 * - BITY_CLIENT_ID: OAuth2 Client ID (for authenticated requests)
 * - BITY_CLIENT_SECRET: OAuth2 Client Secret
 * - BITY_ENVIRONMENT: 'production' or 'sandbox'
 * 
 * Get credentials at: https://bity.com/
 */

const https = require('https');

// API Configuration
const CONFIG = {
    baseUrl: 'exchange.api.bity.com',
    version: 'v2',
    authUrl: 'connect.bity.com'
};

// Token cache
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

/**
 * Get environment configuration
 */
function getConfig() {
    return {
        clientId: process.env.BITY_CLIENT_ID,
        clientSecret: process.env.BITY_CLIENT_SECRET,
        environment: process.env.BITY_ENVIRONMENT || 'production'
    };
}

/**
 * Check if Bity is configured
 */
function isConfigured() {
    const config = getConfig();
    return !!(config.clientId && config.clientSecret);
}

/**
 * Make HTTPS request to Bity API
 */
function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.baseUrl,
            path: `/${CONFIG.version}${path}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Handle empty responses
                    if (!data && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ statusCode: res.statusCode, headers: res.headers });
                        return;
                    }
                    
                    const parsed = data ? JSON.parse(data) : {};
                    
                    if (res.statusCode >= 400) {
                        reject({
                            statusCode: res.statusCode,
                            error: parsed.error || parsed.message || 'API Error',
                            details: parsed
                        });
                        return;
                    }
                    
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsed
                    });
                } catch (e) {
                    reject({ error: 'Failed to parse response', raw: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/**
 * Get OAuth2 access token (for authenticated endpoints)
 */
async function getAccessToken() {
    const config = getConfig();
    
    if (!config.clientId || !config.clientSecret) {
        return null; // Unauthenticated mode
    }

    // Return cached token if valid
    if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    return new Promise((resolve, reject) => {
        const payload = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: 'https://auth.bity.com/scopes/exchange.place'
        }).toString();

        const options = {
            hostname: CONFIG.authUrl,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        reject(new Error(parsed.error_description || 'Auth failed'));
                        return;
                    }

                    tokenCache = {
                        accessToken: parsed.access_token,
                        expiresAt: Date.now() + (parsed.expires_in * 1000) - 60000
                    };

                    resolve(parsed.access_token);
                } catch (e) {
                    reject(new Error('Failed to parse auth response'));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}


/**
 * Get list of supported currencies
 * @param {string[]} tags - Filter by tags: 'crypto', 'fiat', 'ethereum', 'erc20'
 */
async function getCurrencies(tags = []) {
    let path = '/currencies';
    if (tags.length > 0) {
        path += `?tags=${tags.join(',')}`;
    }
    
    const response = await makeRequest('GET', path);
    return response.data.currencies;
}

/**
 * Get supported currency pairs
 * @param {object} filters - Optional filters
 */
async function getCurrencyPairs(filters = {}) {
    let path = '/pairs';
    const params = new URLSearchParams();
    
    if (filters.input) params.append('input', filters.input);
    if (filters.output) params.append('output', filters.output);
    if (filters.enabled !== undefined) params.append('enabled', filters.enabled);
    
    const queryString = params.toString();
    if (queryString) path += `?${queryString}`;
    
    const response = await makeRequest('GET', path);
    return response.data.pairs;
}

/**
 * Estimate exchange amount
 * @param {object} params - Estimation parameters
 * @param {string} params.inputCurrency - Input currency code (e.g., 'CHF', 'BTC')
 * @param {string} params.outputCurrency - Output currency code
 * @param {string} params.inputAmount - Amount to exchange (optional if outputAmount provided)
 * @param {string} params.outputAmount - Desired output amount (optional if inputAmount provided)
 * @param {string} params.inputType - 'bank_account', 'crypto_address', 'online_instant_payment'
 * @param {string} params.outputType - 'bank_account', 'crypto_address'
 */
async function estimateAmount(params) {
    const {
        inputCurrency,
        outputCurrency,
        inputAmount,
        outputAmount,
        inputType,
        outputType
    } = params;

    // Determine input/output types based on currency if not specified
    const isCrypto = (currency) => ['BTC', 'ETH', 'USDC', 'USDT'].includes(currency.toUpperCase());
    
    const body = {
        input: {
            currency: inputCurrency.toUpperCase(),
            type: inputType || (isCrypto(inputCurrency) ? 'crypto_address' : 'bank_account')
        },
        output: {
            currency: outputCurrency.toUpperCase(),
            type: outputType || (isCrypto(outputCurrency) ? 'crypto_address' : 'bank_account')
        }
    };

    // Either input amount or output amount must be specified
    if (inputAmount) {
        body.input.amount = String(inputAmount);
    } else if (outputAmount) {
        body.output.amount = String(outputAmount);
    } else {
        throw new Error('Either inputAmount or outputAmount must be specified');
    }

    const response = await makeRequest('POST', '/orders/estimate', body);
    
    return {
        input: {
            currency: response.data.input.currency,
            amount: response.data.input.amount,
            minimumAmount: response.data.input.minimum_amount,
            type: response.data.input.type
        },
        output: {
            currency: response.data.output.currency,
            amount: response.data.output.amount,
            minimumAmount: response.data.output.minimum_amount,
            type: response.data.output.type
        },
        priceBreakdown: response.data.price_breakdown,
        orderingRequirements: response.data.ordering_requirements
    };
}

/**
 * Place a crypto exchange order
 * @param {object} params - Order parameters
 */
async function placeOrder(params) {
    const {
        inputCurrency,
        outputCurrency,
        inputAmount,
        outputAmount,
        // For crypto output
        cryptoAddress,
        // For bank output
        iban,
        bicSwift,
        ownerName,
        ownerAddress,
        ownerCity,
        ownerCountry,
        ownerZip,
        // For crypto input (optional - for verification)
        inputCryptoAddress,
        // Contact info
        contactEmail,
        // Purpose
        purpose
    } = params;

    const isCrypto = (currency) => ['BTC', 'ETH', 'USDC', 'USDT'].includes(currency.toUpperCase());
    
    const body = {
        input: {
            currency: inputCurrency.toUpperCase(),
            type: isCrypto(inputCurrency) ? 'crypto_address' : 'bank_account'
        },
        output: {
            currency: outputCurrency.toUpperCase(),
            type: isCrypto(outputCurrency) ? 'crypto_address' : 'bank_account'
        }
    };

    // Set amount
    if (inputAmount) {
        body.input.amount = String(inputAmount);
    } else if (outputAmount) {
        body.output.amount = String(outputAmount);
    }

    // Input crypto address (for verification)
    if (inputCryptoAddress && isCrypto(inputCurrency)) {
        body.input.crypto_address = inputCryptoAddress;
    }

    // Output details
    if (isCrypto(outputCurrency)) {
        if (!cryptoAddress) {
            throw new Error('cryptoAddress required for crypto output');
        }
        body.output.crypto_address = cryptoAddress;
    } else {
        // Bank account output
        if (!iban || !ownerName) {
            throw new Error('iban and ownerName required for bank output');
        }
        body.output.iban = iban;
        if (bicSwift) body.output.bic_swift = bicSwift;
        body.output.owner = {
            name: ownerName
        };
        if (ownerAddress) body.output.owner.address = ownerAddress;
        if (ownerCity) body.output.owner.city = ownerCity;
        if (ownerCountry) body.output.owner.country = ownerCountry;
        if (ownerZip) body.output.owner.zip = ownerZip;
    }

    // Contact person
    if (contactEmail) {
        body.contact_person = { email: contactEmail };
    }

    // Purpose
    if (purpose) {
        body.purpose = { comment: purpose };
    }

    // Get auth token if available
    const headers = {};
    const token = await getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await makeRequest('POST', '/orders', body, headers);
    
    // Extract order ID from Location header
    const locationHeader = response.headers.location || response.headers.Location;
    const orderId = locationHeader ? locationHeader.split('/').pop() : null;

    return {
        success: true,
        orderId,
        location: locationHeader,
        statusCode: response.statusCode
    };
}

/**
 * Get order details
 * @param {string} orderId - Order UUID
 */
async function getOrder(orderId) {
    const headers = {};
    const token = await getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await makeRequest('GET', `/orders/${orderId}`, null, headers);
    const order = response.data;

    return {
        id: order.id,
        status: getOrderStatus(order),
        input: {
            currency: order.input?.currency,
            amount: order.input?.amount,
            type: order.input?.type,
            cryptoAddress: order.input?.crypto_address,
            iban: order.input?.iban
        },
        output: {
            currency: order.output?.currency,
            amount: order.output?.amount,
            type: order.output?.type,
            cryptoAddress: order.output?.crypto_address,
            iban: order.output?.iban
        },
        paymentDetails: order.payment_details,
        priceBreakdown: order.price_breakdown,
        messageToSign: order.message_to_sign,
        timestamps: {
            created: order.timestamp_created,
            awaitingPaymentSince: order.timestamp_awaiting_payment_since,
            priceGuaranteed: order.timestamp_price_guaranteed,
            paymentReceived: order.timestamp_payment_received,
            executed: order.timestamp_executed,
            cancelled: order.timestamp_cancelled
        }
    };
}

/**
 * Determine order status from timestamps
 */
function getOrderStatus(order) {
    if (order.timestamp_cancelled) return 'CANCELLED';
    if (order.timestamp_executed) return 'COMPLETED';
    if (order.timestamp_payment_received) return 'PROCESSING';
    if (order.timestamp_awaiting_payment_since) return 'AWAITING_PAYMENT';
    if (order.message_to_sign) return 'AWAITING_SIGNATURE';
    return 'PENDING';
}

/**
 * Cancel an order
 * @param {string} orderId - Order UUID
 */
async function cancelOrder(orderId) {
    const headers = {};
    const token = await getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await makeRequest('POST', `/orders/${orderId}/cancel`, null, headers);
    
    return {
        success: response.statusCode === 202 || response.statusCode === 204,
        statusCode: response.statusCode,
        message: response.statusCode === 204 ? 'Order cancelled' : 'Cancellation in progress'
    };
}

/**
 * Submit signature for crypto-to-crypto orders
 * @param {string} orderId - Order UUID
 * @param {string} signature - Signed message
 */
async function submitSignature(orderId, signature) {
    const response = await makeRequest(
        'POST',
        `/orders/${orderId}/signature`,
        signature,
        { 'Content-Type': 'text/plain' }
    );

    return {
        success: response.statusCode === 204,
        message: response.statusCode === 204 ? 'Signature verified' : 'Signature verification failed'
    };
}

/**
 * List orders (requires authentication)
 * @param {object} options - List options
 */
async function listOrders(options = {}) {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Authentication required to list orders');
    }

    let path = '/orders';
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('page_size', options.pageSize);
    if (options.status) params.append('status', options.status);
    
    const queryString = params.toString();
    if (queryString) path += `?${queryString}`;

    const response = await makeRequest('GET', path, null, {
        'Authorization': `Bearer ${token}`
    });

    return {
        orders: response.data.orders.map(order => ({
            id: order.id,
            status: getOrderStatus(order),
            input: order.input,
            output: order.output,
            created: order.timestamp_created
        })),
        pagination: response.data.pagination
    };
}

/**
 * Get supported crypto currencies
 */
async function getCryptoCurrencies() {
    return getCurrencies(['crypto']);
}

/**
 * Get supported fiat currencies
 */
async function getFiatCurrencies() {
    return getCurrencies(['fiat']);
}

module.exports = {
    // Configuration
    isConfigured,
    getConfig,
    
    // Currencies
    getCurrencies,
    getCryptoCurrencies,
    getFiatCurrencies,
    getCurrencyPairs,
    
    // Estimation
    estimateAmount,
    
    // Orders
    placeOrder,
    getOrder,
    cancelOrder,
    listOrders,
    submitSignature,
    
    // Auth
    getAccessToken
};
