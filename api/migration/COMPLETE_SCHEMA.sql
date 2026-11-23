-- GMG Uganda - Complete Database Schema
-- Single source of truth for all tables
-- Run this to initialize a fresh database

CREATE DATABASE IF NOT EXISTS gmg_uganda 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE gmg_uganda;

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    pin_hash VARCHAR(255),
    google_id VARCHAR(100),
    apple_id VARCHAR(255),
    profile_picture TEXT,
    chipptertag VARCHAR(50) UNIQUE,
    kyc_tier ENUM('TIER_0', 'TIER_1', 'TIER_2', 'TIER_3') DEFAULT 'TIER_0',
    kyc_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    status ENUM('ACTIVE', 'SUSPENDED', 'LOCKED') DEFAULT 'ACTIVE',
    role ENUM('USER', 'ADMIN', 'SUPERADMIN') DEFAULT 'USER',
    login_attempts INT DEFAULT 0,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_google_id (google_id),
    INDEX idx_apple_id (apple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    balance DECIMAL(20,4) DEFAULT 0.0000,
    locked_balance DECIMAL(20,4) DEFAULT 0.0000,
    daily_limit DECIMAL(20,4) DEFAULT 500000.0000,
    monthly_limit DECIMAL(20,4) DEFAULT 5000000.0000,
    daily_spent DECIMAL(20,4) DEFAULT 0.0000,
    monthly_spent DECIMAL(20,4) DEFAULT 0.0000,
    status ENUM('ACTIVE', 'SUSPENDED', 'FROZEN') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_currency (user_id, currency),
    INDEX idx_user_currency (user_id, currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(100) UNIQUE NOT NULL,
    external_reference VARCHAR(100),
    user_id INT NOT NULL,
    transaction_type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'AIRTIME', 'DATA', 'BILL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT') NOT NULL,
    amount DECIMAL(20,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    fee DECIMAL(20,4) DEFAULT 0.0000,
    debit_wallet_id INT,
    credit_wallet_id INT,
    counterparty_user_id INT,
    counterparty_phone VARCHAR(20),
    counterparty_name VARCHAR(200),
    payment_method VARCHAR(50),
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED') DEFAULT 'PENDING',
    description TEXT,
    balance_before DECIMAL(20,4),
    balance_after DECIMAL(20,4),
    failure_reason TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_reference (reference),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- AUTHENTICATION TABLES
-- =============================================

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type ENUM('LOGIN', 'RESET', 'VERIFY') DEFAULT 'LOGIN',
    attempts INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- NOTIFICATION TABLES
-- =============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('TRANSACTION', 'SECURITY', 'PROMOTIONAL', 'SYSTEM') DEFAULT 'SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    push_token VARCHAR(500) NOT NULL,
    platform ENUM('ios', 'android', 'web') NOT NULL,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_token (user_id, push_token(255)),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    transactions BOOLEAN DEFAULT TRUE,
    security BOOLEAN DEFAULT TRUE,
    promotions BOOLEAN DEFAULT TRUE,
    kyc BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ACCOUNTING TABLES
-- =============================================

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    wallet_id INT NOT NULL,
    entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(20,4) NOT NULL,
    balance_before DECIMAL(20,4) NOT NULL,
    balance_after DECIMAL(20,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_wallet_id (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- USER DATA TABLES
-- =============================================

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    favorite BOOLEAN DEFAULT FALSE,
    send_count INT DEFAULT 0,
    last_used TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_beneficiary (user_id, phone),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reference VARCHAR(50) UNIQUE,
    target_tier INT NOT NULL DEFAULT 1,
    full_name VARCHAR(200),
    date_of_birth DATE,
    gender ENUM('M', 'F', 'O') DEFAULT 'M',
    national_id VARCHAR(50),
    district VARCHAR(100),
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- EXCHANGE RATES
-- =============================================

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(20,8) NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_currency_pair (from_currency, to_currency),
    INDEX idx_currencies (from_currency, to_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TRADING TABLES
-- =============================================

-- Trading orders table
CREATE TABLE IF NOT EXISTS trading_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_type ENUM('BUY', 'SELL') NOT NULL,
    asset_type ENUM('STOCK', 'FOREX', 'COMMODITY', 'CRYPTO') NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,4) NOT NULL,
    fee DECIMAL(20,4) DEFAULT 0.0000,
    status ENUM('PENDING', 'FILLED', 'PARTIAL', 'CANCELLED', 'FAILED') DEFAULT 'PENDING',
    filled_quantity DECIMAL(20,8) DEFAULT 0,
    filled_price DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trading positions table
CREATE TABLE IF NOT EXISTS trading_positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    asset_type ENUM('STOCK', 'FOREX', 'COMMODITY', 'CRYPTO') NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    avg_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    unrealized_pnl DECIMAL(20,4) DEFAULT 0,
    realized_pnl DECIMAL(20,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    asset_type ENUM('STOCK', 'FOREX', 'COMMODITY', 'CRYPTO') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    target_price DECIMAL(20,8) NOT NULL,
    alert_condition VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CRYPTO TABLES
-- =============================================

-- Crypto wallets table
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0.00000000,
    address VARCHAR(100),
    network VARCHAR(50),
    pin_hash VARCHAR(255),
    encrypted_private_key TEXT,
    status ENUM('ACTIVE', 'FROZEN') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_crypto (user_id, symbol),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crypto transactions table
CREATE TABLE IF NOT EXISTS crypto_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    wallet_id INT NOT NULL,
    type ENUM('BUY', 'SELL', 'SEND', 'RECEIVE', 'SWAP') NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    price_usd DECIMAL(20,8),
    total_usd DECIMAL(20,4),
    fee DECIMAL(20,8) DEFAULT 0,
    tx_hash VARCHAR(100),
    from_address VARCHAR(100),
    to_address VARCHAR(100),
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (wallet_id) REFERENCES crypto_wallets(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crypto prices cache table
CREATE TABLE IF NOT EXISTS crypto_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    price_usd DECIMAL(20,8) NOT NULL,
    change_24h DECIMAL(10,4),
    volume_24h DECIMAL(20,4),
    market_cap DECIMAL(20,4),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- MIGRATIONS TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS _migrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert default exchange rates
INSERT IGNORE INTO exchange_rates (from_currency, to_currency, rate, source) VALUES
('UGX', 'USD', 0.00027, 'manual'),
('USD', 'UGX', 3700.00, 'manual'),
('UGX', 'KES', 0.030, 'manual'),
('KES', 'UGX', 33.33, 'manual'),
('UGX', 'EUR', 0.00024, 'manual'),
('EUR', 'UGX', 4100.00, 'manual'),
('UGX', 'GBP', 0.00021, 'manual'),
('GBP', 'UGX', 4700.00, 'manual');

-- Insert default crypto prices
INSERT IGNORE INTO crypto_prices (symbol, name, price_usd, change_24h) VALUES
('BTC', 'Bitcoin', 42000.00, 2.5),
('ETH', 'Ethereum', 2200.00, 1.8),
('USDT', 'Tether', 1.00, 0.01),
('BNB', 'Binance Coin', 300.00, 1.2),
('SOL', 'Solana', 100.00, 3.5),
('XRP', 'Ripple', 0.60, 0.8),
('USDC', 'USD Coin', 1.00, 0.00),
('ADA', 'Cardano', 0.50, 1.5);

-- Record migration
INSERT IGNORE INTO _migrations (name) VALUES ('COMPLETE_SCHEMA_v1');

-- =============================================
-- APP VERSION MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS app_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    platform ENUM('ios', 'android') NOT NULL,
    latest_version VARCHAR(20) NOT NULL,
    min_supported_version VARCHAR(20) NOT NULL,
    release_notes TEXT,
    force_update TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_platform (platform),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial app versions
INSERT IGNORE INTO app_versions (platform, latest_version, min_supported_version, release_notes, force_update, is_active) VALUES
('ios', '1.0.0', '1.0.0', 'Initial release of GMG Global', 0, 1),
('android', '1.0.0', '1.0.0', 'Initial release of GMG Global', 0, 1);

-- Record migration
INSERT IGNORE INTO _migrations (name) VALUES ('APP_VERSIONS_v1');


-- =============================================
-- TRANSACTION INTEGRITY TABLES
-- =============================================

-- Idempotency keys table (prevents duplicate transactions)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    composite_key VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_id INT,
    status ENUM('PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PROCESSING',
    response JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_composite_key (composite_key),
    INDEX idx_expires (expires_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit trail table (immutable transaction history with hash chain)
CREATE TABLE IF NOT EXISTS audit_trail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    previous_hash VARCHAR(64),
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Record migration
INSERT IGNORE INTO _migrations (name) VALUES ('TRANSACTION_INTEGRITY_v1');
