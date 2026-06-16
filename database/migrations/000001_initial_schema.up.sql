-- Initial database schema for SmallSteps Trading App
-- Creates all core tables

-- Trades table: Core trading transactions
CREATE TABLE IF NOT EXISTS trades (
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

-- Daily checklist table
CREATE TABLE IF NOT EXISTS daily_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    market_analysis BOOLEAN DEFAULT 0,
    risk_assessment BOOLEAN DEFAULT 0,
    trading_plan BOOLEAN DEFAULT 0,
    mental_state BOOLEAN DEFAULT 0,
    capital_check BOOLEAN DEFAULT 0,
    news_review BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly checklist table
CREATE TABLE IF NOT EXISTS weekly_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start DATE NOT NULL UNIQUE,
    performance_review BOOLEAN DEFAULT 0,
    strategy_analysis BOOLEAN DEFAULT 0,
    goal_progress BOOLEAN DEFAULT 0,
    learning_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trade entry checklist table
CREATE TABLE IF NOT EXISTS trade_entry_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER,
    setup_confirmed BOOLEAN DEFAULT 0,
    risk_calculated BOOLEAN DEFAULT 0,
    stop_loss_set BOOLEAN DEFAULT 0,
    target_set BOOLEAN DEFAULT 0,
    position_size_ok BOOLEAN DEFAULT 0,
    emotion_check BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trade_id) REFERENCES trades(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'PENDING',
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Task logs table
CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    log_message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline DATE,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Goal contributions table
CREATE TABLE IF NOT EXISTS goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    trade_id INTEGER,
    amount REAL NOT NULL,
    contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
);

-- Trading logs table
CREATE TABLE IF NOT EXISTS trading_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_type TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trading settings table
CREATE TABLE IF NOT EXISTS trading_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    max_trades_per_day INTEGER DEFAULT 5,
    max_loss_per_day REAL DEFAULT 5000,
    max_loss_per_trade REAL DEFAULT 1000,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Capital transactions table
CREATE TABLE IF NOT EXISTS capital_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_type TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_after REAL NOT NULL,
    notes TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_type TEXT NOT NULL,
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    item_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(checklist_type, item_key)
);

-- Broker config table
CREATE TABLE IF NOT EXISTS broker_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    broker_name TEXT NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry DATETIME,
    is_active BOOLEAN DEFAULT 0,
    auto_sync_trades BOOLEAN DEFAULT 0,
    auto_sync_positions BOOLEAN DEFAULT 0,
    sync_interval INTEGER DEFAULT 300,
    last_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Synced trades table
CREATE TABLE IF NOT EXISTS synced_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    broker_id INTEGER NOT NULL,
    broker_trade_id TEXT UNIQUE NOT NULL,
    local_trade_id INTEGER,
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    trade_date DATETIME NOT NULL,
    sync_status TEXT DEFAULT 'SYNCED',
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES broker_config(id),
    FOREIGN KEY (local_trade_id) REFERENCES trades(id)
);

-- Insert default settings
INSERT OR IGNORE INTO trading_settings (id, max_trades_per_day, max_loss_per_day, max_loss_per_trade)
VALUES (1, 5, 5000, 1000);

-- Made with Bob
