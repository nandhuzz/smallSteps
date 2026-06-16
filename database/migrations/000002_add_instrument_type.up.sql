-- Migration: Add instrument_type column to trades table
-- Adds support for tracking equity vs options trades

ALTER TABLE trades ADD COLUMN instrument_type TEXT DEFAULT 'EQUITY';

-- Made with Bob
