/**
 * Environment Variables Validation
 * Ensures all critical environment variables are set
 */

const requiredEnvVars = {
    // Database
    'DB_HOST': 'Database host is required',
    'DB_NAME': 'Database name is required',
    
    // JWT
    'JWT_SECRET': 'JWT secret is required (minimum 32 characters)',
    
    // Critical for production
    ...(process.env.NODE_ENV === 'production' ? {
        'DB_PASSWORD': 'Database password is required in production',
        'WALLET_ENCRYPTION_KEY': 'Wallet encryption key is required for crypto features',
        'ADMIN_IP_WHITELIST': 'Admin IP whitelist is required in production',
        'METRICS_API_KEY': 'Metrics API key is required in production'
    } : {})
};

const optionalEnvVars = {
    // Mobile Money APIs
    'MTN_MOMO_API_KEY': 'MTN MoMo API key (required for mobile money deposits)',
    'AIRTEL_CLIENT_ID': 'Airtel Money client ID (required for Airtel deposits)',
    
    // SMS
    'AT_API_KEY': 'Africa\'s Talking API key (required for SMS OTP)',
    
    // Exchange Rates
    'OPENEXCHANGERATES_APP_ID': 'Open Exchange Rates API key (required for live rates)',
    
    // Crypto
    'ETHERSCAN_API_KEY': 'Etherscan API key (recommended for transaction history)',
    'BSCSCAN_API_KEY': 'BscScan API key (recommended for BSC transactions)',
    
    // Google OAuth
    'GOOGLE_CLIENT_ID': 'Google OAuth client ID (required for Google sign-in)'
};

function validateEnvironment() {
    const errors = [];
    const warnings = [];
    
    // Check required variables
    for (const [key, message] of Object.entries(requiredEnvVars)) {
        const value = process.env[key];
        
        if (!value) {
            errors.push(`❌ ${key}: ${message}`);
        } else {
            // Additional validation for specific variables
            if (key === 'JWT_SECRET' && value.length < 32) {
                errors.push(`❌ ${key}: Must be at least 32 characters (current: ${value.length})`);
            }
            
            if (key === 'WALLET_ENCRYPTION_KEY' && value.length < 32) {
                errors.push(`❌ ${key}: Must be at least 32 characters (current: ${value.length})`);
            }
        }
    }
    
    // Check optional variables
    for (const [key, message] of Object.entries(optionalEnvVars)) {
        if (!process.env[key]) {
            warnings.push(`⚠️  ${key}: ${message}`);
        }
    }
    
    // Print results
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 ENVIRONMENT VARIABLES VALIDATION');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (errors.length === 0) {
        console.log('✅ All required environment variables are set');
    } else {
        console.log('\n🚨 CRITICAL ERRORS:');
        errors.forEach(error => console.log(error));
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS (Optional but recommended):');
        warnings.forEach(warning => console.log(warning));
    }
    
    // Show configured features
    console.log('\n📋 CONFIGURED FEATURES:');
    console.log(`✅ Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`${process.env.REDIS_HOST ? '✅' : '❌'} Redis Cache: ${process.env.REDIS_HOST || 'Not configured'}`);
    console.log(`${process.env.MTN_MOMO_API_KEY ? '✅' : '❌'} MTN MoMo: ${process.env.MTN_MOMO_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`${process.env.AIRTEL_CLIENT_ID ? '✅' : '❌'} Airtel Money: ${process.env.AIRTEL_CLIENT_ID ? 'Configured' : 'Not configured'}`);
    console.log(`${process.env.AT_API_KEY ? '✅' : '❌'} SMS (Africa\'s Talking): ${process.env.AT_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`${process.env.WALLET_ENCRYPTION_KEY ? '✅' : '❌'} Crypto Wallet: ${process.env.WALLET_ENCRYPTION_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'} Google Sign-In: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Exit if critical errors (except in test environment)
    if (errors.length > 0) {
        console.error('💥 APPLICATION CANNOT START - Fix the errors above');
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
    
    return {
        errors,
        warnings,
        isValid: errors.length === 0
    };
}

module.exports = { validateEnvironment };