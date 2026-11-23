# Database Migrations

## Canonical Schema

**USE THIS FILE:** `CANONICAL_SCHEMA.sql`

This is the single source of truth for the GMG Uganda database schema. All column names match the application code exactly.

## How to Apply

```bash
# Development
mysql -u root -p gmg_uganda < api/migration/CANONICAL_SCHEMA.sql

# Docker (fresh install)
docker-compose down -v  # Remove old volumes
docker-compose up -d    # Start with new schema

# Docker (existing database)
docker exec -i gmg_mysql mysql -u root -p gmg_uganda < api/migration/CANONICAL_SCHEMA.sql
```

## Schema Files

| File | Status | Description |
|------|--------|-------------|
| `CANONICAL_SCHEMA.sql` | ✅ ACTIVE | Single source of truth - USE THIS |
| `TRADING_SCHEMA.sql` | ✅ ACTIVE | Trading feature tables (additive) |
| `CRYPTO_WALLET_SCHEMA.sql` | ✅ ACTIVE | Crypto wallet tables (additive) |
| `DEPRECATED_*.sql` | ❌ DEPRECATED | Old schemas - DO NOT USE |

## Migration Order

1. `CANONICAL_SCHEMA.sql` - Core tables (10 tables)
2. `TRADING_SCHEMA.sql` - Trading features (additive)
3. `CRYPTO_WALLET_SCHEMA.sql` - Crypto wallet features (additive)

## Column Name Reference

The canonical schema uses these column names (matching the code):

### users table
- `phone` (not `phone_number`)
- `first_name`, `last_name`
- `pin_hash`
- `role` (ENUM: USER, ADMIN, SUPERADMIN)
- `kyc_tier`, `kyc_status`
- `status`, `login_attempts`

### otp_codes table
- `phone` (not `phone_number`)
- `code` (not `otp_code`)
- `type` (ENUM: LOGIN, TRANSACTION, RESET)
- `attempts`
- `verified` (BOOLEAN)
- `expires_at`

### transactions table
- `reference`, `external_reference`
- `user_id`, `counterparty_user_id`
- `transaction_type` (ENUM: DEPOSIT, WITHDRAWAL, TRANSFER, FEE, REVERSAL)
- `amount`, `currency`, `fee`
- `status` (ENUM: PENDING, PROCESSING, COMPLETED, FAILED, REVERSED, CANCELLED)
