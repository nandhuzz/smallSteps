-- Migration: Add option trading fields to trades table
-- Adds columns for option type, strike price, and expiry date

ALTER TABLE trades ADD COLUMN option_type TEXT;
ALTER TABLE trades ADD COLUMN strike_price REAL;
ALTER TABLE trades ADD COLUMN expiry_date DATE;

-- Made with Bob
