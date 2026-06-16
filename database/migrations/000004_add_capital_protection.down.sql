-- Rollback: Remove capital protection settings
-- Note: SQLite has limited ALTER TABLE support, so we need to recreate the table

-- Create temporary table without capital protection columns
CREATE TABLE trading_settings_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    max_trades_per_day INTEGER DEFAULT 5,
    max_loss_per_day REAL DEFAULT 5000,
    max_loss_per_trade REAL DEFAULT 1000,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from original table (excluding capital protection fields)
INSERT INTO trading_settings_backup SELECT id, max_trades_per_day, max_loss_per_day, max_loss_per_trade, updated_at FROM trading_settings;

-- Drop original table
DROP TABLE trading_settings;

-- Rename backup table to original name
ALTER TABLE trading_settings_backup RENAME TO trading_settings;

-- Made with Bob
