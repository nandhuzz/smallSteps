-- Remove trade_id from goal_contributions table
-- trade_id is not required, only amount is needed for contributions

-- Create new table without trade_id
CREATE TABLE IF NOT EXISTS goal_contributions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id)
);

-- Copy existing data (excluding trade_id)
INSERT INTO goal_contributions_new (id, goal_id, amount, contribution_date)
SELECT id, goal_id, amount, contribution_date FROM goal_contributions;

-- Drop old table
DROP TABLE goal_contributions;

-- Rename new table to original name
ALTER TABLE goal_contributions_new RENAME TO goal_contributions;

-- Made with Bob
