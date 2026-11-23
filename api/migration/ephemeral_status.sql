-- Ephemeral Status Table
-- For admin to send temporary messages/greetings to all users

CREATE TABLE IF NOT EXISTS ephemeral_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  expires_at DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index for quick lookup of active messages
CREATE INDEX idx_ephemeral_active ON ephemeral_status(is_active, expires_at);
