-- GMG Uganda - Crypto Wallet Schema
-- Tables for cryptocurrency functionality

USE gmg_uganda;

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
