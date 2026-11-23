#!/usr/bin/env node
/**
 * Database Migration Runner
 * Executes SQL migrations in order
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MIGRATIONS_DIR = path.join(__dirname, '../migration');

async function run() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  GMG Uganda - Database Migration');
    console.log('═══════════════════════════════════════════════════════════\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gmg_uganda'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${process.env.DB_NAME || 'gmg_uganda'}`);
        console.log(`✓ Database: ${process.env.DB_NAME || 'gmg_uganda'}\n`);

        // Create migrations tracking table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get executed migrations
        const [executed] = await connection.query('SELECT filename FROM _migrations');
        const executedSet = new Set(executed.map(r => r.filename));

        // Get migration files in order
        const migrations = [
            'CANONICAL_SCHEMA.sql',
            'TRADING_SCHEMA.sql',
            'CRYPTO_WALLET_SCHEMA.sql'
        ];

        let count = 0;
        for (const filename of migrations) {
            if (executedSet.has(filename)) {
                console.log(`⊘ ${filename} (already executed)`);
                continue;
            }

            const filepath = path.join(MIGRATIONS_DIR, filename);
            if (!fs.existsSync(filepath)) {
                console.log(`⚠ ${filename} (file not found)`);
                continue;
            }

            console.log(`→ Executing: ${filename}`);
            const sql = fs.readFileSync(filepath, 'utf8');
            
            await connection.query(sql);
            await connection.query('INSERT INTO _migrations (filename) VALUES (?)', [filename]);
            
            console.log(`✓ ${filename} completed\n`);
            count++;
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`  Migration complete. ${count} new migration(s) executed.`);
        console.log('═══════════════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

run();
