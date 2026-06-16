-- Rollback: Initial database schema
-- Drops all tables in reverse order (respecting foreign keys)

-- Drop tables in reverse order to respect foreign key constraints
DROP TABLE IF EXISTS synced_trades;
DROP TABLE IF EXISTS broker_config;
DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS capital_transactions;
DROP TABLE IF EXISTS trading_settings;
DROP TABLE IF EXISTS trading_logs;
DROP TABLE IF EXISTS goal_contributions;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS task_logs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS trade_entry_checklist;
DROP TABLE IF EXISTS weekly_checklist;
DROP TABLE IF EXISTS daily_checklist;
DROP TABLE IF EXISTS trades;

-- Made with Bob
