/**
 * Smile Identity KYC Service - REAL Implementation
 * Africa's leading identity verification provider
 * 
 * REQUIRED ENV:
 * - SMILE_PARTNER_ID: Your Smile Identity Partner ID
 * - SMILE_API_KEY: Your API Key
 * - SMILE_SID_SERVER: Server URL (sandbox or production)
 * - SMILE_CALLBACK_URL: Webhook URL for verification results
 * 
 * Get credentials at: https://portal.smileidentity.com/
 * 
 * Supported ID Types for Uganda:
 * - NATIONAL_ID
 * - PASSPORT
 * - VOTER_ID
 * - DRIVERS_LICENSE
 */

const https = require('https');
const crypto = require('crypto');

// API Configuration
const CONFIG = {
    sandbox: {
        baseUrl: 'testapi.smileidentity.com',
        sidServer: '0'
    },
    production: {
        baseUrl: 'api.smileidentity.com',
        sidServer: '1'
    }
};

/**
 * Get current environment config
 */
function getConfig() {
    const env = process.env.SMILE_ENVIRONMENT || 'sandbox';
    return {
        ...CONFIG[env],
        environment: env,
        partnerId: process.env.SMILE_PARTNER_ID,
        apiKey: process.env.SMILE_API_KEY,
        callbackUrl: process.env.SMILE_CALLBACK_URL,
        sidServer: process.env.SMILE_SID_SERVER || CONFIG[env].sidServer
    };
}

/**
 * Validate Smile Identity configuration
 */
function validateConfig() {
    const config = getConfig();
    const missing = [];
    
    if (!config.partnerId) missing.push('SMILE_PARTNER_ID');
    if (!config.apiKey) missing.push('SMILE_API_KEY');
    
    if (missing.length > 0) {
        throw new Error(`Smile Identity not configured. Missing: ${missing.join(', ')}. Get credentials at https://portal.smileidentity.com/`);
    }
    
    return config;
}

/**
 * Generate signature for API request
 */
function generateSignature(timestamp) {
    const config = getConfig();
    const toSign = `${timestamp}${config.partnerId}sid_request`;
    return crypto.createHmac('sha256', config.apiKey).update(toSign).digest('base64');
}

/**
 * Submit ID verification (Enhanced KYC)
 * @param {object} params Verification parameters
 * @param {string} params.userId - Your internal user ID
 * @param {string} params.jobId - Unique job reference
 * @param {string} params.idType - ID type (NATIONAL_ID, PASSPORT, etc.)
 * @param {string} params.idNumber - ID number
 * @param {string} params.firstName - First name on ID
 * @param {string} params.lastName - Last name on ID
 * @param {string} params.dob - Date of birth (YYYY-MM-DD)
 * @param {string} params.country - Country code (UG for Uganda)
 * @returns {Promise<object>} Verification result
 */
async function verifyId({ userId, jobId, idType, idNumber, firstName, lastName, dob, country = 'UG' }) {
    const config = validateConfig();
    const timestamp = new Date().toISOString();
    const signature = generateSignature(timestamp);
    
    const payload = {
        source_sdk: 'rest_api',
        source_sdk_version: '1.0.0',
        partner_id: config.partnerId,
        timestamp,
        signature,
        partner_params: {
            user_id: userId,
            job_id: jobId || `JOB_${Date.now()}`,
            job_type: 5 // Enhanced KYC
        },
        id_info: {
            country,
            id_type: idType,
            id_number: idNumber,
            first_name: firstName,
            last_name: lastName,
            dob
        },
        callback_url: config.callbackUrl
    };
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: config.baseUrl,
            path: '/v1/id_verification',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.success || parsed.ResultCode === '1012') {
                        resolve({
                            success: true,
                            jobId: parsed.smile_job_id || jobId,
                            resultCode: parsed.ResultCode,
                            resultText: parsed.ResultText,
                            verified: parsed.ResultCode === '1012',
                            actions: parsed.Actions,
                            idInfo: parsed.IDInfo
                        });
                    } else {
                        resolve({
                            success: false,
                            error: parsed.error || parsed.ResultText || 'Verification failed',
                            resultCode: parsed.ResultCode,
                            jobId
                        });
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Smile Identity response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

/**
 * Submit document + selfie verification (Biometric KYC)
 * @param {object} params Verification parameters
 * @param {string} params.userId - Your internal user ID
 * @param {string} params.jobId - Unique job reference
 * @param {string} params.idType - ID type
 * @param {string} params.idNumber - ID number
 * @param {string} params.country - Country code
 * @param {string} params.selfieBase64 - Base64 encoded selfie image
 * @param {string} params.idFrontBase64 - Base64 encoded ID front image
 * @param {string} params.idBackBase64 - Base64 encoded ID back image (optional)
 * @returns {Promise<object>} Verification result
 */
async function verifyBiometric({ userId, jobId, idType, idNumber, country = 'UG', selfieBase64, idFrontBase64, idBackBase64 }) {
    const config = validateConfig();
    const timestamp = new Date().toISOString();
    const signature = generateSignature(timestamp);
    
    const images = [
        {
            image_type_id: 0, // Selfie
            image: selfieBase64
        },
        {
            image_type_id: 1, // ID Front
            image: idFrontBase64
        }
    ];
    
    if (idBackBase64) {
        images.push({
            image_type_id: 2, // ID Back
            image: idBackBase64
        });
    }
    
    const payload = {
        source_sdk: 'rest_api',
        source_sdk_version: '1.0.0',
        partner_id: config.partnerId,
        timestamp,
        signature,
        partner_params: {
            user_id: userId,
            job_id: jobId || `JOB_${Date.now()}`,
            job_type: 1 // Biometric KYC
        },
        id_info: {
            country,
            id_type: idType,
            id_number: idNumber
        },
        images,
        callback_url: config.callbackUrl
    };
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: config.baseUrl,
            path: '/v1/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.upload_url || parsed.smile_job_id) {
                        resolve({
                            success: true,
                            jobId: parsed.smile_job_id || jobId,
                            status: 'PROCESSING',
                            message: 'Verification submitted, awaiting results'
                        });
                    } else {
                        resolve({
                            success: false,
                            error: parsed.error || 'Submission failed',
                            code: parsed.code
                        });
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Smile Identity response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

/**
 * Get job status
 * @param {string} jobId - The job ID from verification request
 * @returns {Promise<object>} Job status
 */
async function getJobStatus(jobId) {
    const config = validateConfig();
    const timestamp = new Date().toISOString();
    const signature = generateSignature(timestamp);
    
    const payload = {
        partner_id: config.partnerId,
        timestamp,
        signature,
        job_id: jobId,
        image_links: false,
        history: false
    };
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: config.baseUrl,
            path: '/v1/job_status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    
                    resolve({
                        jobId,
                        jobComplete: parsed.job_complete,
                        jobSuccess: parsed.job_success,
                        resultCode: parsed.result?.ResultCode,
                        resultText: parsed.result?.ResultText,
                        actions: parsed.result?.Actions,
                        confidence: parsed.result?.ConfidenceValue,
                        idInfo: parsed.result?.IDInfo
                    });
                } catch (e) {
                    reject(new Error('Failed to parse job status response'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

/**
 * Supported ID types for Uganda
 */
const UGANDA_ID_TYPES = [
    { code: 'NATIONAL_ID', name: 'National ID Card', required: ['id_number', 'first_name', 'last_name', 'dob'] },
    { code: 'PASSPORT', name: 'Passport', required: ['id_number', 'first_name', 'last_name', 'dob'] },
    { code: 'VOTER_ID', name: 'Voter ID', required: ['id_number', 'first_name', 'last_name'] },
    { code: 'DRIVERS_LICENSE', name: "Driver's License", required: ['id_number', 'first_name', 'last_name', 'dob'] }
];

/**
 * Result codes interpretation
 */
const RESULT_CODES = {
    '1012': { status: 'VERIFIED', message: 'ID verified successfully' },
    '1013': { status: 'PARTIAL', message: 'Partial match - some fields differ' },
    '1014': { status: 'NOT_FOUND', message: 'ID not found in database' },
    '1015': { status: 'INVALID', message: 'Invalid ID format' },
    '1016': { status: 'EXPIRED', message: 'ID has expired' },
    '2212': { status: 'FACE_MATCH', message: 'Face matches ID photo' },
    '2213': { status: 'FACE_MISMATCH', message: 'Face does not match ID photo' }
};

function interpretResultCode(code) {
    return RESULT_CODES[code] || { status: 'UNKNOWN', message: `Unknown result code: ${code}` };
}

function getSupportedIdTypes() {
    return UGANDA_ID_TYPES;
}

/**
 * Check if Smile Identity is configured
 */
function isConfigured() {
    try {
        validateConfig();
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    verifyId,
    verifyBiometric,
    getJobStatus,
    getSupportedIdTypes,
    interpretResultCode,
    isConfigured,
    getConfig
};
