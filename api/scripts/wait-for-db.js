#!/usr/bin/env node
/**
 * Database Connection Wait Script
 * Waits for MySQL to be ready before starting the application
 * Production-ready with exponential backoff
 */

const mysql = require('mysql2/promise');

const MAX_RETRIES = 30;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 10000;

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmg_uganda',
    connectTimeout: 10000
};

async function waitForDatabase() {
    console.log('🔄 Waiting for database connection...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    let retries = 0;
    let delay = INITIAL_DELAY;
    
    while (retries < MAX_RETRIES) {
        try {
            const connection = await mysql.createConnection(config);
            
            // Test the connection with a simple query
            await connection.execute('SELECT 1');
            await connection.end();
            
            console.log('✅ Database connection established');
            return true;
        } catch (error) {
            retries++;
            console.log(`⏳ Attempt ${retries}/${MAX_RETRIES} failed: ${error.code || error.message}`);
            
            if (retries >= MAX_RETRIES) {
                console.error('❌ Max retries reached. Database is not available.');
                process.exit(1);
            }
            
            // Exponential backoff with max delay
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, MAX_DELAY);
        }
    }
}

// Run if called directly
if (require.main === module) {
    waitForDatabase()
        .then(() => {
            console.log('🚀 Database ready, starting application...');
            process.exit(0);
        })
        .catch(err => {
            console.error('💥 Fatal error:', err.message);
            process.exit(1);
        });
}

module.exports = { waitForDatabase };
