# Database Migrations

This directory contains database migration files for the SmallSteps Trading App.

## Overview

We use [golang-migrate/migrate](https://github.com/golang-migrate/migrate) for managing database schema changes. Migrations are automatically applied when the application starts.

## Migration Files

Migrations are stored as SQL files with the following naming convention:

```
{version}_{description}.{direction}.sql
```

- **version**: 6-digit sequential number (000001, 000002, etc.)
- **description**: Snake_case description of the change
- **direction**: `up` (apply) or `down` (rollback)

### Current Migrations

1. **000001_initial_schema** - Creates all initial tables (trades, checklists, tasks, goals, etc.)
2. **000002_add_instrument_type** - Adds instrument_type column to trades table
3. **000003_add_option_fields** - Adds option trading fields (option_type, strike_price, expiry_date)
4. **000004_add_capital_protection** - Adds capital protection settings
5. **000005_add_task_progress** - Adds progress tracking to tasks

## How Migrations Work

### Automatic Migration

Migrations run automatically when the application starts via [`NewDatabase()`](../database.go:17). The system:

1. Checks the current migration version in `schema_migrations` table
2. Applies any pending migrations in order
3. Updates the version number after each successful migration
4. Logs migration progress

### Migration Tracking

The `schema_migrations` table tracks which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty BOOLEAN NOT NULL
);
```

- **version**: The migration version number
- **dirty**: Set to true if a migration fails mid-execution

## Creating New Migrations

### Step 1: Create Migration Files

Create two files for each migration (up and down):

```bash
# Example: Adding a new column
database/migrations/000006_add_new_column.up.sql
database/migrations/000006_add_new_column.down.sql
```

### Step 2: Write Up Migration

The `.up.sql` file applies the change:

```sql
-- Migration: Add new column
-- Created: 2024-01-15

BEGIN TRANSACTION;

ALTER TABLE table_name ADD COLUMN new_column TEXT;

COMMIT;
```

### Step 3: Write Down Migration

The `.down.sql` file reverses the change:

```sql
-- Rollback: Remove new column
-- Note: SQLite has limited ALTER TABLE support

BEGIN TRANSACTION;

-- For SQLite, we need to recreate the table without the column
CREATE TABLE table_name_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    existing_column TEXT
    -- ... other columns except new_column
);

INSERT INTO table_name_backup SELECT id, existing_column FROM table_name;
DROP TABLE table_name;
ALTER TABLE table_name_backup RENAME TO table_name;

COMMIT;
```

## SQLite Limitations

SQLite has limited `ALTER TABLE` support:

- ✅ **Can ADD columns** - Use `ALTER TABLE ADD COLUMN`
- ❌ **Cannot DROP columns** - Must recreate table
- ❌ **Cannot MODIFY columns** - Must recreate table
- ❌ **Cannot RENAME columns** - Must recreate table (SQLite 3.25.0+)

### Workaround for Column Removal

To remove a column in SQLite:

1. Create a new table without the column
2. Copy data from the old table
3. Drop the old table
4. Rename the new table

Example in down migrations: [`000002_add_instrument_type.down.sql`](000002_add_instrument_type.down.sql)

## Best Practices

### 1. One Logical Change Per Migration
Keep migrations focused on a single logical change:
- ✅ Good: "Add instrument_type column"
- ❌ Bad: "Add multiple unrelated columns and indexes"

### 2. Always Create Down Migrations
Every `.up.sql` must have a corresponding `.down.sql` for rollback capability.

### 3. Use Transactions
Wrap changes in `BEGIN TRANSACTION` and `COMMIT` to ensure atomicity.

### 4. Test Both Directions
Before committing:
1. Apply the migration (up)
2. Verify the schema change
3. Rollback the migration (down)
4. Verify the schema is restored
5. Re-apply the migration (up)

### 5. Handle Existing Data
Consider how the migration affects existing data:
- Use `DEFAULT` values for new columns
- Migrate data if needed
- Document any data transformations

### 6. Document Complex Changes
Add comments explaining:
- Why the change is needed
- Any data migration logic
- SQLite-specific workarounds

## Testing Migrations

### Test Fresh Installation
```bash
# Delete existing database
rm ~/.smallsteps/trading.db

# Run application
go run main.go

# Verify all tables created correctly
```

### Test Existing Database
```bash
# Use existing database with old schema
# Run application
go run main.go

# Verify migrations applied correctly
# Check data integrity
```

### Test Rollback
```go
// In code or test
mm, _ := NewMigrationManager(db, dbPath)
mm.Rollback() // Rollback last migration
mm.RunMigrations() // Re-apply
```

## Troubleshooting

### Dirty State
If a migration fails mid-execution, the database enters a "dirty" state:

```
Error: database is in dirty state at version X
```

**Recovery:**
1. Manually inspect the database schema
2. Fix any partial changes
3. Force the version to the correct state:
   ```go
   mm.ForceVersion(correctVersion)
   ```

### Migration Fails
If a migration fails:
1. Check the error message
2. Review the SQL syntax
3. Verify SQLite compatibility
4. Test the migration on a copy of the database

### Version Mismatch
If migrations are out of sync:
1. Check `schema_migrations` table
2. Verify all migration files are present
3. Ensure migrations are numbered sequentially

## Manual Migration Management

While migrations run automatically, you can also manage them manually:

```go
// Get current version
version, dirty, err := mm.GetVersion()

// Migrate to specific version
err := mm.MigrateTo(3)

// Rollback last migration
err := mm.Rollback()

// Force version (recovery only)
err := mm.ForceVersion(5)
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] Test migrations on staging database
- [ ] Backup production database
- [ ] Review migration SQL
- [ ] Verify rollback procedure
- [ ] Plan maintenance window if needed

### Deployment Steps
1. **Backup** production database
2. **Deploy** new application version
3. **Monitor** migration execution
4. **Verify** application functionality
5. **Keep backup** for 24-48 hours

### Rollback Plan
If issues occur:
1. Stop the application
2. Restore database backup
3. Revert to previous application version
4. Investigate and fix migration
5. Re-test before re-deploying

## References

- [golang-migrate Documentation](https://github.com/golang-migrate/migrate)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [Migration Plan](../MIGRATION_PLAN.md)
- [Technical Specification](../MIGRATION_TECHNICAL_SPEC.md)