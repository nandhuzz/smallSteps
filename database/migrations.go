package database

import (
	"database/sql"
	"embed"
	"fmt"
	"log"

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
	// Note: We use NoTxWrap to prevent the driver from closing our database connection
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{
		NoTxWrap: true,
	})
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
// Note: This only closes the source driver, not the database connection
// The database connection is managed by the caller
func (mm *MigrationManager) Close() error {
	sourceErr, _ := mm.migrate.Close()
	// We ignore dbErr because we don't want to close the database connection
	// The database connection is owned by the Database struct and should be closed by the caller
	return sourceErr
}

// RunMigrations is a helper function to run migrations on database initialization
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

// Made with Bob
