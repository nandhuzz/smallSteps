package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	DB *sql.DB
}

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
	if err := database.createTables(); err != nil {
		return nil, err
	}

	return database, nil
}

func (d *Database) createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS trades (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date DATETIME NOT NULL,
		symbol TEXT NOT NULL,
		trade_type TEXT NOT NULL, -- BUY or SELL
		instrument_type TEXT DEFAULT 'EQUITY', -- EQUITY or OPTIONS
		option_type TEXT, -- CALL or PUT (for options)
		strike_price REAL, -- Strike price for options
		expiry_date DATE, -- Expiry date for options
		quantity INTEGER NOT NULL,
		entry_price REAL NOT NULL,
		exit_price REAL,
		profit_loss REAL,
		brokerage REAL DEFAULT 0,
		other_charges REAL DEFAULT 0,
		status TEXT DEFAULT 'OPEN', -- OPEN or CLOSED
		notes TEXT,
		emotion_before TEXT,
		emotion_after TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

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

	CREATE TABLE IF NOT EXISTS weekly_checklist (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		week_start DATE NOT NULL UNIQUE,
		performance_review BOOLEAN DEFAULT 0,
		strategy_analysis BOOLEAN DEFAULT 0,
		goal_progress BOOLEAN DEFAULT 0,
		learning_notes TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

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

	CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
		status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
		due_date DATE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		completed_at DATETIME
	);

	CREATE TABLE IF NOT EXISTS goals (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		target_amount REAL NOT NULL,
		current_amount REAL DEFAULT 0,
		deadline DATE,
		status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS goal_contributions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		goal_id INTEGER NOT NULL,
		trade_id INTEGER,
		amount REAL NOT NULL,
		contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (goal_id) REFERENCES goals(id),
		FOREIGN KEY (trade_id) REFERENCES trades(id)
	);

	CREATE TABLE IF NOT EXISTS trading_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		log_type TEXT NOT NULL, -- INFO, WARNING, ERROR, TRADE
		message TEXT NOT NULL,
		details TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS trading_settings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		max_trades_per_day INTEGER DEFAULT 5,
		max_loss_per_day REAL DEFAULT 5000,
		max_loss_per_trade REAL DEFAULT 1000,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS broker_config (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		broker_name TEXT NOT NULL, -- UPSTOX, ZERODHA, etc.
		api_key TEXT,
		api_secret TEXT,
		access_token TEXT,
		refresh_token TEXT,
		token_expiry DATETIME,
		is_active BOOLEAN DEFAULT 0,
		auto_sync_trades BOOLEAN DEFAULT 0,
		auto_sync_positions BOOLEAN DEFAULT 0,
		sync_interval INTEGER DEFAULT 300, -- seconds
		last_sync DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

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
		sync_status TEXT DEFAULT 'SYNCED', -- SYNCED, PENDING, ERROR
		raw_data TEXT, -- JSON data from broker
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (broker_id) REFERENCES broker_config(id),
		FOREIGN KEY (local_trade_id) REFERENCES trades(id)
	);

	-- Insert default settings if not exists
	INSERT OR IGNORE INTO trading_settings (id, max_trades_per_day, max_loss_per_day, max_loss_per_trade)
	VALUES (1, 5, 5000, 1000);
	`

	_, err := d.DB.Exec(schema)
	if err != nil {
		return err
	}

	// Run migrations to add missing columns to existing tables
	return d.runMigrations()
}

// runMigrations adds missing columns to existing tables
func (d *Database) runMigrations() error {
	// Check if instrument_type column exists in trades table
	var columnExists int
	err := d.DB.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('trades')
		WHERE name='instrument_type'
	`).Scan(&columnExists)
	
	if err != nil {
		return err
	}

	// Add instrument_type column if it doesn't exist
	if columnExists == 0 {
		_, err = d.DB.Exec(`
			ALTER TABLE trades ADD COLUMN instrument_type TEXT DEFAULT 'EQUITY'
		`)
		if err != nil {
			return err
		}
		log.Println("Migration: Added instrument_type column to trades table")
	}

	// Check if option_type column exists
	err = d.DB.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('trades')
		WHERE name='option_type'
	`).Scan(&columnExists)
	
	if err != nil {
		return err
	}

	if columnExists == 0 {
		_, err = d.DB.Exec(`
			ALTER TABLE trades ADD COLUMN option_type TEXT
		`)
		if err != nil {
			return err
		}
		log.Println("Migration: Added option_type column to trades table")
	}

	// Check if strike_price column exists
	err = d.DB.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('trades')
		WHERE name='strike_price'
	`).Scan(&columnExists)
	
	if err != nil {
		return err
	}

	if columnExists == 0 {
		_, err = d.DB.Exec(`
			ALTER TABLE trades ADD COLUMN strike_price REAL
		`)
		if err != nil {
			return err
		}
		log.Println("Migration: Added strike_price column to trades table")
	}

	// Check if expiry_date column exists
	err = d.DB.QueryRow(`
		SELECT COUNT(*) FROM pragma_table_info('trades')
		WHERE name='expiry_date'
	`).Scan(&columnExists)
	
	if err != nil {
		return err
	}

	if columnExists == 0 {
		_, err = d.DB.Exec(`
			ALTER TABLE trades ADD COLUMN expiry_date DATE
		`)
		if err != nil {
			return err
		}
		log.Println("Migration: Added expiry_date column to trades table")
	}

	return nil
}

// Trade represents a trading transaction
type Trade struct {
	ID             int       `json:"id"`
	Date           time.Time `json:"date"`
	Symbol         string    `json:"symbol"`
	TradeType      string    `json:"trade_type"`
	InstrumentType *string   `json:"instrument_type"`
	OptionType     *string   `json:"option_type"`
	StrikePrice    *float64  `json:"strike_price"`
	ExpiryDate     *string   `json:"expiry_date"`
	Quantity       int       `json:"quantity"`
	EntryPrice     float64   `json:"entry_price"`
	ExitPrice      *float64  `json:"exit_price"`
	ProfitLoss     *float64  `json:"profit_loss"`
	Brokerage      float64   `json:"brokerage"`
	OtherCharges   float64   `json:"other_charges"`
	Status         string    `json:"status"`
	Notes          string    `json:"notes"`
	EmotionBefore  string    `json:"emotion_before"`
	EmotionAfter   string    `json:"emotion_after"`
	CreatedAt      time.Time `json:"created_at"`
}

// DailyChecklist represents daily trading checklist
type DailyChecklist struct {
	ID              int       `json:"id"`
	Date            string    `json:"date"`
	MarketAnalysis  bool      `json:"market_analysis"`
	RiskAssessment  bool      `json:"risk_assessment"`
	TradingPlan     bool      `json:"trading_plan"`
	MentalState     bool      `json:"mental_state"`
	CapitalCheck    bool      `json:"capital_check"`
	NewsReview      bool      `json:"news_review"`
	CreatedAt       time.Time `json:"created_at"`
}

// WeeklyChecklist represents weekly review checklist
type WeeklyChecklist struct {
	ID                int       `json:"id"`
	WeekStart         string    `json:"week_start"`
	PerformanceReview bool      `json:"performance_review"`
	StrategyAnalysis  bool      `json:"strategy_analysis"`
	GoalProgress      bool      `json:"goal_progress"`
	LearningNotes     string    `json:"learning_notes"`
	CreatedAt         time.Time `json:"created_at"`
}

// Task represents a small task
type Task struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	DueDate     *string   `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`
}

// Goal represents a financial goal
type Goal struct {
	ID            int       `json:"id"`
	Title         string    `json:"title"`
	TargetAmount  float64   `json:"target_amount"`
	CurrentAmount float64   `json:"current_amount"`
	Deadline      *string   `json:"deadline"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

// TradingSettings represents trading limits and settings
type TradingSettings struct {
	ID               int       `json:"id"`
	MaxTradesPerDay  int       `json:"max_trades_per_day"`
	MaxLossPerDay    float64   `json:"max_loss_per_day"`
	MaxLossPerTrade  float64   `json:"max_loss_per_trade"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// BrokerConfig represents broker API configuration
type BrokerConfig struct {
	ID                 int        `json:"id"`
	BrokerName         string     `json:"broker_name"`
	APIKey             string     `json:"api_key"`
	APISecret          string     `json:"api_secret"`
	AccessToken        string     `json:"access_token"`
	RefreshToken       string     `json:"refresh_token"`
	TokenExpiry        *time.Time `json:"token_expiry"`
	IsActive           bool       `json:"is_active"`
	AutoSyncTrades     bool       `json:"auto_sync_trades"`
	AutoSyncPositions  bool       `json:"auto_sync_positions"`
	SyncInterval       int        `json:"sync_interval"`
	LastSync           *time.Time `json:"last_sync"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// SyncedTrade represents a trade synced from broker
type SyncedTrade struct {
	ID             int        `json:"id"`
	BrokerID       int        `json:"broker_id"`
	BrokerTradeID  string     `json:"broker_trade_id"`
	LocalTradeID   *int       `json:"local_trade_id"`
	Symbol         string     `json:"symbol"`
	TradeType      string     `json:"trade_type"`
	Quantity       int        `json:"quantity"`
	Price          float64    `json:"price"`
	TradeDate      time.Time  `json:"trade_date"`
	SyncStatus     string     `json:"sync_status"`
	RawData        string     `json:"raw_data"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (d *Database) Close() error {
	return d.DB.Close()
}

func (d *Database) LogMessage(logType, message, details string) error {
	query := `INSERT INTO trading_logs (log_type, message, details) VALUES (?, ?, ?)`
	_, err := d.DB.Exec(query, logType, message, details)
	if err != nil {
		log.Printf("Failed to log message: %v", err)
	}
	return err
}

// Made with Bob
