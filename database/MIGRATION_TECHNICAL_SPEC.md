
# Database Migration Technical Specification

## 1. Required Libraries

### Primary Dependencies
```go
// Add to go.mod
require (
    github.com/golang-migrate/migrate/v4 v4.17.0
    github.com/mattn/go-sqlite3 v1.14.45 // Already present
)
```

### Import Statements
```go
import (
    "database/sql"
    "embed"
    "fmt"
    "log"
    
    "github.com/golang-migrate/migrate/v4"
    "github.com/golang-migrate/migrate/v4/database/sqlite3"
    "github.com/golang-migrate/migrate/v4/source/iofs"
    _ "github.com/mattn/go-sqlite3"
)
```

## 2. Migration Runner Implementation

### File: `database/migrations.go`

```go
package database

import (
    "database/sql"
    "embed"
    "fmt"
    "log"
    "os"
    "path/filepath"
    "time"

    "github.com/golang-migrate/migrate/v4"
    "github.com/golang-migrate/migrate/v4/database/sqlite3"
    "github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// MigrationManager handles database migrations
type MigrationManager struct {
    db      *sql.DB
    migrate *migrate.Migrate
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(db *sql.DB, dbPath string) (*MigrationManager, error) {
    // Create source driver from embedded filesystem
    sourceDriver, err := iofs.New(migrationFS, "migrations")
    if err != nil {
        return nil, fmt.Errorf("failed to create source driver: %w", err)
    }

    // Create database driver
    driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
    if err != nil {
        return nil, fmt.Errorf("failed to create database driver: %w", err)
    }

    // Create migrate instance
    m, err := migrate.NewWithInstance("iofs", sourceDriver, "sqlite3", driver)
    if err != nil {
        return nil, fmt.Errorf("failed to create migrate instance: %w", err)
    }

    return &MigrationManager{
        db:      db,
        migrate: m,
    }, nil
}

// RunMigrations applies all pending migrations
func (mm *MigrationManager) RunMigrations() error {
    log.Println("Running database migrations...")
    
    // Get current version
    version, dirty, err := mm.migrate.Version()
    if err != nil && err != migrate.ErrNilVersion {
        return fmt.Errorf("failed to get migration version: %w", err)
    }

    if dirty {
        return fmt.Errorf("database is in dirty state at version %d, manual intervention required", version)
    }

    // Run migrations
    if err := mm.migrate.Up(); err != nil {
        if err == migrate.ErrNoChange {
            log.Println("No new migrations to apply")
            return nil
        }
        return fmt.Errorf("migration failed: %w", err)
    }

    // Get new version
    newVersion, _, err := mm.migrate.Version()
    if err != nil {
        return fmt.Errorf("failed to get new version: %w", err)
    }

    log.Printf("Migrations completed successfully. Current version: %d", newVersion)
    return nil
}

// GetVersion returns the current migration version
func (mm *MigrationManager) GetVersion() (uint, bool, error) {
    return mm.migrate.Version()
}

// MigrateTo migrates to a specific version
func (mm *MigrationManager) MigrateTo(version uint) error {
    log.Printf("Migrating to version %d...", version)
    if err := mm.migrate.Migrate(version); err != nil {
        if err == migrate.ErrNoChange {
            log.Println("Already at target version")
            return nil
        }
        return fmt.Errorf("migration to version %d failed: %w", version, err)
    }
    log.Printf("Successfully migrated to version %d", version)
    return nil
}

// Rollback rolls back the last migration
func (mm *MigrationManager) Rollback() error {
    version, dirty, err := mm.migrate.Version()
    if err != nil {
        if err == migrate.ErrNilVersion {
            return fmt.Errorf("no migrations to rollback")
        }
        return fmt.Errorf("failed to get version: %w", err)
    }

    if dirty {
        return fmt.Errorf("database is in dirty state, cannot rollback")
    }

    log.Printf("Rolling back from version %d...", version)
    if err := mm.migrate.Steps(-1); err != nil {
        return fmt.Errorf("rollback failed: %w", err)
    }

    log.Printf("Successfully rolled back from version %d", version)
    return nil
}

// ForceVersion sets the migration version without running migrations
// Use with caution - only for recovery from dirty state
func (mm *MigrationManager) ForceVersion(version int) error {
    log.Printf("WARNING: Forcing version to %d without running migrations", version)
    if err := mm.migrate.Force(version); err != nil {
        return fmt.Errorf("failed to force version: %w", err)
    }
    log.Printf("Version forced to %d", version)
    return nil
}

// Close closes the migration manager
func (mm *MigrationManager) Close() error {
    sourceErr, dbErr := mm.migrate.Close()
    if sourceErr != nil {
        return sourceErr
    }
    return dbErr
}

// Helper function to run migrations on database initialization
func (d *Database) RunMigrations() error {
    // Get database path from connection
    var dbPath string
    rows, err := d.DB.Query("PRAGMA database_list")
    if err != nil {
        return fmt.Errorf("failed to get database path: %w", err)
    }
    defer rows.Close()

    for rows.Next() {
        var seq int
        var name, file string
        if err := rows.Scan(&seq, &name, &file); err != nil {
            return err
        }
        if name == "main" {
            dbPath = file
            break
        }
    }

    // Create migration manager
    mm, err := NewMigrationManager(d.DB, dbPath)
    if err != nil {
        return err
    }
    defer mm.Close()

    // Run migrations
    return mm.RunMigrations()
}
```

## 3. Migration File Examples

### 000001_initial_schema.up.sql
```sql
-- Initial database schema for SmallSteps Trading App
-- Creates all core tables

BEGIN TRANSACTION;

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
