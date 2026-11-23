-- GMG Uganda - Trading Schema
-- Tables for trading functionality

USE gmg_uganda;

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
    condition ENUM('ABOVE', 'BELOW') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
