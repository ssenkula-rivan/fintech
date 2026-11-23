/**
 * Airtel Money API Integration
 * Real implementation for Uganda market
 */

const axios = require('axios');
const crypto = require('crypto');

class AirtelMoneyService {
    constructor() {
        this.clientId = process.env.AIRTEL_CLIENT_ID;
        this.clientSecret = process.env.AIRTEL_CLIENT_SECRET;
        this.merchantPin = process.env.AIRTEL_MERCHANT_PIN;
        this.environment = process.env.AIRTEL_ENVIRONMENT || 'sandbox';
        this.callbackUrl = process.env.AIRTEL_CALLBACK_URL;
        
        this.baseURL = this.environment === 'production'
            ? 'https://openapiuat.airtel.africa'
            : 'https://openapiuat.airtel.africa'; // Same for sandbox
            
        this.accessToken = null;
        this.tokenExpiry = null;
    }
    
    /**
     * Check if service is configured
     */
    isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }
    
    /**
     * Get access token
     */
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        
        try {
            const response = await axios.post(
                `${this.baseURL}/auth/oauth2/token`,
                {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'client_credentials'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    }
                }
            );
            
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
            
            return this.accessToken;
        } catch (error) {
            console.error('Airtel Money token error:', error.response?.data || error.message);
            throw new Error('Failed to get Airtel Money access token');
        }
    }
    
    /**
     * Request payment from customer
     */
    async requestPayment({ phone, amount, reference, transactionId }) {
        if (!this.isConfigured()) {
            throw new Error('Airtel Money not configured');
        }
        
        const token = await this.getAccessToken();
        
        // Normalize phone for Airtel Uganda
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('256')) {
            normalizedPhone = normalizedPhone.substring(3);
        }
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = normalizedPhone.substring(1);
        }
        
        const requestBody = {
            reference: reference,
            subscriber: {
                country: 'UG',
                currency: 'UGX',
                msisdn: normalizedPhone
            },
            transaction: {
                amount: parseFloat(amount),
                country: 'UG',
                currency: 'UGX',
                id: transactionId || reference
            }
        };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/merchant/v1/payments/`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': '*/*',
                        'X-Country': 'UG',
                        'X-Currency': 'UGX'
                    }
                }
            );
            
            console.log(`✅ Airtel Money payment request sent: ${reference}`);
            
            return {
                success: true,
                transactionId: response.data.transaction?.id || transactionId,
                status: response.data.transaction?.status || 'PENDING',
                message: 'Payment request sent to customer'
            };
            
        } catch (error) {
            console.error('Airtel Money request error:', error.response?.data || error.message);
            throw new Error(`Airtel Money request failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Check payment status
     */
    async getPaymentStatus(transactionId) {
        if (!this.isConfigured()) {
            throw new Error('Airtel Money not configured');
        }
        
        const token = await this.getAccessToken();
        
        try {
            const response = await axios.get(
                `${this.baseURL}/standard/v1/payments/${transactionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': '*/*',
                        'X-Country': 'UG',
                        'X-Currency': 'UGX'
                    }
                }
            );
            
            return {
                transactionId,
                status: response.data.transaction?.status,
                amount: response.data.transaction?.amount,
                currency: response.data.transaction?.currency,
                airtelMoneyId: response.data.transaction?.airtel_money_id
            };
            
        } catch (error) {
            console.error('Airtel Money status error:', error.response?.data || error.message);
            throw new Error('Failed to get payment status');
        }
    }
    
    /**
     * Send money to customer (Disbursement)
     */
    async sendMoney({ phone, amount, reference, transactionId }) {
        if (!this.isConfigured()) {
            throw new Error('Airtel Money disbursement not configured');
        }
        
        const token = await this.getAccessToken();
        
        // Normalize phone
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('256')) {
            normalizedPhone = normalizedPhone.substring(3);
        }
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = normalizedPhone.substring(1);
        }
        
        const requestBody = {
            payee: {
                msisdn: normalizedPhone
            },
            reference: reference,
            transaction: {
                amount: parseFloat(amount),
                id: transactionId || reference
            }
        };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/standard/v1/disbursements/`,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': '*/*',
                        'X-Country': 'UG',
                        'X-Currency': 'UGX'
                    }
                }
            );
            
            return {
                success: true,
                transactionId: response.data.transaction?.id || transactionId,
                status: 'PENDING',
                message: 'Money sent to customer'
            };
            
        } catch (error) {
            console.error('Airtel Money disbursement error:', error.response?.data || error.message);
            throw new Error(`Airtel Money disbursement failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const webhookSecret = process.env.AIRTEL_WEBHOOK_SECRET;
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

module.exports = new AirtelMoneyService();