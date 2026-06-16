-- Migration: Add capital protection settings
-- Adds columns for capital protection features to trading_settings table

ALTER TABLE trading_settings ADD COLUMN capital_protection_enabled BOOLEAN DEFAULT 0;
ALTER TABLE trading_settings ADD COLUMN protected_capital REAL DEFAULT 0;
ALTER TABLE trading_settings ADD COLUMN min_capital_threshold REAL DEFAULT 0;

-- Made with Bob
