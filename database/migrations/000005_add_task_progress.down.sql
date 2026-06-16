-- Rollback: Remove task progress tracking
-- Note: SQLite has limited ALTER TABLE support, so we need to recreate the tables

-- Recreate tasks table without progress and updated_at columns
CREATE TABLE tasks_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'PENDING',
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Copy data from original table (excluding progress and updated_at)
INSERT INTO tasks_backup SELECT id, title, description, priority, status, due_date, created_at, completed_at FROM tasks;

-- Drop original table
DROP TABLE tasks;

-- Rename backup table to original name
ALTER TABLE tasks_backup RENAME TO tasks;

-- Recreate task_logs table without progress_snapshot column
CREATE TABLE task_logs_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    log_message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Copy data from original table (excluding progress_snapshot)
INSERT INTO task_logs_backup SELECT id, task_id, log_message, created_at FROM task_logs;

-- Drop original table
DROP TABLE task_logs;

-- Rename backup table to original name
ALTER TABLE task_logs_backup RENAME TO task_logs;

-- Made with Bob
