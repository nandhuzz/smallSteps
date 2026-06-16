-- Rollback: Add trade_id back to goal_contributions table

-- Create new table with trade_id
CREATE TABLE IF NOT EXISTS goal_contributions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    trade_id INTEGER,
    amount REAL NOT NULL,
    contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
);

-- Copy existing data
INSERT INTO goal_contributions_new (id, goal_id, amount, contribution_date)
SELECT id, goal_id, amount, contribution_date FROM goal_contributions;

-- Drop old table
DROP TABLE goal_contributions;

-- Rename new table to original name
ALTER TABLE goal_contributions_new RENAME TO goal_contributions;

-- Made with Bob
