package database

import (
	"testing"
	"time"
)

func setupTestDB(t *testing.T) *Database {
	// Create temporary directory for test database
	// tmpDir := t.TempDir()
	// dbPath := filepath.Join(tmpDir, "test_trading.db")

	// Override the database path for testing
	db, err := NewDatabase()
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	return db
}

func TestNewDatabase(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	if db.DB == nil {
		t.Error("Database connection is nil")
	}
}

func TestCreateTrade(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	trade := &Trade{
		Date:          time.Now(),
		Symbol:        "RELIANCE",
		TradeType:     "BUY",
		Quantity:      10,
		EntryPrice:    2500.50,
		Brokerage:     20.0,
		OtherCharges:  5.0,
		Notes:         "Test trade",
		EmotionBefore: "Confident",
	}

	err := db.CreateTrade(trade)
	if err != nil {
		t.Errorf("Failed to create trade: %v", err)
	}

	if trade.ID == 0 {
		t.Error("Trade ID should be set after creation")
	}
}

func TestGetTrades(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create test trades
	for i := 0; i < 3; i++ {
		trade := &Trade{
			Date:         time.Now(),
			Symbol:       "RELIANCE",
			TradeType:    "BUY",
			Quantity:     10,
			EntryPrice:   2500.50,
			Brokerage:    20.0,
			OtherCharges: 5.0,
		}
		db.CreateTrade(trade)
	}

	trades, err := db.GetTrades(10)
	if err != nil {
		t.Errorf("Failed to get trades: %v", err)
	}

	if len(trades) != 3 {
		t.Errorf("Expected 3 trades, got %d", len(trades))
	}
}

func TestCloseTrade(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create a trade
	trade := &Trade{
		Date:         time.Now(),
		Symbol:       "RELIANCE",
		TradeType:    "BUY",
		Quantity:     10,
		EntryPrice:   2500.00,
		Brokerage:    20.0,
		OtherCharges: 5.0,
	}
	db.CreateTrade(trade)

	// Close the trade
	exitPrice := 2600.00
	err := db.CloseTrade(trade.ID, exitPrice, "Happy")
	if err != nil {
		t.Errorf("Failed to close trade: %v", err)
	}

	// Verify trade is closed
	trades, _ := db.GetTrades(1)
	if len(trades) == 0 {
		t.Fatal("Trade not found")
	}

	closedTrade := trades[0]
	if closedTrade.Status != "CLOSED" {
		t.Errorf("Expected status CLOSED, got %s", closedTrade.Status)
	}

	if closedTrade.ExitPrice == nil {
		t.Error("Exit price should be set")
	}

	if closedTrade.ProfitLoss == nil {
		t.Error("Profit/Loss should be calculated")
	}

	// Expected P&L: (2600 - 2500) * 10 - 25 = 975
	expectedPL := 975.0
	if *closedTrade.ProfitLoss != expectedPL {
		t.Errorf("Expected P&L %.2f, got %.2f", expectedPL, *closedTrade.ProfitLoss)
	}
}

func TestDeleteTrade(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create a trade
	trade := &Trade{
		Date:       time.Now(),
		Symbol:     "RELIANCE",
		TradeType:  "BUY",
		Quantity:   10,
		EntryPrice: 2500.00,
	}
	db.CreateTrade(trade)

	// Delete the trade
	err := db.DeleteTrade(trade.ID)
	if err != nil {
		t.Errorf("Failed to delete trade: %v", err)
	}

	// Verify trade is deleted
	trades, _ := db.GetTrades(10)
	if len(trades) != 0 {
		t.Errorf("Expected 0 trades after deletion, got %d", len(trades))
	}
}

func TestCreateTask(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	task := &Task{
		Title:       "Review trading strategy",
		Description: "Analyze last week's performance",
		Priority:    "HIGH",
	}

	err := db.CreateTask(task)
	if err != nil {
		t.Errorf("Failed to create task: %v", err)
	}

	if task.ID == 0 {
		t.Error("Task ID should be set after creation")
	}
}

func TestGetTasks(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create test tasks
	for i := 0; i < 2; i++ {
		task := &Task{
			Title:    "Test task",
			Priority: "MEDIUM",
		}
		db.CreateTask(task)
	}

	tasks, err := db.GetTasks()
	if err != nil {
		t.Errorf("Failed to get tasks: %v", err)
	}

	if len(tasks) != 2 {
		t.Errorf("Expected 2 tasks, got %d", len(tasks))
	}
}

func TestUpdateTaskStatus(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create a task
	task := &Task{
		Title:    "Test task",
		Priority: "MEDIUM",
	}
	db.CreateTask(task)

	// Update status
	err := db.UpdateTaskStatus(task.ID, "COMPLETED")
	if err != nil {
		t.Errorf("Failed to update task status: %v", err)
	}

	// Note: GetTasks only returns non-completed tasks
	tasks, _ := db.GetTasks()
	if len(tasks) != 0 {
		t.Errorf("Expected 0 pending tasks, got %d", len(tasks))
	}
}

func TestCreateGoal(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	goal := &Goal{
		Title:        "Save for vacation",
		TargetAmount: 50000.00,
	}

	err := db.CreateGoal(goal)
	if err != nil {
		t.Errorf("Failed to create goal: %v", err)
	}

	if goal.ID == 0 {
		t.Error("Goal ID should be set after creation")
	}
}

func TestGetGoals(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create test goals
	for i := 0; i < 2; i++ {
		goal := &Goal{
			Title:        "Test goal",
			TargetAmount: 10000.00,
		}
		db.CreateGoal(goal)
	}

	goals, err := db.GetGoals()
	if err != nil {
		t.Errorf("Failed to get goals: %v", err)
	}

	if len(goals) != 2 {
		t.Errorf("Expected 2 goals, got %d", len(goals))
	}
}

func TestGetTradingSettings(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	settings, err := db.GetTradingSettings()
	if err != nil {
		t.Errorf("Failed to get trading settings: %v", err)
	}

	if settings.MaxTradesPerDay != 5 {
		t.Errorf("Expected default max trades per day 5, got %d", settings.MaxTradesPerDay)
	}
}

func TestUpdateTradingSettings(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	settings := &TradingSettings{
		MaxTradesPerDay: 10,
		MaxLossPerDay:   10000.00,
		MaxLossPerTrade: 2000.00,
	}

	err := db.UpdateTradingSettings(settings)
	if err != nil {
		t.Errorf("Failed to update trading settings: %v", err)
	}

	// Verify update
	updatedSettings, _ := db.GetTradingSettings()
	if updatedSettings.MaxTradesPerDay != 10 {
		t.Errorf("Expected max trades per day 10, got %d", updatedSettings.MaxTradesPerDay)
	}
}

func TestCheckOvertrading(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Set low limits
	settings := &TradingSettings{
		MaxTradesPerDay: 2,
		MaxLossPerDay:   1000.00,
		MaxLossPerTrade: 500.00,
	}
	db.UpdateTradingSettings(settings)

	// Create trades exceeding limit
	for i := 0; i < 3; i++ {
		trade := &Trade{
			Date:       time.Now(),
			Symbol:     "RELIANCE",
			TradeType:  "BUY",
			Quantity:   10,
			EntryPrice: 2500.00,
		}
		db.CreateTrade(trade)
	}

	isOvertrading, message, err := db.CheckOvertrading()
	if err != nil {
		t.Errorf("Failed to check overtrading: %v", err)
	}

	if !isOvertrading {
		t.Error("Expected overtrading to be detected")
	}

	if message == "" {
		t.Error("Expected overtrading message")
	}
}

func TestCapitalTransactions(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Add deposit
	deposit, err := db.AddCapitalTransaction("DEPOSIT", 10000.00, "Initial deposit")
	if err != nil {
		t.Errorf("Failed to add deposit: %v", err)
	}

	if deposit.BalanceAfter != 10000.00 {
		t.Errorf("Expected balance 10000, got %.2f", deposit.BalanceAfter)
	}

	// Add withdrawal
	withdrawal, err := db.AddCapitalTransaction("WITHDRAWAL", 2000.00, "Withdrawal")
	if err != nil {
		t.Errorf("Failed to add withdrawal: %v", err)
	}

	if withdrawal.BalanceAfter != 8000.00 {
		t.Errorf("Expected balance 8000, got %.2f", withdrawal.BalanceAfter)
	}

	// Get current balance
	balance, err := db.GetCurrentCapitalBalance()
	if err != nil {
		t.Errorf("Failed to get balance: %v", err)
	}

	if balance != 8000.00 {
		t.Errorf("Expected balance 8000, got %.2f", balance)
	}
}

func TestDailyChecklist(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	today := time.Now().Format("2006-01-02")

	// Get or create checklist
	checklist, err := db.GetOrCreateDailyChecklist(today)
	if err != nil {
		t.Errorf("Failed to get/create daily checklist: %v", err)
	}

	if checklist.ID == 0 {
		t.Error("Checklist ID should be set")
	}

	// Update checklist
	checklist.MarketAnalysis = true
	checklist.RiskAssessment = true
	err = db.UpdateDailyChecklist(checklist)
	if err != nil {
		t.Errorf("Failed to update daily checklist: %v", err)
	}

	// Verify update
	updated, _ := db.GetOrCreateDailyChecklist(today)
	if !updated.MarketAnalysis {
		t.Error("Market analysis should be true")
	}
}

func TestWeeklyChecklist(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday())).Format("2006-01-02")

	// Get or create checklist
	checklist, err := db.GetOrCreateWeeklyChecklist(weekStart)
	if err != nil {
		t.Errorf("Failed to get/create weekly checklist: %v", err)
	}

	if checklist.ID == 0 {
		t.Error("Checklist ID should be set")
	}

	// Update checklist
	checklist.PerformanceReview = true
	checklist.LearningNotes = "Good week"
	err = db.UpdateWeeklyChecklist(checklist)
	if err != nil {
		t.Errorf("Failed to update weekly checklist: %v", err)
	}
}

func TestChecklistItems(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create checklist item
	item := &ChecklistItem{
		ChecklistType:   "DAILY",
		ItemKey:         "test_item",
		ItemLabel:       "Test Item",
		ItemDescription: "Test description",
		DisplayOrder:    1,
	}

	err := db.CreateChecklistItem(item)
	if err != nil {
		t.Errorf("Failed to create checklist item: %v", err)
	}

	// Get items
	items, err := db.GetChecklistItems("DAILY")
	if err != nil {
		t.Errorf("Failed to get checklist items: %v", err)
	}

	// Should have default items + our test item
	if len(items) < 1 {
		t.Error("Expected at least 1 checklist item")
	}
}

// Made with Bob
