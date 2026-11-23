/**
 * MTN Mobile Money API Integration
 * Real implementation for Uganda market
 */

const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class MTNMoMoService {
    constructor() {
        this.apiUser = process.env.MTN_MOMO_API_USER;
        this.apiKey = process.env.MTN_MOMO_API_KEY;
        this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
        this.disbursementKey = process.env.MTN_MOMO_DISBURSEMENT_KEY;
        this.environment = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
        this.callbackUrl = process.env.MTN_MOMO_CALLBACK_URL;
        
        // MTN MoMo API URLs
        // Sandbox: https://sandbox.momodeveloper.mtn.com
        // Production: https://proxy.momoapi.mtn.com (for live testing)
        // Production (Uganda): https://proxy.momoapi.mtn.com
        if (this.environment === 'production' || this.environment === 'live') {
            this.baseURL = 'https://proxy.momoapi.mtn.com';
            this.targetEnvironment = 'mtncameroon'; // or 'mtnuganda' depending on country
        } else {
            this.baseURL = 'https://sandbox.momodeveloper.mtn.com';
            this.targetEnvironment = 'sandbox';
        }
            
        this.accessToken = null;
        this.tokenExpiry = null;
    }
    
    /**
     * Check if service is properly configured
     */
    isConfigured() {
        return !!(this.apiUser && this.apiKey && this.subscriptionKey);
    }
    
    /**
     * Create API User (Required for production setup)
     * This is a one-time setup step to create your API user
     * @param {string} subscriptionKey - Your Ocp-Apim-Subscription-Key
     * @param {string} callbackHost - Your callback URL host (e.g., https://yourdomain.com)
     */
    async createApiUser(subscriptionKey, callbackHost) {
        const referenceId = uuidv4();
        
        try {
            const response = await axios.post(
                `${this.baseURL}/v1_0/apiuser`,
                {
                    providerCallbackHost: callbackHost
                },
                {
                    headers: {
                        'X-Reference-Id': referenceId,
                        'Ocp-Apim-Subscription-Key': subscriptionKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ MTN MoMo API User created: ${referenceId}`);
            
            return {
                success: true,
                apiUserId: referenceId,
                message: 'API User created. Now call createApiKey() to get your API key.'
            };
            
        } catch (error) {
            console.error('MTN MoMo create API user error:', error.response?.data || error.message);
            throw new Error(`Failed to create API user: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Create API Key for the API User
     * Call this after createApiUser()
     * @param {string} apiUserId - The X-Reference-Id used when creating the API user
     * @param {string} subscriptionKey - Your Ocp-Apim-Subscription-Key
     */
    async createApiKey(apiUserId, subscriptionKey) {
        try {
            const response = await axios.post(
                `${this.baseURL}/v1_0/apiuser/${apiUserId}/apikey`,
                {},
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': subscriptionKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ MTN MoMo API Key created for user: ${apiUserId}`);
            
            return {
                success: true,
                apiKey: response.data.apiKey,
                message: 'API Key created. Store this securely in your environment variables.'
            };
            
        } catch (error) {
            console.error('MTN MoMo create API key error:', error.response?.data || error.message);
            throw new Error(`Failed to create API key: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get API User details
     * @param {string} apiUserId - The API user ID
     * @param {string} subscriptionKey - Your Ocp-Apim-Subscription-Key
     */
    async getApiUser(apiUserId, subscriptionKey) {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1_0/apiuser/${apiUserId}`,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': subscriptionKey
                    }
                }
            );
            
            return {
                success: true,
                data: response.data
            };
            
        } catch (error) {
            console.error('MTN MoMo get API user error:', error.response?.data || error.message);
            throw new Error(`Failed to get API user: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get access token for API calls
     */
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        
        try {
            const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
            
            const response = await axios.post(
                `${this.baseURL}/collection/token/`,
                {},
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
            
            return this.accessToken;
        } catch (error) {
            console.error('MTN MoMo token error:', error.response?.data || error.message);
            throw new Error('Failed to get MTN MoMo access token');
        }
    }
    
    /**
     * Request payment from customer (Collection)
     */
    async requestPayment({ phone, amount, currency = 'UGX', externalId, payerMessage, payeeNote }) {
        if (!this.isConfigured()) {
            throw new Error('MTN MoMo not configured');
        }
        
        const token = await this.getAccessToken();
        const referenceId = uuidv4();
        
        // Normalize phone number for MTN Uganda
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('256')) {
            normalizedPhone = normalizedPhone.substring(3);
        }
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = normalizedPhone.substring(1);
        }
        normalizedPhone = '256' + normalizedPhone;
        
        const requestBody = {
            amount: amount.toString(),
            currency,
            externalId: externalId || referenceId,
            payer: {
                partyIdType: 'MSISDN',
                partyId: normalizedPhone
            },
            payerMessage: payerMessage || 'Payment request',
            payeeNote: payeeNote || 'GMG Global payment'
        };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/collection/v1_0/requesttopay`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': this.targetEnvironment,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                        'Content-Type': 'application/json',
                        'X-Callback-Url': this.callbackUrl || undefined
                    }
                }
            );
            
            console.log(`✅ MTN MoMo payment request sent: ${referenceId}`);
            
            return {
                success: true,
                referenceId,
                status: 'PENDING',
                message: 'Payment request sent to customer phone'
            };
            
        } catch (error) {
            console.error('MTN MoMo request error:', error.response?.data || error.message);
            throw new Error(`MTN MoMo request failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Check payment status
     */
    async getPaymentStatus(referenceId) {
        if (!this.isConfigured()) {
            throw new Error('MTN MoMo not configured');
        }
        
        const token = await this.getAccessToken();
        
        try {
            const response = await axios.get(
                `${this.baseURL}/collection/v1_0/requesttopay/${referenceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Target-Environment': this.targetEnvironment,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );
            
            return {
                referenceId,
                status: response.data.status,
                amount: response.data.amount,
                currency: response.data.currency,
                financialTransactionId: response.data.financialTransactionId,
                externalId: response.data.externalId,
                reason: response.data.reason
            };
            
        } catch (error) {
            console.error('MTN MoMo status error:', error.response?.data || error.message);
            throw new Error('Failed to get payment status');
        }
    }
    
    /**
     * Send money to customer (Disbursement)
     */
    async sendMoney({ phone, amount, currency = 'UGX', externalId, payeeNote }) {
        if (!this.disbursementKey) {
            throw new Error('MTN MoMo disbursement not configured');
        }
        
        const token = await this.getAccessToken();
        const referenceId = uuidv4();
        
        // Normalize phone
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('256')) {
            normalizedPhone = normalizedPhone.substring(3);
        }
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = normalizedPhone.substring(1);
        }
        normalizedPhone = '256' + normalizedPhone;
        
        const requestBody = {
            amount: amount.toString(),
            currency,
            externalId: externalId || referenceId,
            payee: {
                partyIdType: 'MSISDN',
                partyId: normalizedPhone
            },
            payerMessage: 'Money transfer from GMG Global',
            payeeNote: payeeNote || 'Money transfer'
        };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/disbursement/v1_0/transfer`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': this.environment,
                        'Ocp-Apim-Subscription-Key': this.disbursementKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                success: true,
                referenceId,
                status: 'PENDING',
                message: 'Money sent to customer'
            };
            
        } catch (error) {
            console.error('MTN MoMo disbursement error:', error.response?.data || error.message);
            throw new Error(`MTN MoMo disbursement failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const webhookSecret = process.env.MTN_WEBHOOK_SECRET;
        if (!webhookSecret) return false;
        
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');
            
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

module.exports = new MTNMoMoService();