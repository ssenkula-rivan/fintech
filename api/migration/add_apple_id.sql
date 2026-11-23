-- Add apple_id column to users table for Apple Sign In
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) NULL AFTER google_id;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_apple_id (apple_id);
