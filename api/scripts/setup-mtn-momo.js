#!/usr/bin/env node
/**
 * MTN MoMo API Setup Script
 * Creates API User and generates API Key for sandbox/production
 * 
 * Usage:
 *   node setup-mtn-momo.js <subscription_key> [callback_host] [environment]
 * 
 * Example:
 *   node setup-mtn-momo.js 4c91dae7a6f1474387a23a1f3d448eb7 webhook.site sandbox
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const ENVIRONMENTS = {
    sandbox: 'https://sandbox.momodeveloper.mtn.com',
    production: 'https://proxy.momoapi.mtn.com',
    live: 'https://proxy.momoapi.mtn.com'
};

async function setupMTNMoMo(subscriptionKey, callbackHost = 'webhook.site', environment = 'sandbox') {
    const baseURL = ENVIRONMENTS[environment] || ENVIRONMENTS.sandbox;
    const apiUser = uuidv4();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 MTN MoMo API Setup');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Environment: ${environment}`);
    console.log(`Base URL: ${baseURL}`);
    console.log(`Subscription Key: ${subscriptionKey.substring(0, 8)}...`);
    console.log(`Callback Host: ${callbackHost}`);
    console.log(`Generated API User ID: ${apiUser}`);
    console.log('');
    
    // Step 1: Create API User
    console.log('📝 Step 1: Creating API User...');
    try {
        const createUserResponse = await axios.post(
            `${baseURL}/v1_0/apiuser`,
            { providerCallbackHost: callbackHost },
            {
                headers: {
                    'X-Reference-Id': apiUser,
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ API User created successfully (Status: ${createUserResponse.status})`);
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('⚠️  API User already exists, continuing...');
        } else {
            console.error('❌ Failed to create API User:', error.response?.data || error.message);
            process.exit(1);
        }
    }
    
    // Step 2: Generate API Key
    console.log('');
    console.log('🔑 Step 2: Generating API Key...');
    try {
        const apiKeyResponse = await axios.post(
            `${baseURL}/v1_0/apiuser/${apiUser}/apikey`,
            {},
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const apiKey = apiKeyResponse.data.apiKey;
        console.log(`✅ API Key generated successfully`);
        
        // Step 3: Verify API User
        console.log('');
        console.log('🔍 Step 3: Verifying API User...');
        const verifyResponse = await axios.get(
            `${baseURL}/v1_0/apiuser/${apiUser}`,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey
                }
            }
        );
        console.log(`✅ API User verified: ${JSON.stringify(verifyResponse.data)}`);
        
        // Output credentials
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ MTN MoMo Setup Complete!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('Add these to your .env file:');
        console.log('');
        console.log(`MTN_MOMO_API_USER=${apiUser}`);
        console.log(`MTN_MOMO_API_KEY=${apiKey}`);
        console.log(`MTN_MOMO_SUBSCRIPTION_KEY=${subscriptionKey}`);
        console.log(`MTN_MOMO_ENVIRONMENT=${environment}`);
        console.log(`MTN_MOMO_CALLBACK_URL=https://${callbackHost}/api/webhooks/mtn`);
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        
        return {
            apiUser,
            apiKey,
            subscriptionKey,
            environment,
            callbackHost
        };
        
    } catch (error) {
        console.error('❌ Failed to generate API Key:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Usage: node setup-mtn-momo.js <subscription_key> [callback_host] [environment]');
        console.log('');
        console.log('Arguments:');
        console.log('  subscription_key  Your Ocp-Apim-Subscription-Key from MTN Developer Portal');
        console.log('  callback_host     Your callback URL host (default: webhook.site)');
        console.log('  environment       sandbox | production | live (default: sandbox)');
        console.log('');
        console.log('Example:');
        console.log('  node setup-mtn-momo.js 4c91dae7a6f1474387a23a1f3d448eb7 myapp.com sandbox');
        process.exit(1);
    }
    
    const [subscriptionKey, callbackHost, environment] = args;
    
    setupMTNMoMo(subscriptionKey, callbackHost || 'webhook.site', environment || 'sandbox')
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Setup failed:', err.message);
            process.exit(1);
        });
}

module.exports = { setupMTNMoMo };
