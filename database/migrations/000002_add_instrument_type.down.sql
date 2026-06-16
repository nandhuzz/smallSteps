-- Rollback: Remove instrument_type column from trades table
-- Note: SQLite has limited ALTER TABLE support, so we need to recreate the table

-- Create temporary table without instrument_type column
CREATE TABLE trades_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME NOT NULL,
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    profit_loss REAL,
    brokerage REAL DEFAULT 0,
    other_charges REAL DEFAULT 0,
    status TEXT DEFAULT 'OPEN',
    notes TEXT,
    emotion_before TEXT,
    emotion_after TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from original table
INSERT INTO trades_backup SELECT id, date, symbol, trade_type, quantity, entry_price, exit_price, profit_loss, brokerage, other_charges, status, notes, emotion_before, emotion_after, created_at FROM trades;

-- Drop original table
DROP TABLE trades;

-- Rename backup table to original name
ALTER TABLE trades_backup RENAME TO trades;

-- Made with Bob
