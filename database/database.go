package database

import (
	"database/sql"
	"fmt"
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

	// Run migrations
	if err := database.RunMigrations(); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	// Reopen database connection after migrations
	// (migrations close the connection)
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	database.DB = db

	return database, nil
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
	ID             int       `json:"id"`
	Date           string    `json:"date"`
	MarketAnalysis bool      `json:"market_analysis"`
	RiskAssessment bool      `json:"risk_assessment"`
	TradingPlan    bool      `json:"trading_plan"`
	MentalState    bool      `json:"mental_state"`
	CapitalCheck   bool      `json:"capital_check"`
	NewsReview     bool      `json:"news_review"`
	CreatedAt      time.Time `json:"created_at"`
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
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Priority    string     `json:"priority"`
	Status      string     `json:"status"`
	Progress    int        `json:"progress"`
	DueDate     *string    `json:"due_date"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// TaskLog represents a log entry for a task
type TaskLog struct {
	ID               int       `json:"id"`
	TaskID           int       `json:"task_id"`
	LogMessage       string    `json:"log_message"`
	ProgressSnapshot int       `json:"progress_snapshot"`
	CreatedAt        time.Time `json:"created_at"`
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
	ID                       int       `json:"id"`
	MaxTradesPerDay          int       `json:"max_trades_per_day"`
	MaxLossPerDay            float64   `json:"max_loss_per_day"`
	MaxLossPerTrade          float64   `json:"max_loss_per_trade"`
	CapitalProtectionEnabled bool      `json:"capital_protection_enabled"`
	ProtectedCapital         float64   `json:"protected_capital"`
	MinCapitalThreshold      float64   `json:"min_capital_threshold"`
	UpdatedAt                time.Time `json:"updated_at"`
}

// CapitalTransaction represents a deposit or withdrawal
type CapitalTransaction struct {
	ID              int       `json:"id"`
	TransactionType string    `json:"transaction_type"`
	Amount          float64   `json:"amount"`
	BalanceAfter    float64   `json:"balance_after"`
	Notes           string    `json:"notes"`
	TransactionDate time.Time `json:"transaction_date"`
	CreatedAt       time.Time `json:"created_at"`
}

// ChecklistItem represents a dynamic checklist item
type ChecklistItem struct {
	ID              int       `json:"id"`
	ChecklistType   string    `json:"checklist_type"`
	ItemKey         string    `json:"item_key"`
	ItemLabel       string    `json:"item_label"`
	ItemDescription string    `json:"item_description"`
	DisplayOrder    int       `json:"display_order"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}

// BrokerConfig represents broker API configuration
type BrokerConfig struct {
	ID                int        `json:"id"`
	BrokerName        string     `json:"broker_name"`
	APIKey            string     `json:"api_key"`
	APISecret         string     `json:"api_secret"`
	AccessToken       string     `json:"access_token"`
	RefreshToken      string     `json:"refresh_token"`
	TokenExpiry       *time.Time `json:"token_expiry"`
	IsActive          bool       `json:"is_active"`
	AutoSyncTrades    bool       `json:"auto_sync_trades"`
	AutoSyncPositions bool       `json:"auto_sync_positions"`
	SyncInterval      int        `json:"sync_interval"`
	LastSync          *time.Time `json:"last_sync"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// SyncedTrade represents a trade synced from broker
type SyncedTrade struct {
	ID            int       `json:"id"`
	BrokerID      int       `json:"broker_id"`
	BrokerTradeID string    `json:"broker_trade_id"`
	LocalTradeID  *int      `json:"local_trade_id"`
	Symbol        string    `json:"symbol"`
	TradeType     string    `json:"trade_type"`
	Quantity      int       `json:"quantity"`
	Price         float64   `json:"price"`
	TradeDate     time.Time `json:"trade_date"`
	SyncStatus    string    `json:"sync_status"`
	RawData       string    `json:"raw_data"`
	CreatedAt     time.Time `json:"created_at"`
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
