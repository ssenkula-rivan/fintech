/**
 * Transaction Manager Service
 * Production-grade transaction handling with ACID guarantees, idempotency, and saga pattern
 * 
 * Laws enforced:
 * - Law #99: Database Transactions (ACID)
 * - Law #56: Idempotency (prevent duplicate transactions)
 * - Law #96: Audit Logging
 * - Law #254: Design Architecture Before Coding
 */

const crypto = require('crypto');
const { log } = require('./structuredLogger');

// Transaction states (state machine)
const TransactionState = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REVERSED: 'REVERSED',
    EXPIRED: 'EXPIRED'
};

// Valid state transitions
const VALID_TRANSITIONS = {
    [TransactionState.PENDING]: [TransactionState.PROCESSING, TransactionState.EXPIRED, TransactionState.FAILED],
    [TransactionState.PROCESSING]: [TransactionState.COMPLETED, TransactionState.FAILED],
    [TransactionState.COMPLETED]: [TransactionState.REVERSED],
    [TransactionState.FAILED]: [], // Terminal state
    [TransactionState.REVERSED]: [], // Terminal state
    [TransactionState.EXPIRED]: [] // Terminal state
};

class TransactionManager {
    constructor(pool) {
        this.pool = pool;
        this.IDEMPOTENCY_TTL_HOURS = 24;
        this.PENDING_TIMEOUT_MINUTES = 15;
    }

    /**
     * Generate cryptographic hash for audit chain
     */
    generateAuditHash(previousHash, data) {
        const payload = JSON.stringify({
            previousHash: previousHash || 'GENESIS',
            data,
            timestamp: Date.now()
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Check if state transition is valid
     */
    isValidTransition(fromState, toState) {
        const validNextStates = VALID_TRANSITIONS[fromState] || [];
        return validNextStates.includes(toState);
    }

    /**
     * Check idempotency key and return cached response if exists
     */
    async checkIdempotency(connection, userId, transactionType, idempotencyKey) {
        if (!idempotencyKey) {
            return { exists: false };
        }

        const compositeKey = `${userId}:${transactionType}:${idempotencyKey}`;
        
        const [existing] = await connection.execute(
            `SELECT id, response, status, created_at 
             FROM idempotency_keys 
             WHERE composite_key = ? AND expires_at > NOW()`,
            [compositeKey]
        );

        if (existing.length > 0) {
            const record = existing[0];
            
            // If still processing, return in-progress status
            if (record.status === 'PROCESSING') {
                return {
                    exists: true,
                    inProgress: true,
                    message: 'Transaction is currently being processed'
                };
            }

            // Return cached response
            return {
                exists: true,
                inProgress: false,
                response: record.response ? JSON.parse(record.response) : null
            };
        }

        return { exists: false };
    }

    /**
     * Store idempotency key with processing status
     */
    async storeIdempotencyKey(connection, userId, transactionType, idempotencyKey, transactionId) {
        if (!idempotencyKey) return;

        const compositeKey = `${userId}:${transactionType}:${idempotencyKey}`;
        const expiresAt = new Date(Date.now() + this.IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);

        await connection.execute(
            `INSERT INTO idempotency_keys (composite_key, user_id, transaction_type, transaction_id, status, expires_at)
             VALUES (?, ?, ?, ?, 'PROCESSING', ?)
             ON DUPLICATE KEY UPDATE status = 'PROCESSING', transaction_id = ?`,
            [compositeKey, userId, transactionType, transactionId, expiresAt, transactionId]
        );
    }

    /**
     * Update idempotency key with final response
     */
    async updateIdempotencyResponse(connection, userId, transactionType, idempotencyKey, response, status) {
        if (!idempotencyKey) return;

        const compositeKey = `${userId}:${transactionType}:${idempotencyKey}`;

        await connection.execute(
            `UPDATE idempotency_keys 
             SET response = ?, status = ?, updated_at = NOW()
             WHERE composite_key = ?`,
            [JSON.stringify(response), status, compositeKey]
        );
    }

    /**
     * Create audit trail entry with hash chain
     */
    async createAuditEntry(connection, data) {
        const {
            transactionId,
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            ipAddress,
            userAgent,
            metadata
        } = data;

        // Get previous hash for chain
        const [lastEntry] = await connection.execute(
            `SELECT hash FROM audit_trail ORDER BY id DESC LIMIT 1`
        );
        const previousHash = lastEntry.length > 0 ? lastEntry[0].hash : null;

        // Generate new hash
        const auditData = {
            transactionId,
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            timestamp: new Date().toISOString()
        };
        const hash = this.generateAuditHash(previousHash, auditData);

        await connection.execute(
            `INSERT INTO audit_trail 
             (transaction_id, user_id, action, entity_type, entity_id, 
              old_value, new_value, ip_address, user_agent, metadata, previous_hash, hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionId,
                userId,
                action,
                entityType,
                entityId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress,
                userAgent,
                metadata ? JSON.stringify(metadata) : null,
                previousHash,
                hash
            ]
        );

        return hash;
    }

    /**
     * Update transaction state with validation
     */
    async updateTransactionState(connection, transactionId, newState, reason = null) {
        // Get current state with lock
        const [txns] = await connection.execute(
            `SELECT id, status, user_id FROM transactions WHERE id = ? FOR UPDATE`,
            [transactionId]
        );

        if (txns.length === 0) {
            throw new Error(`Transaction ${transactionId} not found`);
        }

        const currentState = txns[0].status;

        // Validate state transition
        if (!this.isValidTransition(currentState, newState)) {
            throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
        }

        // Update state
        const updateFields = {
            status: newState,
            updated_at: new Date()
        };

        if (newState === TransactionState.COMPLETED) {
            updateFields.completed_at = new Date();
        } else if (newState === TransactionState.FAILED) {
            updateFields.failed_at = new Date();
            updateFields.failure_reason = reason;
        }

        const setClause = Object.keys(updateFields)
            .map(k => `${k} = ?`)
            .join(', ');
        const values = [...Object.values(updateFields), transactionId];

        await connection.execute(
            `UPDATE transactions SET ${setClause} WHERE id = ?`,
            values
        );

        // Create audit entry for state change
        await this.createAuditEntry(connection, {
            transactionId,
            userId: txns[0].user_id,
            action: 'STATE_CHANGE',
            entityType: 'transaction',
            entityId: transactionId,
            oldValue: { status: currentState },
            newValue: { status: newState, reason },
            metadata: { timestamp: new Date().toISOString() }
        });

        log.transaction('STATE_CHANGE', transactionId, txns[0].user_id, null, {
            fromState: currentState,
            toState: newState,
            reason
        });

        return { previousState: currentState, newState };
    }

    /**
     * Execute a money transfer with full ACID guarantees
     */
    async executeTransfer(params) {
        const {
            senderId,
            recipientId,
            amount,
            currency,
            description,
            idempotencyKey,
            ipAddress,
            userAgent
        } = params;

        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Check idempotency
            const idempotencyCheck = await this.checkIdempotency(
                connection, senderId, 'TRANSFER', idempotencyKey
            );
            
            if (idempotencyCheck.exists) {
                await connection.rollback();
                connection.release();
                return idempotencyCheck.inProgress 
                    ? { success: false, error: idempotencyCheck.message }
                    : idempotencyCheck.response;
            }

            // Generate transaction reference
            const reference = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Create transaction record
            const [txResult] = await connection.execute(
                `INSERT INTO transactions 
                 (reference, user_id, transaction_type, amount, currency, status, description)
                 VALUES (?, ?, 'TRANSFER', ?, ?, 'PENDING', ?)`,
                [reference, senderId, amount, currency, description]
            );
            const transactionId = txResult.insertId;

            // Store idempotency key
            await this.storeIdempotencyKey(connection, senderId, 'TRANSFER', idempotencyKey, transactionId);

            // Lock sender wallet
            const [senderWallets] = await connection.execute(
                `SELECT id, balance, locked_balance, daily_spent, daily_limit 
                 FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
                [senderId, currency]
            );

            if (senderWallets.length === 0) {
                throw new Error('Sender wallet not found');
            }

            const senderWallet = senderWallets[0];
            const availableBalance = parseFloat(senderWallet.balance) - parseFloat(senderWallet.locked_balance);

            if (availableBalance < amount) {
                throw new Error('Insufficient balance');
            }

            // Check daily limit
            if (parseFloat(senderWallet.daily_spent) + amount > parseFloat(senderWallet.daily_limit)) {
                throw new Error('Daily transaction limit exceeded');
            }

            // Lock recipient wallet
            const [recipientWallets] = await connection.execute(
                `SELECT id, balance FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
                [recipientId, currency]
            );

            if (recipientWallets.length === 0) {
                throw new Error('Recipient wallet not found');
            }

            const recipientWallet = recipientWallets[0];
            const senderBalanceBefore = parseFloat(senderWallet.balance);
            const recipientBalanceBefore = parseFloat(recipientWallet.balance);

            // Debit sender
            await connection.execute(
                `UPDATE wallets SET balance = balance - ?, daily_spent = daily_spent + ? WHERE id = ?`,
                [amount, amount, senderWallet.id]
            );

            // Credit recipient
            await connection.execute(
                `UPDATE wallets SET balance = balance + ? WHERE id = ?`,
                [amount, recipientWallet.id]
            );

            // Create ledger entries (double-entry accounting)
            await connection.execute(
                `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
                 VALUES (?, ?, 'DEBIT', ?, ?, ?)`,
                [transactionId, senderWallet.id, amount, senderBalanceBefore, senderBalanceBefore - amount]
            );

            await connection.execute(
                `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
                 VALUES (?, ?, 'CREDIT', ?, ?, ?)`,
                [transactionId, recipientWallet.id, amount, recipientBalanceBefore, recipientBalanceBefore + amount]
            );

            // Update transaction with balance info
            await connection.execute(
                `UPDATE transactions SET 
                 balance_before = ?, balance_after = ?, 
                 debit_wallet_id = ?, credit_wallet_id = ?,
                 counterparty_user_id = ?
                 WHERE id = ?`,
                [senderBalanceBefore, senderBalanceBefore - amount, 
                 senderWallet.id, recipientWallet.id, recipientId, transactionId]
            );

            // Update state to COMPLETED
            await this.updateTransactionState(connection, transactionId, TransactionState.COMPLETED);

            // Create audit entry
            await this.createAuditEntry(connection, {
                transactionId,
                userId: senderId,
                action: 'TRANSFER_COMPLETED',
                entityType: 'transaction',
                entityId: transactionId,
                oldValue: { senderBalance: senderBalanceBefore, recipientBalance: recipientBalanceBefore },
                newValue: { senderBalance: senderBalanceBefore - amount, recipientBalance: recipientBalanceBefore + amount },
                ipAddress,
                userAgent,
                metadata: { amount, currency, recipientId }
            });

            await connection.commit();

            const response = {
                success: true,
                transaction: {
                    id: transactionId,
                    reference,
                    amount,
                    currency,
                    status: 'COMPLETED',
                    balanceBefore: senderBalanceBefore,
                    balanceAfter: senderBalanceBefore - amount
                }
            };

            // Update idempotency with response
            await this.updateIdempotencyResponse(
                connection, senderId, 'TRANSFER', idempotencyKey, response, 'COMPLETED'
            );

            log.transaction('TRANSFER', transactionId, senderId, amount, {
                reference,
                recipientId,
                currency,
                status: 'COMPLETED'
            });

            return response;

        } catch (error) {
            await connection.rollback();
            
            log.error('Transfer failed', {
                component: 'transactionManager',
                senderId,
                recipientId,
                amount,
                error: error.message
            });

            const errorResponse = {
                success: false,
                error: error.message
            };

            // Update idempotency with error
            if (idempotencyKey) {
                try {
                    await this.updateIdempotencyResponse(
                        connection, senderId, 'TRANSFER', idempotencyKey, errorResponse, 'FAILED'
                    );
                } catch (e) {
                    // Ignore idempotency update errors
                }
            }

            return errorResponse;
        } finally {
            connection.release();
        }
    }

    /**
     * Execute compensating transaction (reversal)
     */
    async executeReversal(transactionId, reason, adminUserId, ipAddress) {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get original transaction with lock
            const [txns] = await connection.execute(
                `SELECT * FROM transactions WHERE id = ? FOR UPDATE`,
                [transactionId]
            );

            if (txns.length === 0) {
                throw new Error('Transaction not found');
            }

            const originalTxn = txns[0];

            if (originalTxn.status !== 'COMPLETED') {
                throw new Error('Only completed transactions can be reversed');
            }

            // Get ledger entries
            const [ledgerEntries] = await connection.execute(
                `SELECT * FROM ledger_entries WHERE transaction_id = ?`,
                [transactionId]
            );

            // Reverse each ledger entry
            for (const entry of ledgerEntries) {
                const reverseType = entry.entry_type === 'DEBIT' ? 'CREDIT' : 'DEBIT';
                const [wallet] = await connection.execute(
                    `SELECT balance FROM wallets WHERE id = ? FOR UPDATE`,
                    [entry.wallet_id]
                );

                const currentBalance = parseFloat(wallet[0].balance);
                const newBalance = reverseType === 'CREDIT' 
                    ? currentBalance + parseFloat(entry.amount)
                    : currentBalance - parseFloat(entry.amount);

                await connection.execute(
                    `UPDATE wallets SET balance = ? WHERE id = ?`,
                    [newBalance, entry.wallet_id]
                );

                // Create reversal ledger entry
                await connection.execute(
                    `INSERT INTO ledger_entries (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [transactionId, entry.wallet_id, reverseType, entry.amount, currentBalance, newBalance]
                );
            }

            // Update transaction state
            await this.updateTransactionState(connection, transactionId, TransactionState.REVERSED, reason);

            // Create audit entry
            await this.createAuditEntry(connection, {
                transactionId,
                userId: adminUserId,
                action: 'TRANSACTION_REVERSED',
                entityType: 'transaction',
                entityId: transactionId,
                oldValue: { status: 'COMPLETED' },
                newValue: { status: 'REVERSED', reason },
                ipAddress,
                metadata: { reversedBy: adminUserId, reason }
            });

            await connection.commit();

            log.transaction('REVERSAL', transactionId, originalTxn.user_id, originalTxn.amount, {
                reason,
                reversedBy: adminUserId
            });

            return { success: true, message: 'Transaction reversed successfully' };

        } catch (error) {
            await connection.rollback();
            log.error('Reversal failed', {
                component: 'transactionManager',
                transactionId,
                error: error.message
            });
            return { success: false, error: error.message };
        } finally {
            connection.release();
        }
    }

    /**
     * Expire stale pending transactions
     */
    async expirePendingTransactions() {
        const connection = await this.pool.getConnection();

        try {
            const [pendingTxns] = await connection.execute(
                `SELECT id FROM transactions 
                 WHERE status = 'PENDING' 
                 AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
                [this.PENDING_TIMEOUT_MINUTES]
            );

            let expiredCount = 0;
            for (const txn of pendingTxns) {
                try {
                    await connection.beginTransaction();
                    await this.updateTransactionState(connection, txn.id, TransactionState.EXPIRED, 'Timeout');
                    await connection.commit();
                    expiredCount++;
                } catch (e) {
                    await connection.rollback();
                    log.warn('Failed to expire transaction', { transactionId: txn.id, error: e.message });
                }
            }

            if (expiredCount > 0) {
                log.info('Expired pending transactions', { count: expiredCount });
            }

            return { expiredCount };
        } finally {
            connection.release();
        }
    }

    /**
     * Get transaction with full audit trail
     */
    async getTransactionWithAudit(transactionId) {
        const [txns] = await this.pool.execute(
            `SELECT t.*, u.phone as user_phone, u.first_name, u.last_name
             FROM transactions t
             JOIN users u ON t.user_id = u.id
             WHERE t.id = ?`,
            [transactionId]
        );

        if (txns.length === 0) {
            return null;
        }

        const [auditTrail] = await this.pool.execute(
            `SELECT * FROM audit_trail WHERE transaction_id = ? ORDER BY created_at ASC`,
            [transactionId]
        );

        const [ledgerEntries] = await this.pool.execute(
            `SELECT le.*, w.currency, w.user_id as wallet_user_id
             FROM ledger_entries le
             JOIN wallets w ON le.wallet_id = w.id
             WHERE le.transaction_id = ?`,
            [transactionId]
        );

        return {
            transaction: txns[0],
            auditTrail,
            ledgerEntries
        };
    }
}

module.exports = {
    TransactionManager,
    TransactionState,
    VALID_TRANSITIONS
};
