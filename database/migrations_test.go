package database

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

// TestMigrationManager_FreshInstall tests migrations on a fresh database
func TestMigrationManager_FreshInstall(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_fresh.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Run migrations
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Verify migration version
	version, dirty, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}

	if dirty {
		t.Error("Database is in dirty state after fresh migration")
	}

	if version != 5 {
		t.Errorf("Expected version 5, got %d", version)
	}

	// Verify all tables exist
	tables := []string{
		"trades", "daily_checklist", "weekly_checklist", "trade_entry_checklist",
		"tasks", "task_logs", "goals", "goal_contributions", "trading_logs",
		"trading_settings", "capital_transactions", "checklist_items",
		"broker_config", "synced_trades", "schema_migrations",
	}

	for _, table := range tables {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", table).Scan(&count)
		if err != nil {
			t.Errorf("Failed to check table %s: %v", table, err)
		}
		if count != 1 {
			t.Errorf("Table %s does not exist", table)
		}
	}

	// Verify trades table has all columns including migrated ones
	columns := []string{
		"id", "date", "symbol", "trade_type", "instrument_type",
		"option_type", "strike_price", "expiry_date", "quantity",
		"entry_price", "exit_price", "profit_loss", "brokerage",
		"other_charges", "status", "notes", "emotion_before",
		"emotion_after", "created_at",
	}

	for _, col := range columns {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('trades') WHERE name=?", col).Scan(&count)
		if err != nil {
			t.Errorf("Failed to check column %s: %v", col, err)
		}
		if count != 1 {
			t.Errorf("Column %s does not exist in trades table", col)
		}
	}

	// Verify tasks table has progress columns
	taskColumns := []string{"progress", "updated_at"}
	for _, col := range taskColumns {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name=?", col).Scan(&count)
		if err != nil {
			t.Errorf("Failed to check column %s: %v", col, err)
		}
		if count != 1 {
			t.Errorf("Column %s does not exist in tasks table", col)
		}
	}

	// Verify trading_settings has capital protection columns
	settingsColumns := []string{"capital_protection_enabled", "protected_capital", "min_capital_threshold"}
	for _, col := range settingsColumns {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('trading_settings') WHERE name=?", col).Scan(&count)
		if err != nil {
			t.Errorf("Failed to check column %s: %v", col, err)
		}
		if count != 1 {
			t.Errorf("Column %s does not exist in trading_settings table", col)
		}
	}

	// Verify default settings were inserted
	var settingsCount int
	err = db.QueryRow("SELECT COUNT(*) FROM trading_settings").Scan(&settingsCount)
	if err != nil {
		t.Errorf("Failed to check trading_settings: %v", err)
	}
	if settingsCount != 1 {
		t.Errorf("Expected 1 default settings row, got %d", settingsCount)
	}
}

// TestMigrationManager_Rollback tests migration rollback functionality
func TestMigrationManager_Rollback(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_rollback.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Run all migrations
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Verify we're at version 5
	version, _, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}
	if version != 5 {
		t.Fatalf("Expected version 5, got %d", version)
	}

	// Rollback one migration (from 5 to 4)
	if err := mm.Rollback(); err != nil {
		t.Fatalf("Failed to rollback: %v", err)
	}

	// Verify we're at version 4
	version, dirty, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version after rollback: %v", err)
	}
	if dirty {
		t.Error("Database is in dirty state after rollback")
	}
	if version != 4 {
		t.Errorf("Expected version 4 after rollback, got %d", version)
	}

	// Verify progress column was removed from tasks
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='progress'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check progress column: %v", err)
	}
	if count != 0 {
		t.Error("Progress column still exists after rollback")
	}

	// Re-apply migration
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to re-apply migrations: %v", err)
	}

	// Verify we're back at version 5
	version, _, err = mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version after re-apply: %v", err)
	}
	if version != 5 {
		t.Errorf("Expected version 5 after re-apply, got %d", version)
	}

	// Verify progress column exists again
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name='progress'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check progress column: %v", err)
	}
	if count != 1 {
		t.Error("Progress column does not exist after re-apply")
	}
}

// TestMigrationManager_MigrateTo tests migrating to specific version
func TestMigrationManager_MigrateTo(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_migrate_to.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Migrate to version 3
	if err := mm.MigrateTo(3); err != nil {
		t.Fatalf("Failed to migrate to version 3: %v", err)
	}

	// Verify we're at version 3
	version, dirty, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}
	if dirty {
		t.Error("Database is in dirty state")
	}
	if version != 3 {
		t.Errorf("Expected version 3, got %d", version)
	}

	// Verify option fields exist
	optionColumns := []string{"option_type", "strike_price", "expiry_date"}
	for _, col := range optionColumns {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('trades') WHERE name=?", col).Scan(&count)
		if err != nil {
			t.Errorf("Failed to check column %s: %v", col, err)
		}
		if count != 1 {
			t.Errorf("Column %s does not exist at version 3", col)
		}
	}

	// Verify capital protection columns don't exist yet
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('trading_settings') WHERE name='capital_protection_enabled'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check capital_protection_enabled column: %v", err)
	}
	if count != 0 {
		t.Error("capital_protection_enabled column exists at version 3 (should not)")
	}

	// Migrate to version 5
	if err := mm.MigrateTo(5); err != nil {
		t.Fatalf("Failed to migrate to version 5: %v", err)
	}

	// Verify we're at version 5
	version, _, err = mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}
	if version != 5 {
		t.Errorf("Expected version 5, got %d", version)
	}

	// Verify capital protection columns now exist
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('trading_settings') WHERE name='capital_protection_enabled'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check capital_protection_enabled column: %v", err)
	}
	if count != 1 {
		t.Error("capital_protection_enabled column does not exist at version 5")
	}
}

// TestMigrationManager_NoChange tests that running migrations when already up-to-date works
func TestMigrationManager_NoChange(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_no_change.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Run migrations
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Run migrations again (should be no-op)
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations second time: %v", err)
	}

	// Verify still at version 5
	version, dirty, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}
	if dirty {
		t.Error("Database is in dirty state")
	}
	if version != 5 {
		t.Errorf("Expected version 5, got %d", version)
	}
}

// TestDatabase_RunMigrations tests the Database.RunMigrations helper
func TestDatabase_RunMigrations(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_db_migrations.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	database := &Database{DB: db}

	// Run migrations using Database method
	if err := database.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Note: The migration manager closes the database connection
	// So we need to reopen it to verify the results
	db2, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to reopen database: %v", err)
	}
	defer db2.Close()

	// Verify tables exist
	var count int
	err = db2.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='trades'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check trades table: %v", err)
	}
	if count != 1 {
		t.Error("Trades table does not exist")
	}

	// Verify schema_migrations table exists
	err = db2.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='schema_migrations'").Scan(&count)
	if err != nil {
		t.Errorf("Failed to check schema_migrations table: %v", err)
	}
	if count != 1 {
		t.Error("schema_migrations table does not exist")
	}
}

// TestMigrationManager_DataIntegrity tests that data is preserved during migrations
func TestMigrationManager_DataIntegrity(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_data_integrity.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Migrate to version 1 (initial schema)
	if err := mm.MigrateTo(1); err != nil {
		t.Fatalf("Failed to migrate to version 1: %v", err)
	}

	// Insert test data
	_, err = db.Exec(`
		INSERT INTO trades (date, symbol, trade_type, quantity, entry_price, status)
		VALUES (datetime('now'), 'AAPL', 'BUY', 100, 150.50, 'OPEN')
	`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	// Get the trade ID
	var tradeID int
	var symbol string
	var quantity int
	var entryPrice float64
	err = db.QueryRow("SELECT id, symbol, quantity, entry_price FROM trades").Scan(&tradeID, &symbol, &quantity, &entryPrice)
	if err != nil {
		t.Fatalf("Failed to query test data: %v", err)
	}

	// Migrate to version 5
	if err := mm.MigrateTo(5); err != nil {
		t.Fatalf("Failed to migrate to version 5: %v", err)
	}

	// Verify data is still there
	var newSymbol string
	var newQuantity int
	var newEntryPrice float64
	var instrumentType string
	err = db.QueryRow("SELECT symbol, quantity, entry_price, instrument_type FROM trades WHERE id=?", tradeID).Scan(&newSymbol, &newQuantity, &newEntryPrice, &instrumentType)
	if err != nil {
		t.Fatalf("Failed to query data after migration: %v", err)
	}

	if newSymbol != symbol {
		t.Errorf("Symbol changed: expected %s, got %s", symbol, newSymbol)
	}
	if newQuantity != quantity {
		t.Errorf("Quantity changed: expected %d, got %d", quantity, newQuantity)
	}
	if newEntryPrice != entryPrice {
		t.Errorf("Entry price changed: expected %f, got %f", entryPrice, newEntryPrice)
	}
	if instrumentType != "EQUITY" {
		t.Errorf("Default instrument_type not set correctly: expected EQUITY, got %s", instrumentType)
	}
}

// TestMigrationManager_ForceVersion tests forcing version for recovery
func TestMigrationManager_ForceVersion(t *testing.T) {
	// Create temporary database
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_force_version.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create migration manager
	mm, err := NewMigrationManager(db, dbPath)
	if err != nil {
		t.Fatalf("Failed to create migration manager: %v", err)
	}
	defer mm.Close()

	// Run migrations
	if err := mm.RunMigrations(); err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Force version to 3
	if err := mm.ForceVersion(3); err != nil {
		t.Fatalf("Failed to force version: %v", err)
	}

	// Verify version is 3
	version, dirty, err := mm.GetVersion()
	if err != nil {
		t.Fatalf("Failed to get version: %v", err)
	}
	if dirty {
		t.Error("Database should not be dirty after force version")
	}
	if version != 3 {
		t.Errorf("Expected version 3, got %d", version)
	}

	// Note: This is a dangerous operation and should only be used for recovery
	// The actual schema is still at version 5, but the tracking says version 3
}

// Made with Bob
