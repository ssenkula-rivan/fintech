// GMG Global - Database Configuration
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gmg_uganda',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
  timezone: '+00:00',
  charset: 'utf8mb4'
});

module.exports = pool;
