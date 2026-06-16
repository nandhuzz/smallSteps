-- Migration: Add task progress tracking
-- Adds progress and updated_at columns to tasks table
-- Adds progress_snapshot column to task_logs table

ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE task_logs ADD COLUMN progress_snapshot INTEGER DEFAULT 0;

-- Made with Bob
