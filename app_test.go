package main

import (
	"context"
	"testing"
	"time"
)

func setupTestApp(t *testing.T) *App {
	app := NewApp()
	app.startup(context.Background())
	return app
}

func TestNewApp(t *testing.T) {
	app := NewApp()
	if app == nil {
		t.Error("NewApp should return a non-nil App instance")
	}
}

func TestAppStartup(t *testing.T) {
	app := NewApp()
	ctx := context.Background()
	
	app.startup(ctx)
	
	if app.ctx == nil {
		t.Error("Context should be set after startup")
	}
	
	if app.db == nil {
		t.Error("Database should be initialized after startup")
	}
}

func TestCreateTrade(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	id, err := app.CreateTrade(
		"RELIANCE",
		"BUY",
		10,
		2500.50,
		20.0,
		5.0,
		"Test trade",
		"Confident",
		"EQUITY",
		"",
		0,
		"",
	)
	
	if err != nil {
		t.Errorf("Failed to create trade: %v", err)
	}
	
	if id == 0 {
		t.Error("Trade ID should be non-zero")
	}
}

func TestGetTrades(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a test trade
	app.CreateTrade("RELIANCE", "BUY", 10, 2500.50, 20.0, 5.0, "Test", "Confident", "EQUITY", "", 0, "")
	
	trades, err := app.GetTrades(10)
	if err != nil {
		t.Errorf("Failed to get trades: %v", err)
	}
	
	if len(trades) == 0 {
		t.Error("Expected at least one trade")
	}
}

func TestCloseTrade(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a trade
	id, _ := app.CreateTrade("RELIANCE", "BUY", 10, 2500.00, 20.0, 5.0, "Test", "Confident", "EQUITY", "", 0, "")
	
	// Close the trade
	err := app.CloseTrade(id, 2600.00, "Happy")
	if err != nil {
		t.Errorf("Failed to close trade: %v", err)
	}
	
	// Verify trade is closed
	trades, _ := app.GetTrades(1)
	if len(trades) > 0 && trades[0].Status != "CLOSED" {
		t.Error("Trade should be closed")
	}
}

func TestDeleteTrade(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a trade
	id, _ := app.CreateTrade("RELIANCE", "BUY", 10, 2500.00, 20.0, 5.0, "Test", "Confident", "EQUITY", "", 0, "")
	
	// Delete the trade
	err := app.DeleteTrade(id)
	if err != nil {
		t.Errorf("Failed to delete trade: %v", err)
	}
}

func TestGetTodayChecklist(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	checklist, err := app.GetTodayChecklist()
	if err != nil {
		t.Errorf("Failed to get today's checklist: %v", err)
	}
	
	if checklist == nil {
		t.Error("Checklist should not be nil")
	}
	
	if checklist.Date != time.Now().Format("2006-01-02") {
		t.Error("Checklist date should be today")
	}
}

func TestUpdateDailyChecklist(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	checklist, _ := app.GetTodayChecklist()
	
	err := app.UpdateDailyChecklist(
		checklist.ID,
		true,
		true,
		true,
		true,
		true,
		true,
	)
	
	if err != nil {
		t.Errorf("Failed to update daily checklist: %v", err)
	}
}

func TestGetThisWeekChecklist(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	checklist, err := app.GetThisWeekChecklist()
	if err != nil {
		t.Errorf("Failed to get this week's checklist: %v", err)
	}
	
	if checklist == nil {
		t.Error("Checklist should not be nil")
	}
}

func TestCreateTask(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	err := app.CreateTask("Test task", "Description", "HIGH", nil)
	if err != nil {
		t.Errorf("Failed to create task: %v", err)
	}
}

func TestGetTasks(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a test task
	app.CreateTask("Test task", "Description", "HIGH", nil)
	
	tasks, err := app.GetTasks()
	if err != nil {
		t.Errorf("Failed to get tasks: %v", err)
	}
	
	if len(tasks) == 0 {
		t.Error("Expected at least one task")
	}
}

func TestUpdateTaskStatus(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a task
	app.CreateTask("Test task", "Description", "HIGH", nil)
	tasks, _ := app.GetTasks()
	
	if len(tasks) > 0 {
		err := app.UpdateTaskStatus(tasks[0].ID, "COMPLETED")
		if err != nil {
			t.Errorf("Failed to update task status: %v", err)
		}
	}
}

func TestCreateGoal(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	err := app.CreateGoal("Save for vacation", 50000.00, nil)
	if err != nil {
		t.Errorf("Failed to create goal: %v", err)
	}
}

func TestGetGoals(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Create a test goal
	app.CreateGoal("Test goal", 10000.00, nil)
	
	goals, err := app.GetGoals()
	if err != nil {
		t.Errorf("Failed to get goals: %v", err)
	}
	
	if len(goals) == 0 {
		t.Error("Expected at least one goal")
	}
}

func TestGetTradingStats(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	startDate := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	endDate := time.Now().Format("2006-01-02")
	
	stats, err := app.GetTradingStats(startDate, endDate)
	if err != nil {
		t.Errorf("Failed to get trading stats: %v", err)
	}
	
	if stats == nil {
		t.Error("Stats should not be nil")
	}
	
	if _, ok := stats["total_trades"]; !ok {
		t.Error("Stats should contain total_trades")
	}
}

func TestGetMonthlyStats(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	stats, err := app.GetMonthlyStats()
	if err != nil {
		t.Errorf("Failed to get monthly stats: %v", err)
	}
	
	if stats == nil {
		t.Error("Stats should not be nil")
	}
}

func TestCheckOvertrading(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	result, err := app.CheckOvertrading()
	if err != nil {
		t.Errorf("Failed to check overtrading: %v", err)
	}
	
	if result == nil {
		t.Error("Result should not be nil")
	}
	
	if _, ok := result["is_overtrading"]; !ok {
		t.Error("Result should contain is_overtrading")
	}
}

func TestGetTradingSettings(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	settings, err := app.GetTradingSettings()
	if err != nil {
		t.Errorf("Failed to get trading settings: %v", err)
	}
	
	if settings == nil {
		t.Error("Settings should not be nil")
	}
	
	if settings.MaxTradesPerDay == 0 {
		t.Error("MaxTradesPerDay should be set")
	}
}

func TestUpdateTradingSettings(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	err := app.UpdateTradingSettings(10, 10000.00, 2000.00)
	if err != nil {
		t.Errorf("Failed to update trading settings: %v", err)
	}
	
	// Verify update
	settings, _ := app.GetTradingSettings()
	if settings.MaxTradesPerDay != 10 {
		t.Errorf("Expected MaxTradesPerDay 10, got %d", settings.MaxTradesPerDay)
	}
}

func TestAddDeposit(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	transaction, err := app.AddDeposit(10000.00, "Initial deposit")
	if err != nil {
		t.Errorf("Failed to add deposit: %v", err)
	}
	
	if transaction == nil {
		t.Error("Transaction should not be nil")
	}
	
	if transaction.TransactionType != "DEPOSIT" {
		t.Error("Transaction type should be DEPOSIT")
	}
}

func TestAddWithdrawal(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Add deposit first
	app.AddDeposit(10000.00, "Initial deposit")
	
	transaction, err := app.AddWithdrawal(2000.00, "Withdrawal")
	if err != nil {
		t.Errorf("Failed to add withdrawal: %v", err)
	}
	
	if transaction == nil {
		t.Error("Transaction should not be nil")
	}
	
	if transaction.TransactionType != "WITHDRAWAL" {
		t.Error("Transaction type should be WITHDRAWAL")
	}
}

func TestGetCurrentCapitalBalance(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	// Add deposit
	app.AddDeposit(10000.00, "Initial deposit")
	
	balance, err := app.GetCurrentCapitalBalance()
	if err != nil {
		t.Errorf("Failed to get capital balance: %v", err)
	}
	
	if balance != 10000.00 {
		t.Errorf("Expected balance 10000, got %.2f", balance)
	}
}

func TestGetRecentLogs(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	logs, err := app.GetRecentLogs(10)
	if err != nil {
		t.Errorf("Failed to get recent logs: %v", err)
	}
	
	if logs == nil {
		t.Error("Logs should not be nil")
	}
}

func TestGetIndianMarketNews(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	news, err := app.GetIndianMarketNews()
	if err != nil {
		t.Errorf("Failed to get market news: %v", err)
	}
	
	if news == nil {
		t.Error("News should not be nil")
	}
	
	// Should return mock news if API fails
	if len(news) == 0 {
		t.Error("Expected at least mock news articles")
	}
}

func TestGetChecklistItems(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	items, err := app.GetChecklistItems("DAILY")
	if err != nil {
		t.Errorf("Failed to get checklist items: %v", err)
	}
	
	if items == nil {
		t.Error("Items should not be nil")
	}
	
	// Should have default items
	if len(items) == 0 {
		t.Error("Expected default checklist items")
	}
}

func TestCreateChecklistItem(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	err := app.CreateChecklistItem(
		"DAILY",
		"test_item",
		"Test Item",
		"Test description",
		10,
	)
	
	if err != nil {
		t.Errorf("Failed to create checklist item: %v", err)
	}
}

func TestGetDailyPLData(t *testing.T) {
	app := setupTestApp(t)
	defer app.shutdown(context.Background())
	
	data, err := app.GetDailyPLData(7)
	if err != nil {
		t.Errorf("Failed to get daily P&L data: %v", err)
	}
	
	if data == nil {
		t.Error("Data should not be nil")
	}
}

// Made with Bob