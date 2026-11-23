-- ================================================================================
-- GMG UGANDA - PRODUCTION-GRADE DATABASE SCHEMA
-- Enterprise-level financial services platform
-- Matches standards of Chipper Cash, Binance, and other fintech leaders
-- ================================================================================

CREATE DATABASE IF NOT EXISTS gmg_uganda 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE gmg_uganda;

-- ================================================================================
-- CORE MASTER TABLE - Single source of truth for all operations
-- ================================================================================
CREATE TABLE gmg_master (
    -- PRIMARY IDENTIFIERS
    id VARCHAR(50) PRIMARY KEY,
    entity_type ENUM(
        'USER', 'WALLET', 'TRANSACTION', 'CARD', 'SAVINGS', 
        'LOAN', 'INSURANCE', 'AGENT', 'MERCHANT', 'BILL_PAYMENT',
        'AIRTIME', 'DATA', 'NOTIFICATION', 'REFERRAL', 'EXCHANGE_RATE',
        'KYC_DOCUMENT', 'DISPUTE', 'WITHDRAWAL', 'DEPOSIT', 'COMMISSION'
    ) NOT NULL,
    
    -- USER CORE DATA
    user_id VARCHAR(50),
    user_phone VARCHAR(20),
    user_email VARCHAR(100),
    user_name VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    chipptertag VARCHAR(50),
    username VARCHAR(50),
    
    -- FINANCIAL CORE
    currency VARCHAR(10) DEFAULT 'UGX',
    amount DECIMAL(20,4) DEFAULT 0.0000,
    balance DECIMAL(20,4) DEFAULT 0.0000,
    fee DECIMAL(20,4) DEFAULT 0.0000,
    tax DECIMAL(20,4) DEFAULT 0.0000,
    commission DECIMAL(20,4) DEFAULT 0.0000,
    
    -- TRANSACTION DETAILS
    transaction_type ENUM(
        'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'AIRTIME', 'DATA', 'BILL',
        'CARD_PAYMENT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SAVINGS_DEPOSIT',
        'INSURANCE_PREMIUM', 'COMMISSION', 'REFUND', 'REVERSAL', 'CASH_IN', 'CASH_OUT'
    ),
    sender_id VARCHAR(50),
    sender_phone VARCHAR(20),
    recipient_id VARCHAR(50),
    recipient_phone VARCHAR(20),
    recipient_name VARCHAR(100),
    
    -- CARD INFORMATION
    card_number VARCHAR(16),
    card_last_four VARCHAR(4),
    cardholder_name VARCHAR(100),
    cvv_hash VARCHAR(255),
    expiry_date VARCHAR(7),
    card_brand ENUM('VISA', 'MASTERCARD'),
    
    -- LOAN INFORMATION
    loan_amount DECIMAL(20,4),
    interest_rate DECIMAL(5,2),
    loan_period_days INT,
    total_repayment DECIMAL(20,4),
    amount_paid DECIMAL(20,4) DEFAULT 0.0000,
    due_date DATE,
    loan_status ENUM('PENDING', 'APPROVED', 'ACTIVE', 'PAID', 'OVERDUE', 'DEFAULTED'),
    loan_purpose VARCHAR(200),
    
    -- SAVINGS INFORMATION
    savings_goal_name VARCHAR(100),
    savings_goal_amount DECIMAL(20,4),
    savings_interest_rate DECIMAL(5,2) DEFAULT 5.00,
    
    -- INSURANCE INFORMATION
    insurance_type ENUM('HEALTH', 'LIFE', 'ACCIDENT', 'DEVICE'),
    insurance_plan ENUM('BASIC', 'STANDARD', 'PREMIUM'),
    premium_amount DECIMAL(20,4),
    coverage_amount DECIMAL(20,4),
    beneficiary_name VARCHAR(100),
    beneficiary_phone VARCHAR(20),
    start_date DATE,
    next_payment_date DATE,
    
    -- AGENT/MERCHANT DATA
    agent_code VARCHAR(20),
    business_name VARCHAR(100),
    business_category VARCHAR(50),
    location VARCHAR(200),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    commission_rate DECIMAL(5,2),
    total_commission_earned DECIMAL(20,4) DEFAULT 0.0000,
    
    -- BILL PAYMENT & UTILITIES
    bill_type ENUM('ELECTRICITY', 'WATER', 'TV', 'INTERNET', 'SCHOOL_FEES', 'INSURANCE'),
    provider VARCHAR(50),
    provider_code VARCHAR(50),
    account_number VARCHAR(100),
    phone_number VARCHAR(20),
    network ENUM('MTN', 'AIRTEL', 'AFRICELL'),
    token VARCHAR(100),
    
    -- DATA BUNDLES
    bundle_name VARCHAR(100),
    data_size VARCHAR(50),
    validity_days INT,
    
    -- KYC & COMPLIANCE
    kyc_level ENUM('TIER_0', 'TIER_1', 'TIER_2', 'TIER_3') DEFAULT 'TIER_0',
    kyc_tier ENUM('TIER_0', 'TIER_1', 'TIER_2', 'TIER_3') DEFAULT 'TIER_0',
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_document_type ENUM('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'REFUGEE_ID'),
    kyc_document_number VARCHAR(50),
    kyc_document_url TEXT,
    kyc_selfie_url TEXT,
    kyc_verified_at TIMESTAMP NULL,
    kyc_verified_by VARCHAR(50),
    
    -- LIMITS & CONTROLS
    daily_limit DECIMAL(20,4),
    monthly_limit DECIMAL(20,4),
    daily_spent DECIMAL(20,4) DEFAULT 0.0000,
    monthly_spent DECIMAL(20,4) DEFAULT 0.0000,
    transaction_limit DECIMAL(20,4),
    
    -- STATUS & WORKFLOW
    status ENUM(
        'ACTIVE', 'PENDING', 'COMPLETED', 'FAILED', 'SUSPENDED',
        'FROZEN', 'CANCELLED', 'EXPIRED', 'UNDER_REVIEW', 'APPROVED',
        'REJECTED', 'PROCESSING', 'DECLINED', 'REVERSED'
    ) DEFAULT 'ACTIVE',
    
    -- SECURITY
    password_hash VARCHAR(255),
    pin_hash VARCHAR(255),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP NULL,
    otp_used BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    
    -- REFERENCES & TRACKING
    reference VARCHAR(100) UNIQUE,
    external_reference VARCHAR(100),
    parent_id VARCHAR(50),
    related_transaction_id VARCHAR(50),
    batch_id VARCHAR(50),
    
    -- BANKING & INTERNATIONAL
    recipient_country VARCHAR(100),
    recipient_bank VARCHAR(100),
    recipient_bank_code VARCHAR(50),
    recipient_account VARCHAR(100),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    
    -- CRYPTO & STABLECOINS
    stablecoin VARCHAR(10),
    wallet_address VARCHAR(100),
    blockchain_network VARCHAR(50),
    transaction_hash VARCHAR(100),
    gas_fee DECIMAL(20,8),
    
    -- DISPUTES & SUPPORT
    dispute_reason TEXT,
    dispute_status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'),
    dispute_resolution TEXT,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP NULL,
    
    -- NOTIFICATIONS
    notification_title VARCHAR(200),
    notification_message TEXT,
    notification_type ENUM('TRANSACTION', 'SECURITY', 'PROMOTIONAL', 'SYSTEM'),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    push_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    -- REFERRALS
    referrer_id VARCHAR(50),
    referred_id VARCHAR(50),
    referral_code VARCHAR(20),
    reward_amount DECIMAL(20,4),
    reward_currency VARCHAR(10) DEFAULT 'UGX',
    reward_status ENUM('PENDING', 'CREDITED', 'CANCELLED'),
    credited_at TIMESTAMP NULL,
    
    -- EXCHANGE RATES
    from_currency VARCHAR(10),
    to_currency VARCHAR(10),
    exchange_rate DECIMAL(15,8),
    rate_updated_at TIMESTAMP NULL,
    
    -- METADATA & CONTEXT
    description TEXT,
    notes TEXT,
    metadata JSON,
    tags JSON,
    attachments JSON,
    
    -- DEVICE & LOCATION
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_id VARCHAR(100),
    device_type ENUM('MOBILE', 'WEB', 'TABLET', 'API'),
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    
    -- RISK & FRAUD
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    fraud_flag BOOLEAN DEFAULT FALSE,
    fraud_reason TEXT,
    reviewed_by VARCHAR(50),
    reviewed_at TIMESTAMP NULL,
    
    -- AUDIT TRAIL
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    
    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    
    -- SOFT DELETE
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- INDEXES FOR OPTIMAL PERFORMANCE
    INDEX idx_entity_type (entity_type),
    INDEX idx_user_id (user_id),
    INDEX idx_user_phone (user_phone),
    INDEX idx_user_email (user_email),
    INDEX idx_status (status),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference),
    INDEX idx_agent_code (agent_code),
    INDEX idx_recipient_phone (recipient_phone),
    INDEX idx_card_number (card_number),
    INDEX idx_loan_status (loan_status),
    INDEX idx_kyc_level (kyc_level),
    INDEX idx_sender_id (sender_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_fraud_flag (fraud_flag),
    INDEX idx_chipptertag (chipptertag),
    INDEX idx_username (username),
    
    -- COMPOSITE INDEXES
    INDEX idx_user_entity (user_id, entity_type),
    INDEX idx_entity_status (entity_type, status),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_type_date (transaction_type, created_at),
    INDEX idx_phone_entity (user_phone, entity_type),
    INDEX idx_status_date (status, created_at),
    
    -- FULL TEXT SEARCH
    FULLTEXT INDEX idx_ft_description (description),
    FULLTEXT INDEX idx_ft_notes (notes)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
ROW_FORMAT=DYNAMIC;

-- Active Users View
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    user_id, user_phone, user_email, user_name, chipptertag, username,
    kyc_level, kyc_verified, status, last_login_at, created_at
FROM gmg_master 
WHERE entity_type = 'USER' 
AND is_deleted = FALSE 
AND status = 'ACTIVE';

-- Wallet Balances View
CREATE OR REPLACE VIEW v_wallet_balances AS
SELECT 
    user_id, currency, balance, status, updated_at,
    daily_limit, monthly_limit, daily_spent, monthly_spent
FROM gmg_master 
WHERE entity_type = 'WALLET' 
AND is_deleted = FALSE;

-- Transaction History View
CREATE OR REPLACE VIEW v_transactions AS
SELECT 
    id, user_id, transaction_type, amount, currency, fee, tax,
    sender_id, recipient_id, recipient_phone, status, reference,
    description, created_at, completed_at
FROM gmg_master 
WHERE entity_type = 'TRANSACTION' 
AND is_deleted = FALSE
ORDER BY created_at DESC;

-- Active Loans View
CREATE OR REPLACE VIEW v_active_loans AS
SELECT 
    id, user_id, loan_amount, interest_rate, total_repayment,
    amount_paid, due_date, loan_status, loan_purpose, created_at
FROM gmg_master 
WHERE entity_type = 'LOAN' 
AND is_deleted = FALSE
AND loan_status IN ('ACTIVE', 'APPROVED', 'OVERDUE');

-- Agent Performance View
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
    user_id, agent_code, business_name, location,
    commission_rate, total_commission_earned, status, created_at
FROM gmg_master 
WHERE entity_type = 'AGENT' 
AND is_deleted = FALSE;

-- Active Cards View
CREATE OR REPLACE VIEW v_active_cards AS
SELECT 
    id, user_id, card_last_four, cardholder_name, card_brand,
    expiry_date, currency, balance, status, created_at
FROM gmg_master 
WHERE entity_type = 'CARD' 
AND is_deleted = FALSE;

-- Pending Transactions View (for processing)
CREATE OR REPLACE VIEW v_pending_transactions AS
SELECT 
    id, user_id, transaction_type, amount, currency,
    recipient_phone, reference, created_at
FROM gmg_master 
WHERE entity_type = 'TRANSACTION' 
AND status = 'PENDING'
AND is_deleted = FALSE
ORDER BY created_at ASC;

-- ================================================================================
-- STORED PROCEDURES - CORE OPERATIONS
-- ================================================================================

DELIMITER //

-- 1. Create New User
CREATE PROCEDURE sp_create_user(
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_name VARCHAR(100),
    IN p_pin_hash VARCHAR(255)
)
BEGIN
    DECLARE v_user_id VARCHAR(50);
    DECLARE v_wallet_id VARCHAR(50);
    DECLARE v_chipptertag VARCHAR(50);
    
    SET v_user_id = CONCAT('USR_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_wallet_id = CONCAT('WLT_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_chipptertag = CONCAT('$', LOWER(REPLACE(p_name, ' ', '')), FLOOR(RAND() * 10000));
    
    -- Create User
    INSERT INTO gmg_master (
        id, entity_type, user_id, user_phone, user_email, user_name,
        chipptertag, pin_hash, status, kyc_level, kyc_verified, created_at
    ) VALUES (
        v_user_id, 'USER', v_user_id, p_phone, p_email, p_name,
        v_chipptertag, p_pin_hash, 'ACTIVE', 'TIER_0', FALSE, NOW()
    );
    
    -- Create Default Wallet (UGX)
    INSERT INTO gmg_master (
        id, entity_type, user_id, currency, balance, status,
        daily_limit, monthly_limit, created_at
    ) VALUES (
        v_wallet_id, 'WALLET', v_user_id, 'UGX', 0.00, 'ACTIVE',
        500000.00, 5000000.00, NOW()
    );
    
    -- Send Welcome Notification
    INSERT INTO gmg_master (
        id, entity_type, user_id, notification_title, notification_message,
        notification_type, status, created_at
    ) VALUES (
        CONCAT('NTF_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'NOTIFICATION', v_user_id,
        'Welcome to GMG Uganda!',
        'Your account has been created successfully. Start sending money now!',
        'SYSTEM', 'ACTIVE', NOW()
    );
    
    SELECT v_user_id AS user_id, v_wallet_id AS wallet_id, v_chipptertag AS chipptertag;
END //

-- 2. Process Transfer
CREATE PROCEDURE sp_process_transfer(
    IN p_sender_id VARCHAR(50),
    IN p_recipient_phone VARCHAR(20),
    IN p_amount DECIMAL(20,4),
    IN p_currency VARCHAR(10),
    IN p_description TEXT
)
BEGIN
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_sender_balance DECIMAL(20,4);
    DECLARE v_recipient_id VARCHAR(50);
    DECLARE v_fee DECIMAL(20,4);
    DECLARE v_total_debit DECIMAL(20,4);
    
    SET v_txn_id = CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('REF', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Calculate fee (0.5% with min 100 UGX)
    SET v_fee = GREATEST(p_amount * 0.005, 100);
    SET v_total_debit = p_amount + v_fee;
    
    -- Get sender balance
    SELECT balance INTO v_sender_balance
    FROM gmg_master
    WHERE user_id = p_sender_id 
    AND entity_type = 'WALLET' 
    AND currency = p_currency
    AND is_deleted = FALSE;
    
    -- Check sufficient balance
    IF v_sender_balance < v_total_debit THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Get recipient user_id
    SELECT user_id INTO v_recipient_id
    FROM gmg_master
    WHERE user_phone = p_recipient_phone 
    AND entity_type = 'USER'
    AND is_deleted = FALSE
    LIMIT 1;
    
    -- Create transaction record
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        fee, sender_id, recipient_id, recipient_phone, status, reference,
        description, created_at, processed_at
    ) VALUES (
        v_txn_id, 'TRANSACTION', p_sender_id, 'TRANSFER', p_amount, p_currency,
        v_fee, p_sender_id, v_recipient_id, p_recipient_phone, 'COMPLETED', v_reference,
        p_description, NOW(), NOW()
    );
    
    -- Debit sender wallet
    UPDATE gmg_master
    SET balance = balance - v_total_debit,
        updated_at = NOW()
    WHERE user_id = p_sender_id 
    AND entity_type = 'WALLET' 
    AND currency = p_currency;
    
    -- Credit recipient wallet
    UPDATE gmg_master
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = v_recipient_id 
    AND entity_type = 'WALLET' 
    AND currency = p_currency;
    
    -- Send notifications
    INSERT INTO gmg_master (
        id, entity_type, user_id, notification_title, notification_message,
        notification_type, status, created_at
    ) VALUES (
        CONCAT('NTF_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'NOTIFICATION', v_recipient_id,
        'Money Received!',
        CONCAT('You received ', p_currency, ' ', FORMAT(p_amount, 2), ' from ', p_sender_id),
        'TRANSACTION', 'ACTIVE', NOW()
    );
    
    SELECT v_txn_id AS transaction_id, v_reference AS reference, 'SUCCESS' AS status;
END //

-- 3. Deposit Money
CREATE PROCEDURE sp_deposit_money(
    IN p_user_id VARCHAR(50),
    IN p_amount DECIMAL(20,4),
    IN p_currency VARCHAR(10),
    IN p_method VARCHAR(50)
)
BEGIN
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    
    SET v_txn_id = CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('DEP', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Create deposit transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, created_at, completed_at
    ) VALUES (
        v_txn_id, 'TRANSACTION', p_user_id, 'DEPOSIT', p_amount, p_currency,
        'COMPLETED', v_reference, CONCAT('Deposit via ', p_method), NOW(), NOW()
    );
    
    -- Credit wallet
    UPDATE gmg_master
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND entity_type = 'WALLET' 
    AND currency = p_currency;
    
    SELECT v_txn_id AS transaction_id, v_reference AS reference, 'SUCCESS' AS status;
END //

-- 4. Buy Airtime
CREATE PROCEDURE sp_buy_airtime(
    IN p_user_id VARCHAR(50),
    IN p_phone VARCHAR(20),
    IN p_network VARCHAR(20),
    IN p_amount DECIMAL(20,4)
)
BEGIN
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_balance DECIMAL(20,4);
    
    SET v_txn_id = CONCAT('AIR_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('AIR', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Check balance
    SELECT balance INTO v_balance
    FROM gmg_master
    WHERE user_id = p_user_id 
    AND entity_type = 'WALLET' 
    AND currency = 'UGX';
    
    IF v_balance < p_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Create airtime transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        phone_number, network, status, reference, created_at, completed_at
    ) VALUES (
        v_txn_id, 'AIRTIME', p_user_id, 'AIRTIME', p_amount, 'UGX',
        p_phone, p_network, 'COMPLETED', v_reference, NOW(), NOW()
    );
    
    -- Debit wallet
    UPDATE gmg_master
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND entity_type = 'WALLET' 
    AND currency = 'UGX';
    
    SELECT v_txn_id AS transaction_id, v_reference AS reference, 'SUCCESS' AS status;
END //

-- 5. Get User Dashboard
CREATE PROCEDURE sp_get_dashboard(IN p_user_id VARCHAR(50))
BEGIN
    -- User profile
    SELECT user_id, user_phone, user_email, user_name, chipptertag,
           kyc_level, kyc_verified, status, created_at
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'USER' AND is_deleted = FALSE;
    
    -- Wallet balance
    SELECT currency, balance, daily_limit, monthly_limit, 
           daily_spent, monthly_spent, status
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND is_deleted = FALSE;
    
    -- Recent transactions (last 20)
    SELECT id, transaction_type, amount, currency, fee, recipient_phone,
           status, reference, description, created_at
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'TRANSACTION' AND is_deleted = FALSE
    ORDER BY created_at DESC LIMIT 20;
    
    -- Active cards
    SELECT id, card_last_four, card_brand, expiry_date, balance, status
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'CARD' AND is_deleted = FALSE;
    
    -- Active loans
    SELECT id, loan_amount, amount_paid, due_date, loan_status
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'LOAN' 
    AND loan_status IN ('ACTIVE', 'APPROVED') AND is_deleted = FALSE;
END //

-- 6. Apply for Loan
CREATE PROCEDURE sp_apply_loan(
    IN p_user_id VARCHAR(50),
    IN p_amount DECIMAL(20,4),
    IN p_period_days INT,
    IN p_purpose VARCHAR(200)
)
BEGIN
    DECLARE v_loan_id VARCHAR(50);
    DECLARE v_interest_rate DECIMAL(5,2);
    DECLARE v_total_repayment DECIMAL(20,4);
    DECLARE v_due_date DATE;
    
    SET v_loan_id = CONCAT('LON_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_interest_rate = 10.00; -- 10% interest
    SET v_total_repayment = p_amount * (1 + (v_interest_rate / 100));
    SET v_due_date = DATE_ADD(CURDATE(), INTERVAL p_period_days DAY);
    
    -- Create loan record
    INSERT INTO gmg_master (
        id, entity_type, user_id, loan_amount, interest_rate,
        loan_period_days, total_repayment, due_date, loan_purpose,
        loan_status, status, created_at
    ) VALUES (
        v_loan_id, 'LOAN', p_user_id, p_amount, v_interest_rate,
        p_period_days, v_total_repayment, v_due_date, p_purpose,
        'PENDING', 'PENDING', NOW()
    );
    
    SELECT v_loan_id AS loan_id, v_total_repayment AS total_repayment, 
           v_due_date AS due_date, 'PENDING_APPROVAL' AS status;
END //

-- 7. Create Virtual Card
CREATE PROCEDURE sp_create_virtual_card(
    IN p_user_id VARCHAR(50),
    IN p_cardholder_name VARCHAR(100),
    IN p_initial_balance DECIMAL(20,4)
)
BEGIN
    DECLARE v_card_id VARCHAR(50);
    DECLARE v_card_number VARCHAR(16);
    DECLARE v_cvv VARCHAR(3);
    DECLARE v_expiry VARCHAR(7);
    
    SET v_card_id = CONCAT('CRD_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_card_number = CONCAT('4111', LPAD(FLOOR(RAND() * 1000000000000), 12, '0'));
    SET v_cvv = LPAD(FLOOR(RAND() * 1000), 3, '0');
    SET v_expiry = DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 YEAR), '%m/%Y');
    
    -- Create card
    INSERT INTO gmg_master (
        id, entity_type, user_id, card_number, card_last_four,
        cardholder_name, cvv_hash, expiry_date, card_brand, currency,
        balance, status, created_at
    ) VALUES (
        v_card_id, 'CARD', p_user_id, v_card_number, RIGHT(v_card_number, 4),
        p_cardholder_name, SHA2(v_cvv, 256), v_expiry, 'VISA', 'USD',
        p_initial_balance, 'ACTIVE', NOW()
    );
    
    SELECT v_card_id AS card_id, v_card_number AS card_number, 
           v_cvv AS cvv, v_expiry AS expiry_date, 'SUCCESS' AS status;
END //

DELIMITER ;

-- ================================================================================
-- TRIGGERS FOR AUTOMATED OPERATIONS
-- ================================================================================

DELIMITER //

-- Auto-generate reference for transactions
CREATE TRIGGER trg_before_transaction_insert
BEFORE INSERT ON gmg_master
FOR EACH ROW
BEGIN
    IF NEW.entity_type = 'TRANSACTION' AND NEW.reference IS NULL THEN
        SET NEW.reference = CONCAT('REF', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    END IF;
END //

-- Update last_login_at on user access
CREATE TRIGGER trg_update_last_login
BEFORE UPDATE ON gmg_master
FOR EACH ROW
BEGIN
    IF NEW.entity_type = 'USER' AND OLD.status = 'ACTIVE' AND NEW.status = 'ACTIVE' THEN
        SET NEW.last_login_at = NOW();
    END IF;
END //

DELIMITER ;

-- ================================================================================
-- INITIAL DATA - SYSTEM CONFIGURATION
-- ================================================================================

-- Exchange Rates (UGX base)
INSERT INTO gmg_master (id, entity_type, from_currency, to_currency, exchange_rate, status, created_at) VALUES
('XR_UGX_USD', 'EXCHANGE_RATE', 'UGX', 'USD', 0.00027, 'ACTIVE', NOW()),
('XR_USD_UGX', 'EXCHANGE_RATE', 'USD', 'UGX', 3700.00, 'ACTIVE', NOW()),
('XR_UGX_KES', 'EXCHANGE_RATE', 'UGX', 'KES', 0.030, 'ACTIVE', NOW()),
('XR_KES_UGX', 'EXCHANGE_RATE', 'KES', 'UGX', 33.33, 'ACTIVE', NOW()),
('XR_UGX_EUR', 'EXCHANGE_RATE', 'UGX', 'EUR', 0.00024, 'ACTIVE', NOW()),
('XR_EUR_UGX', 'EXCHANGE_RATE', 'EUR', 'UGX', 4100.00, 'ACTIVE', NOW()),
('XR_UGX_GBP', 'EXCHANGE_RATE', 'UGX', 'GBP', 0.00021, 'ACTIVE', NOW()),
('XR_GBP_UGX', 'EXCHANGE_RATE', 'GBP', 'UGX', 4700.00, 'ACTIVE', NOW());

-- Data Bundles Configuration
INSERT INTO gmg_master (id, entity_type, network, bundle_name, data_size, validity_days, amount, status, created_at) VALUES
('DB_MTN_100MB', 'DATA', 'MTN', 'Daily Bundle', '100MB', 1, 1000, 'ACTIVE', NOW()),
('DB_MTN_500MB', 'DATA', 'MTN', 'Weekly Bundle', '500MB', 7, 5000, 'ACTIVE', NOW()),
('DB_MTN_1GB', 'DATA', 'MTN', 'Weekly Bundle', '1GB', 7, 10000, 'ACTIVE', NOW()),
('DB_MTN_5GB', 'DATA', 'MTN', 'Monthly Bundle', '5GB', 30, 35000, 'ACTIVE', NOW()),
('DB_MTN_10GB', 'DATA', 'MTN', 'Monthly Bundle', '10GB', 30, 60000, 'ACTIVE', NOW()),
('DB_AIRTEL_100MB', 'DATA', 'AIRTEL', 'Daily Bundle', '100MB', 1, 1000, 'ACTIVE', NOW()),
('DB_AIRTEL_500MB', 'DATA', 'AIRTEL', 'Weekly Bundle', '500MB', 7, 5000, 'ACTIVE', NOW()),
('DB_AIRTEL_1GB', 'DATA', 'AIRTEL', 'Weekly Bundle', '1GB', 7, 10000, 'ACTIVE', NOW()),
('DB_AIRTEL_5GB', 'DATA', 'AIRTEL', 'Monthly Bundle', '5GB', 30, 35000, 'ACTIVE', NOW()),
('DB_AFRICELL_100MB', 'DATA', 'AFRICELL', 'Daily Bundle', '100MB', 1, 1000, 'ACTIVE', NOW()),
('DB_AFRICELL_1GB', 'DATA', 'AFRICELL', 'Weekly Bundle', '1GB', 7, 10000, 'ACTIVE', NOW());

-- Bill Providers Configuration
INSERT INTO gmg_master (id, entity_type, bill_type, provider, provider_code, status, created_at) VALUES
('BP_UMEME', 'BILL_PAYMENT', 'ELECTRICITY', 'UMEME', 'UMEME_001', 'ACTIVE', NOW()),
('BP_NWSC', 'BILL_PAYMENT', 'WATER', 'NWSC', 'NWSC_001', 'ACTIVE', NOW()),
('BP_DSTV', 'BILL_PAYMENT', 'TV', 'DSTV', 'DSTV_001', 'ACTIVE', NOW()),
('BP_GOTV', 'BILL_PAYMENT', 'TV', 'GOTV', 'GOTV_001', 'ACTIVE', NOW()),
('BP_STARTIMES', 'BILL_PAYMENT', 'TV', 'StarTimes', 'START_001', 'ACTIVE', NOW()),
('BP_ZUKU', 'BILL_PAYMENT', 'TV', 'Zuku', 'ZUKU_001', 'ACTIVE', NOW());

-- ================================================================================
-- PERFORMANCE OPTIMIZATION - ADDITIONAL INDEXES
-- ================================================================================

CREATE INDEX idx_composite_transaction_search ON gmg_master(user_id, entity_type, transaction_type, status, created_at);
CREATE INDEX idx_composite_wallet_currency ON gmg_master(user_id, entity_type, currency) WHERE entity_type = 'WALLET';
CREATE INDEX idx_composite_active_loans ON gmg_master(user_id, entity_type, loan_status) WHERE entity_type = 'LOAN';
CREATE INDEX idx_date_range_transactions ON gmg_master(created_at, entity_type) WHERE entity_type = 'TRANSACTION';

-- ================================================================================
-- ADVANCED STORED PROCEDURES
-- ================================================================================

DELIMITER //

-- 8. Process Bill Payment
CREATE PROCEDURE sp_pay_bill(
    IN p_user_id VARCHAR(50),
    IN p_bill_type VARCHAR(20),
    IN p_provider VARCHAR(50),
    IN p_account_number VARCHAR(100),
    IN p_amount DECIMAL(20,4)
)
BEGIN
    DECLARE v_bill_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_balance DECIMAL(20,4);
    DECLARE v_token VARCHAR(50);
    
    SET v_bill_id = CONCAT('BILL_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('BP', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    SET v_token = CONCAT(FLOOR(RAND() * 10000000000000000), '-', FLOOR(RAND() * 10000000000000000));
    
    -- Check balance
    SELECT balance INTO v_balance
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    IF v_balance < p_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Create bill payment record
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, bill_type, provider,
        account_number, amount, currency, token, status, reference, created_at, completed_at
    ) VALUES (
        v_bill_id, 'BILL_PAYMENT', p_user_id, 'BILL', p_bill_type, p_provider,
        p_account_number, p_amount, 'UGX', v_token, 'COMPLETED', v_reference, NOW(), NOW()
    );
    
    -- Debit wallet
    UPDATE gmg_master
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    -- Create transaction record
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, created_at, completed_at
    ) VALUES (
        CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'TRANSACTION', p_user_id, 'BILL', p_amount, 'UGX',
        'COMPLETED', v_reference, CONCAT('Bill payment to ', p_provider), NOW(), NOW()
    );
    
    SELECT v_bill_id AS bill_id, v_reference AS reference, v_token AS token, 'SUCCESS' AS status;
END //

-- 9. Register Agent
CREATE PROCEDURE sp_register_agent(
    IN p_user_id VARCHAR(50),
    IN p_business_name VARCHAR(100),
    IN p_location VARCHAR(200),
    IN p_latitude DECIMAL(10,8),
    IN p_longitude DECIMAL(11,8)
)
BEGIN
    DECLARE v_agent_id VARCHAR(50);
    DECLARE v_agent_code VARCHAR(20);
    DECLARE v_wallet_id VARCHAR(50);
    
    SET v_agent_id = CONCAT('AGT_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_agent_code = CONCAT('AG', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
    SET v_wallet_id = CONCAT('WLT_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    
    -- Create agent record
    INSERT INTO gmg_master (
        id, entity_type, user_id, agent_code, business_name, location,
        latitude, longitude, commission_rate, total_commission_earned,
        status, created_at
    ) VALUES (
        v_agent_id, 'AGENT', p_user_id, v_agent_code, p_business_name, p_location,
        p_latitude, p_longitude, 2.50, 0.00, 'PENDING', NOW()
    );
    
    -- Create agent float wallet
    INSERT INTO gmg_master (
        id, entity_type, user_id, currency, balance, status, created_at
    ) VALUES (
        v_wallet_id, 'WALLET', p_user_id, 'UGX', 0.00, 'ACTIVE', NOW()
    );
    
    -- Update user role
    UPDATE gmg_master
    SET status = 'ACTIVE', updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'USER';
    
    SELECT v_agent_id AS agent_id, v_agent_code AS agent_code, 'PENDING_APPROVAL' AS status;
END //

-- 10. Agent Cash In/Out
CREATE PROCEDURE sp_agent_transaction(
    IN p_agent_id VARCHAR(50),
    IN p_customer_phone VARCHAR(20),
    IN p_transaction_type VARCHAR(20),
    IN p_amount DECIMAL(20,4)
)
BEGIN
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_agent_balance DECIMAL(20,4);
    DECLARE v_customer_id VARCHAR(50);
    DECLARE v_commission DECIMAL(20,4);
    DECLARE v_agent_code VARCHAR(20);
    
    SET v_txn_id = CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('AG', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    SET v_commission = p_amount * 0.025; -- 2.5% commission
    
    -- Get agent code
    SELECT agent_code INTO v_agent_code
    FROM gmg_master
    WHERE user_id = p_agent_id AND entity_type = 'AGENT';
    
    -- Get agent float balance
    SELECT balance INTO v_agent_balance
    FROM gmg_master
    WHERE user_id = p_agent_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    -- Get customer user_id
    SELECT user_id INTO v_customer_id
    FROM gmg_master
    WHERE user_phone = p_customer_phone AND entity_type = 'USER'
    LIMIT 1;
    
    IF p_transaction_type = 'CASH_IN' THEN
        -- Customer deposits cash with agent
        IF v_agent_balance < p_amount THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Agent has insufficient float';
        END IF;
        
        -- Debit agent float
        UPDATE gmg_master
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE user_id = p_agent_id AND entity_type = 'WALLET' AND currency = 'UGX';
        
        -- Credit customer wallet
        UPDATE gmg_master
        SET balance = balance + p_amount, updated_at = NOW()
        WHERE user_id = v_customer_id AND entity_type = 'WALLET' AND currency = 'UGX';
        
    ELSEIF p_transaction_type = 'CASH_OUT' THEN
        -- Customer withdraws cash from agent
        DECLARE v_customer_balance DECIMAL(20,4);
        
        SELECT balance INTO v_customer_balance
        FROM gmg_master
        WHERE user_id = v_customer_id AND entity_type = 'WALLET' AND currency = 'UGX';
        
        IF v_customer_balance < p_amount THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer has insufficient balance';
        END IF;
        
        -- Debit customer wallet
        UPDATE gmg_master
        SET balance = balance - p_amount, updated_at = NOW()
        WHERE user_id = v_customer_id AND entity_type = 'WALLET' AND currency = 'UGX';
        
        -- Credit agent float
        UPDATE gmg_master
        SET balance = balance + p_amount, updated_at = NOW()
        WHERE user_id = p_agent_id AND entity_type = 'WALLET' AND currency = 'UGX';
    END IF;
    
    -- Record transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        sender_id, recipient_id, recipient_phone, commission, status,
        reference, description, created_at, completed_at
    ) VALUES (
        v_txn_id, 'TRANSACTION', p_agent_id, p_transaction_type, p_amount, 'UGX',
        CASE WHEN p_transaction_type = 'CASH_IN' THEN p_agent_id ELSE v_customer_id END,
        CASE WHEN p_transaction_type = 'CASH_IN' THEN v_customer_id ELSE p_agent_id END,
        p_customer_phone, v_commission, 'COMPLETED', v_reference,
        CONCAT('Agent ', p_transaction_type, ' via ', v_agent_code), NOW(), NOW()
    );
    
    -- Record commission
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        commission, status, reference, parent_id, created_at
    ) VALUES (
        CONCAT('COM_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'COMMISSION', p_agent_id, 'COMMISSION', v_commission, 'UGX',
        v_commission, 'COMPLETED', v_reference, v_txn_id, NOW()
    );
    
    -- Update agent total commission
    UPDATE gmg_master
    SET total_commission_earned = total_commission_earned + v_commission,
        updated_at = NOW()
    WHERE user_id = p_agent_id AND entity_type = 'AGENT';
    
    SELECT v_txn_id AS transaction_id, v_reference AS reference, 
           v_commission AS commission_earned, 'SUCCESS' AS status;
END //

-- 11. Buy Data Bundle
CREATE PROCEDURE sp_buy_data(
    IN p_user_id VARCHAR(50),
    IN p_phone VARCHAR(20),
    IN p_network VARCHAR(20),
    IN p_bundle_id VARCHAR(50)
)
BEGIN
    DECLARE v_data_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_balance DECIMAL(20,4);
    DECLARE v_amount DECIMAL(20,4);
    DECLARE v_bundle_name VARCHAR(100);
    DECLARE v_data_size VARCHAR(50);
    
    SET v_data_id = CONCAT('DATA_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('DATA', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Get bundle details
    SELECT amount, bundle_name, data_size INTO v_amount, v_bundle_name, v_data_size
    FROM gmg_master
    WHERE id = p_bundle_id AND entity_type = 'DATA';
    
    -- Check balance
    SELECT balance INTO v_balance
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    IF v_balance < v_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Create data purchase record
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        phone_number, network, bundle_name, data_size, status, reference,
        created_at, completed_at
    ) VALUES (
        v_data_id, 'DATA', p_user_id, 'DATA', v_amount, 'UGX',
        p_phone, p_network, v_bundle_name, v_data_size, 'COMPLETED', v_reference,
        NOW(), NOW()
    );
    
    -- Debit wallet
    UPDATE gmg_master
    SET balance = balance - v_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    SELECT v_data_id AS data_id, v_reference AS reference, 'SUCCESS' AS status;
END //

-- 12. Request Loan Disbursement (Admin/Auto-approval)
CREATE PROCEDURE sp_disburse_loan(
    IN p_loan_id VARCHAR(50),
    IN p_approved_by VARCHAR(50)
)
BEGIN
    DECLARE v_user_id VARCHAR(50);
    DECLARE v_loan_amount DECIMAL(20,4);
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    
    SET v_txn_id = CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('LOAN', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Get loan details
    SELECT user_id, loan_amount INTO v_user_id, v_loan_amount
    FROM gmg_master
    WHERE id = p_loan_id AND entity_type = 'LOAN';
    
    -- Update loan status
    UPDATE gmg_master
    SET loan_status = 'ACTIVE',
        status = 'ACTIVE',
        approved_by = p_approved_by,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_loan_id AND entity_type = 'LOAN';
    
    -- Credit user wallet
    UPDATE gmg_master
    SET balance = balance + v_loan_amount, updated_at = NOW()
    WHERE user_id = v_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    -- Create disbursement transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, parent_id, created_at, completed_at
    ) VALUES (
        v_txn_id, 'TRANSACTION', v_user_id, 'LOAN_DISBURSEMENT', v_loan_amount, 'UGX',
        'COMPLETED', v_reference, 'Loan disbursement', p_loan_id, NOW(), NOW()
    );
    
    -- Send notification
    INSERT INTO gmg_master (
        id, entity_type, user_id, notification_title, notification_message,
        notification_type, status, created_at
    ) VALUES (
        CONCAT('NTF_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'NOTIFICATION', v_user_id,
        'Loan Approved!',
        CONCAT('Your loan of UGX ', FORMAT(v_loan_amount, 2), ' has been disbursed to your wallet.'),
        'TRANSACTION', 'ACTIVE', NOW()
    );
    
    SELECT v_txn_id AS transaction_id, v_reference AS reference, 'DISBURSED' AS status;
END //

-- 13. Make Loan Repayment
CREATE PROCEDURE sp_repay_loan(
    IN p_loan_id VARCHAR(50),
    IN p_user_id VARCHAR(50),
    IN p_amount DECIMAL(20,4)
)
BEGIN
    DECLARE v_balance DECIMAL(20,4);
    DECLARE v_total_repayment DECIMAL(20,4);
    DECLARE v_amount_paid DECIMAL(20,4);
    DECLARE v_remaining DECIMAL(20,4);
    DECLARE v_txn_id VARCHAR(50);
    DECLARE v_reference VARCHAR(100);
    DECLARE v_new_status VARCHAR(20);
    
    SET v_txn_id = CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_reference = CONCAT('REPAYL', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
    
    -- Get loan details
    SELECT total_repayment, amount_paid INTO v_total_repayment, v_amount_paid
    FROM gmg_master
    WHERE id = p_loan_id AND entity_type = 'LOAN';
    
    SET v_remaining = v_total_repayment - (v_amount_paid + p_amount);
    
    -- Check if fully paid
    IF v_remaining <= 0 THEN
        SET v_new_status = 'PAID';
    ELSE
        SET v_new_status = 'ACTIVE';
    END IF;
    
    -- Check balance
    SELECT balance INTO v_balance
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    IF v_balance < p_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Update loan
    UPDATE gmg_master
    SET amount_paid = amount_paid + p_amount,
        loan_status = v_new_status,
        updated_at = NOW()
    WHERE id = p_loan_id AND entity_type = 'LOAN';
    
    -- Debit wallet
    UPDATE gmg_master
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    -- Create repayment transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, parent_id, created_at, completed_at
    ) VALUES (
        v_txn_id, 'TRANSACTION', p_user_id, 'LOAN_REPAYMENT', p_amount, 'UGX',
        'COMPLETED', v_reference, 'Loan repayment', p_loan_id, NOW(), NOW()
    );
    
    SELECT v_txn_id AS transaction_id, v_remaining AS remaining_balance, 
           v_new_status AS loan_status, 'SUCCESS' AS status;
END //

-- 14. Subscribe to Insurance
CREATE PROCEDURE sp_subscribe_insurance(
    IN p_user_id VARCHAR(50),
    IN p_insurance_type VARCHAR(20),
    IN p_plan VARCHAR(20),
    IN p_beneficiary_name VARCHAR(100),
    IN p_beneficiary_phone VARCHAR(20)
)
BEGIN
    DECLARE v_insurance_id VARCHAR(50);
    DECLARE v_premium DECIMAL(20,4);
    DECLARE v_coverage DECIMAL(20,4);
    DECLARE v_next_payment DATE;
    DECLARE v_balance DECIMAL(20,4);
    
    SET v_insurance_id = CONCAT('INS_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    SET v_next_payment = DATE_ADD(CURDATE(), INTERVAL 1 MONTH);
    
    -- Calculate premium and coverage based on type and plan
    IF p_insurance_type = 'HEALTH' THEN
        IF p_plan = 'BASIC' THEN
            SET v_premium = 50000; SET v_coverage = 5000000;
        ELSEIF p_plan = 'STANDARD' THEN
            SET v_premium = 100000; SET v_coverage = 10000000;
        ELSE
            SET v_premium = 200000; SET v_coverage = 20000000;
        END IF;
    ELSEIF p_insurance_type = 'LIFE' THEN
        IF p_plan = 'BASIC' THEN
            SET v_premium = 75000; SET v_coverage = 10000000;
        ELSEIF p_plan = 'STANDARD' THEN
            SET v_premium = 150000; SET v_coverage = 25000000;
        ELSE
            SET v_premium = 300000; SET v_coverage = 50000000;
        END IF;
    ELSEIF p_insurance_type = 'ACCIDENT' THEN
        SET v_premium = 25000; SET v_coverage = 5000000;
    ELSE -- DEVICE
        SET v_premium = 30000; SET v_coverage = 3000000;
    END IF;
    
    -- Check balance
    SELECT balance INTO v_balance
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    IF v_balance < v_premium THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance for first premium';
    END IF;
    
    -- Create insurance policy
    INSERT INTO gmg_master (
        id, entity_type, user_id, insurance_type, insurance_plan,
        premium_amount, coverage_amount, beneficiary_name, beneficiary_phone,
        start_date, next_payment_date, status, created_at
    ) VALUES (
        v_insurance_id, 'INSURANCE', p_user_id, p_insurance_type, p_plan,
        v_premium, v_coverage, p_beneficiary_name, p_beneficiary_phone,
        CURDATE(), v_next_payment, 'ACTIVE', NOW()
    );
    
    -- Debit first premium
    UPDATE gmg_master
    SET balance = balance - v_premium, updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
    
    -- Create premium transaction
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, parent_id, created_at, completed_at
    ) VALUES (
        CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'TRANSACTION', p_user_id, 'INSURANCE_PREMIUM', v_premium, 'UGX',
        'COMPLETED', CONCAT('INS', UNIX_TIMESTAMP()), 'Insurance premium payment',
        v_insurance_id, NOW(), NOW()
    );
    
    SELECT v_insurance_id AS insurance_id, v_premium AS monthly_premium,
           v_coverage AS coverage_amount, v_next_payment AS next_payment_date, 'SUCCESS' AS status;
END //

-- 15. Get Transaction History with Filters
CREATE PROCEDURE sp_get_transaction_history(
    IN p_user_id VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_transaction_type VARCHAR(50),
    IN p_limit INT
)
BEGIN
    IF p_transaction_type IS NULL OR p_transaction_type = '' THEN
        SELECT id, transaction_type, amount, currency, fee, recipient_phone,
               status, reference, description, created_at
        FROM gmg_master
        WHERE user_id = p_user_id 
        AND entity_type = 'TRANSACTION'
        AND is_deleted = FALSE
        AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        ORDER BY created_at DESC
        LIMIT p_limit;
    ELSE
        SELECT id, transaction_type, amount, currency, fee, recipient_phone,
               status, reference, description, created_at
        FROM gmg_master
        WHERE user_id = p_user_id 
        AND entity_type = 'TRANSACTION'
        AND transaction_type = p_transaction_type
        AND is_deleted = FALSE
        AND DATE(created_at) BETWEEN p_start_date AND p_end_date
        ORDER BY created_at DESC
        LIMIT p_limit;
    END IF;
END //

DELIMITER ;

-- ================================================================================
-- ANALYTICS & REPORTING VIEWS
-- ================================================================================

-- Daily Transaction Summary
CREATE OR REPLACE VIEW v_daily_transaction_summary AS
SELECT 
    DATE(created_at) AS transaction_date,
    transaction_type,
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_amount,
    SUM(fee) AS total_fees,
    currency
FROM gmg_master
WHERE entity_type = 'TRANSACTION'
AND is_deleted = FALSE
GROUP BY DATE(created_at), transaction_type, currency
ORDER BY transaction_date DESC;

-- User Growth Analytics
CREATE OR REPLACE VIEW v_user_growth AS
SELECT 
    DATE(created_at) AS signup_date,
    COUNT(*) AS new_users,
    kyc_level,
    status
FROM gmg_master
WHERE entity_type = 'USER'
AND is_deleted = FALSE
GROUP BY DATE(created_at), kyc_level, status
ORDER BY signup_date DESC;

-- Revenue Analytics
CREATE OR REPLACE VIEW v_revenue_analytics AS
SELECT 
    DATE(created_at) AS revenue_date,
    SUM(fee) AS transaction_fees,
    SUM(commission) AS agent_commissions,
    SUM(fee) - SUM(commission) AS net_revenue,
    COUNT(DISTINCT user_id) AS active_users
FROM gmg_master
WHERE entity_type = 'TRANSACTION'
AND status = 'COMPLETED'
AND is_deleted = FALSE
GROUP BY DATE(created_at)
ORDER BY revenue_date DESC;

-- Agent Performance Leaderboard
CREATE OR REPLACE VIEW v_agent_leaderboard AS
SELECT 
    agent_code,
    business_name,
    location,
    total_commission_earned,
    commission_rate,
    status,
    created_at
FROM gmg_master
WHERE entity_type = 'AGENT'
AND is_deleted = FALSE
ORDER BY total_commission_earned DESC;

-- ================================================================================
-- UTILITY FUNCTIONS
-- ================================================================================

DELIMITER //

-- Generate unique transaction reference
CREATE FUNCTION fn_generate_reference(p_prefix VARCHAR(10))
RETURNS VARCHAR(100)
DETERMINISTIC
BEGIN
    RETURN CONCAT(p_prefix, UNIX_TIMESTAMP(), FLOOR(RAND() * 10000));
END //

-- Calculate transaction fee
CREATE FUNCTION fn_calculate_fee(p_amount DECIMAL(20,4), p_type VARCHAR(50))
RETURNS DECIMAL(20,4)
DETERMINISTIC
BEGIN
    DECLARE v_fee DECIMAL(20,4);
    
    IF p_type IN ('TRANSFER', 'WITHDRAW') THEN
        SET v_fee = GREATEST(p_amount * 0.005, 100); -- 0.5% min 100
    ELSEIF p_type = 'AIRTIME' THEN
        SET v_fee = 0; -- No fee for airtime
    ELSEIF p_type = 'BILL' THEN
        SET v_fee = 500; -- Flat 500 UGX for bills
    ELSE
        SET v_fee = 0;
    END IF;
    
    RETURN v_fee;
END //

-- Check if user can perform transaction (limits check)
CREATE FUNCTION fn_can_transact(p_user_id VARCHAR(50), p_amount DECIMAL(20,4))
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE v_daily_limit DECIMAL(20,4);
    DECLARE v_daily_spent DECIMAL(20,4);
    DECLARE v_monthly_limit DECIMAL(20,4);
    DECLARE v_monthly_spent DECIMAL(20,4);
    
    SELECT daily_limit, daily_spent, monthly_limit, monthly_spent
    INTO v_daily_limit, v_daily_spent, v_monthly_limit, v_monthly_spent
    FROM gmg_master
    WHERE user_id = p_user_id AND entity_type = 'WALLET'
    LIMIT 1;
    
    IF (v_daily_spent + p_amount) > v_daily_limit THEN
        RETURN FALSE;
    END IF;
    
    IF (v_monthly_spent + p_amount) > v_monthly_limit THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END //

-- Get user KYC tier limits
CREATE FUNCTION fn_get_kyc_limit(p_kyc_level VARCHAR(20), p_period VARCHAR(10))
RETURNS DECIMAL(20,4)
DETERMINISTIC
BEGIN
    DECLARE v_limit DECIMAL(20,4);
    
    IF p_kyc_level = 'TIER_0' THEN
        IF p_period = 'DAILY' THEN SET v_limit = 100000;
        ELSE SET v_limit = 1000000;
        END IF;
    ELSEIF p_kyc_level = 'TIER_1' THEN
        IF p_period = 'DAILY' THEN SET v_limit = 500000;
        ELSE SET v_limit = 5000000;
        END IF;
    ELSEIF p_kyc_level = 'TIER_2' THEN
        IF p_period = 'DAILY' THEN SET v_limit = 2000000;
        ELSE SET v_limit = 20000000;
        END IF;
    ELSE -- TIER_3
        IF p_period = 'DAILY' THEN SET v_limit = 10000000;
        ELSE SET v_limit = 100000000;
        END IF;
    END IF;
    
    RETURN v_limit;
END //

DELIMITER ;

-- ================================================================================
-- SCHEDULED JOBS PROCEDURES (Call via cron/scheduler)
-- ================================================================================

DELIMITER //

-- Reset daily spending limits (Run at midnight)
CREATE PROCEDURE sp_reset_daily_limits()
BEGIN
    UPDATE gmg_master
    SET daily_spent = 0,
        updated_at = NOW()
    WHERE entity_type = 'WALLET';
    
    SELECT CONCAT('Reset ', ROW_COUNT(), ' wallet daily limits') AS result;
END //

-- Reset monthly spending limits (Run on 1st of month)
CREATE PROCEDURE sp_reset_monthly_limits()
BEGIN
    UPDATE gmg_master
    SET monthly_spent = 0,
        updated_at = NOW()
    WHERE entity_type = 'WALLET';
    
    SELECT CONCAT('Reset ', ROW_COUNT(), ' wallet monthly limits') AS result;
END //

-- Mark overdue loans (Run daily)
CREATE PROCEDURE sp_mark_overdue_loans()
BEGIN
    UPDATE gmg_master
    SET loan_status = 'OVERDUE',
        status = 'OVERDUE',
        updated_at = NOW()
    WHERE entity_type = 'LOAN'
    AND loan_status = 'ACTIVE'
    AND due_date < CURDATE()
    AND is_deleted = FALSE;
    
    SELECT CONCAT('Marked ', ROW_COUNT(), ' loans as overdue') AS result;
END //

-- Process insurance renewals (Run daily)
CREATE PROCEDURE sp_process_insurance_renewals()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_insurance_id VARCHAR(50);
    DECLARE v_user_id VARCHAR(50);
    DECLARE v_premium DECIMAL(20,4);
    DECLARE v_balance DECIMAL(20,4);
    
    DECLARE cur CURSOR FOR
        SELECT id, user_id, premium_amount
        FROM gmg_master
        WHERE entity_type = 'INSURANCE'
        AND status = 'ACTIVE'
        AND next_payment_date = CURDATE()
        AND is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_insurance_id, v_user_id, v_premium;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Get user balance
        SELECT balance INTO v_balance
        FROM gmg_master
        WHERE user_id = v_user_id AND entity_type = 'WALLET' AND currency = 'UGX'
        LIMIT 1;
        
        IF v_balance >= v_premium THEN
            -- Debit premium
            UPDATE gmg_master
            SET balance = balance - v_premium
            WHERE user_id = v_user_id AND entity_type = 'WALLET' AND currency = 'UGX';
            
            -- Update next payment date
            UPDATE gmg_master
            SET next_payment_date = DATE_ADD(next_payment_date, INTERVAL 1 MONTH),
                updated_at = NOW()
            WHERE id = v_insurance_id;
            
            -- Create transaction
            INSERT INTO gmg_master (
                id, entity_type, user_id, transaction_type, amount, currency,
                status, reference, description, parent_id, created_at, completed_at
            ) VALUES (
                CONCAT('TXN_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
                'TRANSACTION', v_user_id, 'INSURANCE_PREMIUM', v_premium, 'UGX',
                'COMPLETED', CONCAT('INS', UNIX_TIMESTAMP()), 'Insurance premium renewal',
                v_insurance_id, NOW(), NOW()
            );
        ELSE
            -- Mark as expired if insufficient balance
            UPDATE gmg_master
            SET status = 'EXPIRED',
                updated_at = NOW()
            WHERE id = v_insurance_id;
            
            -- Send notification
            INSERT INTO gmg_master (
                id, entity_type, user_id, notification_title, notification_message,
                notification_type, status, created_at
            ) VALUES (
                CONCAT('NTF_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
                'NOTIFICATION', v_user_id,
                'Insurance Policy Expired',
                'Your insurance policy has expired due to insufficient balance.',
                'SYSTEM', 'ACTIVE', NOW()
            );
        END IF;
    END LOOP;
    
    CLOSE cur;
    
    SELECT 'Insurance renewals processed' AS result;
END //

-- Clean up old OTPs (Run hourly)
CREATE PROCEDURE sp_cleanup_expired_otps()
BEGIN
    UPDATE gmg_master
    SET is_deleted = TRUE,
        deleted_at = NOW()
    WHERE entity_type IN ('NOTIFICATION', 'REFERRAL')
    AND otp_expires_at IS NOT NULL
    AND otp_expires_at < NOW()
    AND is_deleted = FALSE;
    
    SELECT CONCAT('Cleaned up ', ROW_COUNT(), ' expired OTPs') AS result;
END //

-- Generate daily reports
CREATE PROCEDURE sp_generate_daily_report(IN p_report_date DATE)
BEGIN
    -- Transaction summary
    SELECT 
        'Transaction Summary' AS report_section,
        transaction_type,
        COUNT(*) AS count,
        SUM(amount) AS total_amount,
        SUM(fee) AS total_fees,
        currency
    FROM gmg_master
    WHERE entity_type = 'TRANSACTION'
    AND DATE(created_at) = p_report_date
    AND is_deleted = FALSE
    GROUP BY transaction_type, currency;
    
    -- New user registrations
    SELECT 
        'New Users' AS report_section,
        COUNT(*) AS new_registrations,
        kyc_level,
        status
    FROM gmg_master
    WHERE entity_type = 'USER'
    AND DATE(created_at) = p_report_date
    AND is_deleted = FALSE
    GROUP BY kyc_level, status;
    
    -- Active agents
    SELECT 
        'Agent Performance' AS report_section,
        COUNT(*) AS active_agents,
        SUM(total_commission_earned) AS total_commissions
    FROM gmg_master
    WHERE entity_type = 'AGENT'
    AND status = 'ACTIVE'
    AND is_deleted = FALSE;
END //

DELIMITER ;

-- ================================================================================
-- ADMIN PROCEDURES
-- ================================================================================

DELIMITER //

-- Freeze user account
CREATE PROCEDURE sp_freeze_account(
    IN p_user_id VARCHAR(50),
    IN p_reason TEXT,
    IN p_admin_id VARCHAR(50)
)
BEGIN
    UPDATE gmg_master
    SET status = 'FROZEN',
        notes = p_reason,
        updated_by = p_admin_id,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND entity_type IN ('USER', 'WALLET')
    AND is_deleted = FALSE;
    
    -- Log action
    INSERT INTO gmg_master (
        id, entity_type, user_id, description, created_by, created_at
    ) VALUES (
        CONCAT('LOG_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'NOTIFICATION', p_user_id,
        CONCAT('Account frozen by admin: ', p_admin_id, '. Reason: ', p_reason),
        p_admin_id, NOW()
    );
    
    SELECT 'Account frozen successfully' AS result;
END //

-- Unfreeze user account
CREATE PROCEDURE sp_unfreeze_account(
    IN p_user_id VARCHAR(50),
    IN p_admin_id VARCHAR(50)
)
BEGIN
    UPDATE gmg_master
    SET status = 'ACTIVE',
        updated_by = p_admin_id,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND entity_type IN ('USER', 'WALLET')
    AND status = 'FROZEN'
    AND is_deleted = FALSE;
    
    SELECT 'Account unfrozen successfully' AS result;
END //

-- Reverse transaction
CREATE PROCEDURE sp_reverse_transaction(
    IN p_transaction_id VARCHAR(50),
    IN p_reason TEXT,
    IN p_admin_id VARCHAR(50)
)
BEGIN
    DECLARE v_user_id VARCHAR(50);
    DECLARE v_amount DECIMAL(20,4);
    DECLARE v_transaction_type VARCHAR(50);
    DECLARE v_sender_id VARCHAR(50);
    DECLARE v_recipient_id VARCHAR(50);
    DECLARE v_reversal_id VARCHAR(50);
    
    SET v_reversal_id = CONCAT('REV_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8));
    
    -- Get transaction details
    SELECT user_id, amount, transaction_type, sender_id, recipient_id
    INTO v_user_id, v_amount, v_transaction_type, v_sender_id, v_recipient_id
    FROM gmg_master
    WHERE id = p_transaction_id AND entity_type = 'TRANSACTION';
    
    -- Mark original as reversed
    UPDATE gmg_master
    SET status = 'REVERSED',
        notes = p_reason,
        updated_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Reverse the money movement
    IF v_transaction_type = 'TRANSFER' THEN
        -- Credit sender
        UPDATE gmg_master
        SET balance = balance + v_amount
        WHERE user_id = v_sender_id AND entity_type = 'WALLET';
        
        -- Debit recipient
        UPDATE gmg_master
        SET balance = balance - v_amount
        WHERE user_id = v_recipient_id AND entity_type = 'WALLET';
    ELSEIF v_transaction_type IN ('WITHDRAW', 'AIRTIME', 'DATA', 'BILL') THEN
        -- Credit user back
        UPDATE gmg_master
        SET balance = balance + v_amount
        WHERE user_id = v_user_id AND entity_type = 'WALLET';
    END IF;
    
    -- Create reversal record
    INSERT INTO gmg_master (
        id, entity_type, user_id, transaction_type, amount, currency,
        status, reference, description, parent_id, created_by, created_at, completed_at
    ) VALUES (
        v_reversal_id, 'TRANSACTION', v_user_id, 'REVERSAL', v_amount, 'UGX',
        'COMPLETED', CONCAT('REV', UNIX_TIMESTAMP()), p_reason,
        p_transaction_id, p_admin_id, NOW(), NOW()
    );
    
    SELECT v_reversal_id AS reversal_id, 'Transaction reversed successfully' AS result;
END //

-- Upgrade user KYC level
CREATE PROCEDURE sp_upgrade_kyc(
    IN p_user_id VARCHAR(50),
    IN p_new_level VARCHAR(20),
    IN p_admin_id VARCHAR(50)
)
BEGIN
    DECLARE v_daily_limit DECIMAL(20,4);
    DECLARE v_monthly_limit DECIMAL(20,4);
    
    -- Get new limits
    SET v_daily_limit = fn_get_kyc_limit(p_new_level, 'DAILY');
    SET v_monthly_limit = fn_get_kyc_limit(p_new_level, 'MONTHLY');
    
    -- Update user
    UPDATE gmg_master
    SET kyc_level = p_new_level,
        kyc_verified = TRUE,
        kyc_verified_by = p_admin_id,
        kyc_verified_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'USER';
    
    -- Update wallet limits
    UPDATE gmg_master
    SET daily_limit = v_daily_limit,
        monthly_limit = v_monthly_limit,
        updated_at = NOW()
    WHERE user_id = p_user_id AND entity_type = 'WALLET';
    
    -- Send notification
    INSERT INTO gmg_master (
        id, entity_type, user_id, notification_title, notification_message,
        notification_type, status, created_at
    ) VALUES (
        CONCAT('NTF_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
        'NOTIFICATION', p_user_id,
        'KYC Upgraded!',
        CONCAT('Your account has been upgraded to ', p_new_level, '. New limits apply.'),
        'SYSTEM', 'ACTIVE', NOW()
    );
    
    SELECT 'KYC upgraded successfully' AS result, v_daily_limit AS daily_limit, v_monthly_limit AS monthly_limit;
END //

DELIMITER ;

-- ================================================================================
-- SAMPLE DATA FOR TESTING
-- ================================================================================

-- Create test users
CALL sp_create_user('+256740933011', 'john@gmg.ug', 'John Doe', SHA2('1234', 256));
CALL sp_create_user('+256780123456', 'jane@gmg.ug', 'Jane Smith', SHA2('1234', 256));
CALL sp_create_user('+256701234567', 'agent@gmg.ug', 'Agent Shop', SHA2('1234', 256));

-- Add some balance to test users
UPDATE gmg_master SET balance = 500000 WHERE user_phone = '+256740933011' AND entity_type = 'WALLET';
UPDATE gmg_master SET balance = 300000 WHERE user_phone = '+256780123456' AND entity_type = 'WALLET';


-- ================================================================================