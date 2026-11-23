/**
 * Audit Logger - Tracks all important system events
 */
class AuditLogger {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Log a general audit event
     */
    async log(data) {
        const {
            user_id,
            action,
            entity_type,
            entity_id,
            old_value,
            new_value,
            ip_address,
            user_agent,
            metadata
        } = data;

        try {
            await this.pool.query(
                `INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id || null,
                    action,
                    entity_type || null,
                    entity_id || null,
                    old_value ? JSON.stringify(old_value) : null,
                    new_value ? JSON.stringify(new_value) : null,
                    ip_address || null,
                    user_agent || null,
                    metadata ? JSON.stringify(metadata) : null
                ]
            );
        } catch (error) {
            console.error('Audit log error:', error.message);
            // Don't throw - audit logging should not break the app
        }
    }

    /**
     * Log authentication events
     */
    async logAuth(userId, action, success, details = {}) {
        await this.log({
            user_id: userId,
            action: action,
            entity_type: 'auth',
            entity_id: userId,
            metadata: {
                success,
                ...details,
                timestamp: new Date().toISOString()
            },
            ip_address: details.ip_address
        });
    }

    /**
     * Log transaction events
     */
    async logTransaction(userId, transactionId, action, details = {}) {
        await this.log({
            user_id: userId,
            action: action,
            entity_type: 'transaction',
            entity_id: transactionId,
            metadata: {
                ...details,
                timestamp: new Date().toISOString()
            },
            ip_address: details.ip_address
        });
    }

    /**
     * Log wallet events
     */
    async logWallet(userId, walletId, action, oldBalance, newBalance, details = {}) {
        await this.log({
            user_id: userId,
            action: action,
            entity_type: 'wallet',
            entity_id: walletId,
            old_value: { balance: oldBalance },
            new_value: { balance: newBalance },
            metadata: {
                ...details,
                timestamp: new Date().toISOString()
            },
            ip_address: details.ip_address
        });
    }

    /**
     * Log security events
     */
    async logSecurity(userId, action, details = {}) {
        await this.log({
            user_id: userId,
            action: `SECURITY_${action}`,
            entity_type: 'security',
            entity_id: userId,
            metadata: {
                severity: details.severity || 'medium',
                ...details,
                timestamp: new Date().toISOString()
            },
            ip_address: details.ip_address
        });
    }
}

/**
 * Create audit logger middleware
 */
const createAuditLogger = (pool) => {
    return new AuditLogger(pool);
};

module.exports = {
    AuditLogger,
    createAuditLogger
};
