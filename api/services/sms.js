/**
 * SMS Service - Real Africa's Talking Integration
 * Handles OTP and notification SMS sending
 */

const AfricasTalking = require('africastalking');

// Initialize Africa's Talking (lazy initialization)
let sms = null;

function initializeSMS() {
    if (sms) return sms;
    
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME || 'sandbox';
    
    if (!apiKey) {
        console.warn('⚠️ AT_API_KEY not set - SMS will be simulated');
        return null;
    }
    
    try {
        const africasTalking = AfricasTalking({
            apiKey,
            username
        });
        
        sms = africasTalking.SMS;
        console.log('✅ Africa\'s Talking SMS initialized');
        return sms;
    } catch (error) {
        console.error('❌ Failed to initialize Africa\'s Talking:', error.message);
        return null;
    }
}

// SMS Templates
const templates = {
    OTP_LOGIN: (otp) => `Your GMG Global login code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    OTP_TRANSACTION: (otp, amount) => `Your GMG Global verification code is: ${otp} for transaction of ${amount}. Valid for 5 minutes.`,
    TRANSFER_SENT: (amount, recipient) => `You have sent UGX ${amount} to ${recipient}. GMG Global.`,
    TRANSFER_RECEIVED: (amount, sender) => `You have received UGX ${amount} from ${sender}. GMG Global.`,
    DEPOSIT_SUCCESS: (amount) => `Your deposit of UGX ${amount} was successful. GMG Global.`,
    DEPOSIT_FAILED: (amount) => `Your deposit of UGX ${amount} failed. Please try again. GMG Global.`,
    LOW_BALANCE: (balance) => `Your GMG Global balance is low: UGX ${balance}. Top up now.`,
    WELCOME: (name) => `Welcome to GMG Global, ${name}! Your account is ready.`
};

/**
 * Send OTP SMS
 */
async function sendOTP(phone, otp, type = 'LOGIN') {
    const smsService = initializeSMS();
    
    const message = type === 'LOGIN' 
        ? `Your GMG Global login code is: ${otp}. Valid for 5 minutes. Do not share this code.`
        : `Your GMG Global verification code is: ${otp}. Valid for 5 minutes.`;
    
    if (!smsService) {
        // Simulate SMS in development
        console.log(`[SMS SIMULATION] To: ${phone}, Message: ${message}`);
        return { success: true, messageId: 'sim_' + Date.now() };
    }
    
    try {
        const result = await smsService.send({
            to: [phone],
            message,
            from: process.env.AT_SENDER_ID || 'GMG_UG'
        });
        
        if (result.SMSMessageData.Recipients[0].status === 'Success') {
            console.log(`✅ SMS sent to ${phone}: ${result.SMSMessageData.Recipients[0].messageId}`);
            return {
                success: true,
                messageId: result.SMSMessageData.Recipients[0].messageId,
                cost: result.SMSMessageData.Recipients[0].cost
            };
        } else {
            throw new Error(result.SMSMessageData.Recipients[0].status);
        }
    } catch (error) {
        console.error(`❌ SMS failed to ${phone}:`, error.message);
        throw new Error(`SMS delivery failed: ${error.message}`);
    }
}

/**
 * Send WhatsApp OTP (if supported)
 */
async function sendWhatsAppOTP(phone, otp, type = 'LOGIN') {
    // For now, fall back to SMS
    // WhatsApp Business API integration would go here
    console.log(`[WHATSAPP FALLBACK] Sending SMS instead to ${phone}`);
    return sendOTP(phone, otp, type);
}

/**
 * Send transaction notification
 */
async function sendTransactionNotification(phone, message) {
    const smsService = initializeSMS();
    
    if (!smsService) {
        console.log(`[SMS SIMULATION] Transaction notification to ${phone}: ${message}`);
        return { success: true };
    }
    
    try {
        const result = await smsService.send({
            to: [phone],
            message: `GMG Global: ${message}`,
            from: process.env.AT_SENDER_ID || 'GMG_UG'
        });
        
        return { success: true, messageId: result.SMSMessageData.Recipients[0].messageId };
    } catch (error) {
        console.error(`❌ Transaction SMS failed to ${phone}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Check if SMS service is configured
 */
function isConfigured() {
    return !!process.env.AT_API_KEY;
}

module.exports = {
    sendOTP,
    sendWhatsAppOTP,
    sendTransactionNotification,
    isConfigured,
    templates
};