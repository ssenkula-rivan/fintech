-- Missing tables required by the application

-- Users table (proper structure)
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
    INDEX idx_status (status)
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
    FOREIGN KEY (debit_wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (credit_wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (counterparty_user_id) REFERENCES users(id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_reference (reference),
    INDEX idx_status (status),
    INDEX idx_type (transaction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Ledger entries table (for double-entry accounting)
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


-- User devices table (for push notifications)
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
    UNIQUE KEY unique_user_token (user_id, push_token),
    INDEX idx_user_id (user_id),
    INDEX idx_push_token (push_token)
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

-- Crypto wallets table
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0.00000000,
    address VARCHAR(100),
    network VARCHAR(50),
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
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (wallet_id) REFERENCES crypto_wallets(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
