# Database Migration Plan - SmallSteps Trading App

## Overview
This document outlines the plan to migrate from the current ad-hoc database creation approach to a proper migration system using `golang-migrate/migrate`.

## Current State Analysis

### Problems with Current Approach
1. **No Version Control**: Schema changes are applied directly in [`createTables()`](database/database.go:44) without tracking
2. **Manual Migration Logic**: The [`runMigrations()`](database/database.go:234) function manually checks and adds columns
3. **No Rollback Support**: Cannot revert schema changes if issues occur
4. **Difficult to Track**: Hard to know which migrations have been applied
5. **Team Collaboration Issues**: Multiple developers may create conflicting schema changes
6. **Production Risk**: No safe way to test migrations before applying to production

### Current Database Schema
The application currently has 15 tables:
- `trades` - Core trading transactions
- `daily_checklist` - Daily trading checklist
- `weekly_checklist` - Weekly review checklist
- `trade_entry_checklist` - Pre-trade checklist
- `tasks` - Task management
- `task_logs` - Task activity logs
- `goals` - Financial goals
- `goal_contributions` - Goal progress tracking
- `trading_logs` - Application logs
- `trading_settings` - Trading limits and settings
- `capital_transactions` - Deposits/withdrawals
- `checklist_items` - Dynamic checklist configuration
- `broker_config` - Broker API configuration
- `synced_trades` - Broker-synced trades

## Migration Strategy

### 1. Selected Library: golang-migrate/migrate

**Why golang-migrate/migrate?**
- ✅ Most popular Go migration library (10k+ stars)
- ✅ Supports SQLite and 15+ other databases
- ✅ CLI tool for manual migrations
- ✅ Programmatic API for embedded migrations
- ✅ Up/Down migration support
- ✅ Dirty state detection and recovery
- ✅ Active maintenance and community support

**Installation:**
```bash
# Library
go get -u github.com/golang-migrate/migrate/v4
go get -u github.com/golang-migrate/migrate/v4/database/sqlite3
go get -u github.com/golang-migrate/migrate/v4/source/file

# CLI (optional, for manual operations)
go install -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### 2. Migration File Structure

```
database/
├── database.go           # Main database logic (refactored)
├── migrations.go         # Migration runner implementation
├── services.go          # Database services
├── utils.go             # Utility functions
└── migrations/          # Migration files directory
    ├── 000001_initial_schema.up.sql
    ├── 000001_initial_schema.down.sql
    ├── 000002_add_instrument_type.up.sql
    ├── 000002_add_instrument_type.down.sql
    ├── 000003_add_option_fields.up.sql
    ├── 000003_add_option_fields.down.sql
    ├── 000004_add_capital_protection.up.sql
    ├── 000004_add_capital_protection.down.sql
    ├── 000005_add_task_progress.up.sql
    ├── 000005_add_task_progress.down.sql
    └── README.md        # Migration documentation
```

### 3. Naming Convention

**Format:** `{version}_{description}.{direction}.sql`

- **version**: 6-digit sequential number (000001, 000002, etc.)
- **description**: Snake_case description of the change
- **direction**: `up` (apply) or `down` (rollback)

**Examples:**
- `000001_initial_schema.up.sql` - Creates all initial tables
- `000001_initial_schema.down.sql` - Drops all initial tables
- `000002_add_instrument_type.up.sql` - Adds instrument_type column
- `000002_add_instrument_type.down.sql` - Removes instrument_type column

### 4. Migration Tracking

golang-migrate automatically creates a `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty BOOLEAN NOT NULL
);
```

- **version**: The migration version number
- **dirty**: Indicates if migration failed mid-execution

## Implementation Plan

### Phase 1: Setup Migration Infrastructure

#### Task 1.1: Add Dependencies
```bash
go get -u github.com/golang-migrate/migrate/v4
go get -u github.com/golang-migrate/migrate/v4/database/sqlite3
go get -u github.com/golang-migrate/migrate/v4/source/iofs
```

#### Task 1.2: Create Migration Directory Structure
```
database/migrations/
├── 000001_initial_schema.up.sql
├── 000001_initial_schema.down.sql
└── README.md
```

#### Task 1.3: Implement Migration Runner
Create [`database/migrations.go`](database/migrations.go) with:
- `RunMigrations()` - Apply all pending migrations
- `RollbackMigration()` - Rollback last migration
- `MigrationStatus()` - Check current migration version
- `CreateMigration()` - Helper to generate new migration files

### Phase 2: Convert Existing Schema

#### Task 2.1: Create Initial Schema Migration (000001)
Convert [`createTables()`](database/database.go:44) into `000001_initial_schema.up.sql`:
- All 15 table definitions
- Initial data inserts (trading_settings default)
- Indexes and constraints

Create corresponding `000001_initial_schema.down.sql`:
- DROP TABLE statements in reverse order (respecting foreign keys)

#### Task 2.2: Convert Existing Migrations (000002-000005)
Split [`runMigrations()`](database/database.go:234) into separate migration files:

**000002_add_instrument_type.up.sql:**
```sql
ALTER TABLE trades ADD COLUMN instrument_type TEXT DEFAULT 'EQUITY';
```

**000003_add_option_fields.up.sql:**
```sql
ALTER TABLE trades ADD COLUMN option_type TEXT;
ALTER TABLE trades ADD COLUMN strike_price REAL;
ALTER TABLE trades ADD COLUMN expiry_date DATE;
```

**000004_add_capital_protection.up.sql:**
```sql
ALTER TABLE trading_settings ADD COLUMN capital_protection_enabled BOOLEAN DEFAULT 0;
ALTER TABLE trading_settings ADD COLUMN protected_capital REAL DEFAULT 0;
ALTER TABLE trading_settings ADD COLUMN min_capital_threshold REAL DEFAULT 0;
```

**000005_add_task_progress.up.sql:**
```sql
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE task_logs ADD COLUMN progress_snapshot INTEGER DEFAULT 0;
```

Each migration must have a corresponding `.down.sql` file.

### Phase 3: Refactor Database Initialization

#### Task 3.1: Update NewDatabase()
Modify [`NewDatabase()`](database/database.go:17) to:
1. Open database connection
2. Run migrations automatically
3. Remove calls to `createTables()` and `runMigrations()`

```go
func NewDatabase() (*Database, error) {
    // Get user's home directory
    homeDir, err := os.UserHomeDir()
    if err != nil {
        return nil, err
    }

    // Create app data directory
    appDir := filepath.Join(homeDir, ".smallsteps")
    if err := os.MkdirAll(appDir, 0755); err != nil {
        return nil, err
    }

    dbPath := filepath.Join(appDir, "trading.db")
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        return nil, err
    }

    database := &Database{DB: db}
    
    // Run migrations
    if err := database.RunMigrations(); err != nil {
        return nil, fmt.Errorf("migration failed: %w", err)
    }

    return database, nil
}
```

#### Task 3.2: Remove Old Migration Code
- Delete [`createTables()`](database/database.go:44) function
- Delete [`runMigrations()`](database/database.go:234) function
- Keep struct definitions and service methods

### Phase 4: Add Migration Management

#### Task 4.1: Create Migration CLI Commands
Add commands to manage migrations:
```go
// In migrations.go
func (d *Database) GetMigrationVersion() (uint, bool, error)
func (d *Database) MigrateUp() error
func (d *Database) MigrateDown() error
func (d *Database) MigrateTo(version uint) error
func (d *Database) ForceVersion(version uint) error
```

#### Task 4.2: Create Migration Generator
Helper function to create new migration files:
```go
func GenerateMigration(name string) error {
    timestamp := time.Now().Unix()
    version := fmt.Sprintf("%06d", timestamp)
    
    upFile := fmt.Sprintf("database/migrations/%s_%s.up.sql", version, name)
    downFile := fmt.Sprintf("database/migrations/%s_%s.down.sql", version, name)
    
    // Create template files
    // ...
}
```

### Phase 5: Testing & Validation

#### Task 5.1: Test Fresh Installation
1. Delete existing database
2. Run application
3. Verify all tables created correctly
4. Verify schema_migrations table populated

#### Task 5.2: Test Existing Database Migration
1. Use existing database with old schema
2. Run application
3. Verify migrations applied correctly
4. Verify data integrity maintained

#### Task 5.3: Test Rollback
1. Apply migrations
2. Rollback last migration
3. Verify schema reverted correctly
4. Re-apply migration
5. Verify forward migration works

#### Task 5.4: Test Dirty State Recovery
1. Simulate failed migration
2. Verify dirty flag set
3. Test recovery mechanism
4. Verify clean state restored

### Phase 6: Documentation

#### Task 6.1: Create Migration README
Document in `database/migrations/README.md`:
- How to create new migrations
- Migration naming conventions
- Testing procedures
- Rollback procedures
- Common issues and solutions

#### Task 6.2: Update Main Documentation
Update project documentation:
- Database setup instructions
- Migration workflow
- Development guidelines
- Deployment procedures

## Migration File Templates

### Up Migration Template
```sql
-- Migration: {description}
-- Created: {date}
-- Author: {author}

-- Add your schema changes here
-- Example:
-- ALTER TABLE table_name ADD COLUMN column_name TYPE;
-- CREATE INDEX idx_name ON table_name(column_name);
```

### Down Migration Template
```sql
-- Rollback: {description}
-- Created: {date}

-- Reverse the changes from the up migration
-- Example:
-- DROP INDEX IF EXISTS idx_name;
-- ALTER TABLE table_name DROP COLUMN column_name;
```

## Best Practices

### 1. Migration Guidelines
- ✅ **One logical change per migration** - Keep migrations focused
- ✅ **Always create down migrations** - Enable rollback capability
- ✅ **Test both directions** - Verify up and down work correctly
- ✅ **Use transactions** - Wrap changes in BEGIN/COMMIT
- ✅ **Handle existing data** - Consider data migration needs
- ✅ **Document complex changes** - Add comments explaining why

### 2. SQLite-Specific Considerations
- ⚠️ **Limited ALTER TABLE support** - SQLite doesn't support DROP COLUMN
- ⚠️ **Workaround for column removal**: Create new table, copy data, drop old, rename
- ⚠️ **Foreign key constraints** - Must be enabled explicitly
- ⚠️ **No concurrent writes** - SQLite locks entire database

### 3. Development Workflow
1. Create migration files using generator
2. Write up migration SQL
3. Write corresponding down migration SQL
4. Test migration on development database
5. Test rollback
6. Commit migration files to version control
7. Deploy to production

### 4. Production Deployment
1. **Backup database** before applying migrations
2. **Test migrations** on staging environment first
3. **Monitor migration execution** for errors
4. **Have rollback plan** ready
5. **Verify application** works after migration

## Risk Mitigation

### Backup Strategy
```go
func (d *Database) BackupDatabase() error {
    // Create backup before migrations
    timestamp := time.Now().Format("20060102_150405")
    backupPath := fmt.Sprintf("backup_%s.db", timestamp)
    // Copy database file
}
```

### Migration Validation
```go
func (d *Database) ValidateMigration(version uint) error {
    // Check schema integrity
    // Verify foreign keys
    // Validate data consistency
}
```

### Rollback Procedure
1. Stop application
2. Restore database backup
3. Fix migration issue
4. Test corrected migration
5. Re-deploy

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Setup | 3 tasks | 2-3 hours |
| Phase 2: Convert Schema | 2 tasks | 3-4 hours |
| Phase 3: Refactor Init | 2 tasks | 2-3 hours |
| Phase 4: Management | 2 tasks | 2-3 hours |
| Phase 5: Testing | 4 tasks | 3-4 hours |
| Phase 6: Documentation | 2 tasks | 2-3 hours |
| **Total** | **15 tasks** | **14-20 hours** |

## Success Criteria

- ✅ All existing schema converted to migrations
- ✅ Migration system runs automatically on startup
- ✅ Up and down migrations work correctly
- ✅ Existing databases migrate successfully
- ✅ Fresh installations work correctly
- ✅ Rollback mechanism functional
- ✅ Migration tracking accurate
- ✅ Documentation complete
- ✅ Tests passing
- ✅ No data loss during migration

## Future Enhancements

1. **Migration Linting** - Validate migration files before applying
2. **Dry Run Mode** - Preview changes without applying
3. **Migration Hooks** - Pre/post migration callbacks
4. **Parallel Migrations** - Support for concurrent schema changes
5. **Migration Dashboard** - Web UI for migration management
6. **Automated Backups** - Automatic backup before each migration
7. **Migration Notifications** - Alert on migration success/failure

## References

- [golang-migrate Documentation](https://github.com/golang-migrate/migrate)
- [SQLite ALTER TABLE Limitations](https://www.sqlite.org/lang_altertable.html)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)