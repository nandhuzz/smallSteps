package main

import (
	"context"
	"testing"
	"time"
)

// Integration tests that test the full workflow of the application

func TestFullTradingWorkflow(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Check daily checklist
	checklist, err := app.GetTodayChecklist()
	if err != nil {
		t.Fatalf("Failed to get daily checklist: %v", err)
	}
	
	// Step 2: Complete daily checklist
	err = app.UpdateDailyChecklist(checklist.ID, true, true, true, true, true, true)
	if err != nil {
		t.Fatalf("Failed to update daily checklist: %v", err)
	}
	
	// Step 3: Add initial capital
	_, err = app.AddDeposit(100000.00, "Initial capital")
	if err != nil {
		t.Fatalf("Failed to add deposit: %v", err)
	}
	
	// Step 4: Create a trade
	tradeID, err := app.CreateTrade(
		"RELIANCE",
		"BUY",
		10,
		2500.00,
		20.0,
		5.0,
		"Good setup",
		"Confident",
		"EQUITY",
		"",
		0,
		"",
	)
	if err != nil {
		t.Fatalf("Failed to create trade: %v", err)
	}
	
	// Step 5: Close the trade with profit
	err = app.CloseTrade(tradeID, 2600.00, "Happy with profit")
	if err != nil {
		t.Fatalf("Failed to close trade: %v", err)
	}
	
	// Step 6: Verify trade is closed and P&L is calculated
	trades, err := app.GetTrades(1)
	if err != nil {
		t.Fatalf("Failed to get trades: %v", err)
	}
	
	if len(trades) == 0 {
		t.Fatal("No trades found")
	}
	
	trade := trades[0]
	if trade.Status != "CLOSED" {
		t.Errorf("Expected trade status CLOSED, got %s", trade.Status)
	}
	
	if trade.ProfitLoss == nil {
		t.Fatal("Profit/Loss should be calculated")
	}
	
	// Expected P&L: (2600 - 2500) * 10 - 25 = 975
	expectedPL := 975.0
	if *trade.ProfitLoss != expectedPL {
		t.Errorf("Expected P&L %.2f, got %.2f", expectedPL, *trade.ProfitLoss)
	}
	
	// Step 7: Check trading statistics
	stats, err := app.GetMonthlyStats()
	if err != nil {
		t.Fatalf("Failed to get monthly stats: %v", err)
	}
	
	totalTrades := stats["total_trades"].(int)
	if totalTrades != 1 {
		t.Errorf("Expected 1 trade in stats, got %d", totalTrades)
	}
	
	// Step 8: Create a goal
	err = app.CreateGoal("Save for vacation", 50000.00, nil)
	if err != nil {
		t.Fatalf("Failed to create goal: %v", err)
	}
	
	// Step 9: Verify goal was created
	goals, err := app.GetGoals()
	if err != nil {
		t.Fatalf("Failed to get goals: %v", err)
	}
	
	if len(goals) == 0 {
		t.Fatal("No goals found")
	}
}

func TestOvertradingDetection(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Set strict trading limits
	err := app.UpdateTradingSettings(2, 1000.00, 500.00)
	if err != nil {
		t.Fatalf("Failed to update trading settings: %v", err)
	}
	
	// Step 2: Create trades exceeding the limit
	for i := 0; i < 3; i++ {
		_, err := app.CreateTrade(
			"RELIANCE",
			"BUY",
			10,
			2500.00,
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
			t.Fatalf("Failed to create trade %d: %v", i+1, err)
		}
	}
	
	// Step 3: Check for overtrading
	result, err := app.CheckOvertrading()
	if err != nil {
		t.Fatalf("Failed to check overtrading: %v", err)
	}
	
	isOvertrading := result["is_overtrading"].(bool)
	if !isOvertrading {
		t.Error("Expected overtrading to be detected")
	}
	
	message := result["message"].(string)
	if message == "" {
		t.Error("Expected overtrading message")
	}
}

func TestCapitalManagement(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Add initial deposit
	deposit, err := app.AddDeposit(50000.00, "Initial deposit")
	if err != nil {
		t.Fatalf("Failed to add deposit: %v", err)
	}
	
	if deposit.BalanceAfter != 50000.00 {
		t.Errorf("Expected balance 50000, got %.2f", deposit.BalanceAfter)
	}
	
	// Step 2: Add another deposit
	_, err = app.AddDeposit(25000.00, "Additional deposit")
	if err != nil {
		t.Fatalf("Failed to add second deposit: %v", err)
	}
	
	// Step 3: Make a withdrawal
	withdrawal, err := app.AddWithdrawal(10000.00, "Withdrawal for expenses")
	if err != nil {
		t.Fatalf("Failed to add withdrawal: %v", err)
	}
	
	expectedBalance := 65000.00 // 50000 + 25000 - 10000
	if withdrawal.BalanceAfter != expectedBalance {
		t.Errorf("Expected balance %.2f, got %.2f", expectedBalance, withdrawal.BalanceAfter)
	}
	
	// Step 4: Verify current balance
	balance, err := app.GetCurrentCapitalBalance()
	if err != nil {
		t.Fatalf("Failed to get current balance: %v", err)
	}
	
	if balance != expectedBalance {
		t.Errorf("Expected current balance %.2f, got %.2f", expectedBalance, balance)
	}
	
	// Step 5: Get transaction history
	transactions, err := app.GetCapitalTransactions(10)
	if err != nil {
		t.Fatalf("Failed to get transactions: %v", err)
	}
	
	if len(transactions) != 3 {
		t.Errorf("Expected 3 transactions, got %d", len(transactions))
	}
}

func TestTaskAndGoalManagement(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Create tasks
	err := app.CreateTask("Review trading strategy", "Analyze last week", "HIGH", nil)
	if err != nil {
		t.Fatalf("Failed to create task 1: %v", err)
	}
	
	err = app.CreateTask("Update trading journal", "Document trades", "MEDIUM", nil)
	if err != nil {
		t.Fatalf("Failed to create task 2: %v", err)
	}
	
	// Step 2: Get tasks
	tasks, err := app.GetTasks()
	if err != nil {
		t.Fatalf("Failed to get tasks: %v", err)
	}
	
	if len(tasks) != 2 {
		t.Errorf("Expected 2 tasks, got %d", len(tasks))
	}
	
	// Step 3: Complete a task
	if len(tasks) > 0 {
		err = app.UpdateTaskStatus(tasks[0].ID, "COMPLETED")
		if err != nil {
			t.Fatalf("Failed to update task status: %v", err)
		}
	}
	
	// Step 4: Verify task is completed (should not appear in pending tasks)
	pendingTasks, err := app.GetTasks()
	if err != nil {
		t.Fatalf("Failed to get pending tasks: %v", err)
	}
	
	if len(pendingTasks) != 1 {
		t.Errorf("Expected 1 pending task, got %d", len(pendingTasks))
	}
	
	// Step 5: Create goals
	err = app.CreateGoal("Save for vacation", 50000.00, nil)
	if err != nil {
		t.Fatalf("Failed to create goal 1: %v", err)
	}
	
	err = app.CreateGoal("Emergency fund", 100000.00, nil)
	if err != nil {
		t.Fatalf("Failed to create goal 2: %v", err)
	}
	
	// Step 6: Get goals
	goals, err := app.GetGoals()
	if err != nil {
		t.Fatalf("Failed to get goals: %v", err)
	}
	
	if len(goals) != 2 {
		t.Errorf("Expected 2 goals, got %d", len(goals))
	}
}

func TestWeeklyReviewWorkflow(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Create multiple trades throughout the week
	for i := 0; i < 5; i++ {
		tradeID, err := app.CreateTrade(
			"RELIANCE",
			"BUY",
			10,
			2500.00,
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
			t.Fatalf("Failed to create trade %d: %v", i+1, err)
		}
		
		// Close some trades with profit, some with loss
		var exitPrice float64
		if i%2 == 0 {
			exitPrice = 2600.00 // Profit
		} else {
			exitPrice = 2450.00 // Loss
		}
		
		err = app.CloseTrade(tradeID, exitPrice, "Trade completed")
		if err != nil {
			t.Fatalf("Failed to close trade %d: %v", i+1, err)
		}
	}
	
	// Step 2: Get weekly checklist
	checklist, err := app.GetThisWeekChecklist()
	if err != nil {
		t.Fatalf("Failed to get weekly checklist: %v", err)
	}
	
	// Step 3: Complete weekly review
	err = app.UpdateWeeklyChecklist(
		checklist.ID,
		true,
		true,
		true,
		"Good week overall. Need to work on risk management.",
	)
	if err != nil {
		t.Fatalf("Failed to update weekly checklist: %v", err)
	}
	
	// Step 4: Get trading statistics
	stats, err := app.GetMonthlyStats()
	if err != nil {
		t.Fatalf("Failed to get monthly stats: %v", err)
	}
	
	totalTrades := stats["total_trades"].(int)
	if totalTrades != 5 {
		t.Errorf("Expected 5 trades in stats, got %d", totalTrades)
	}
	
	// Step 5: Get daily P&L data
	plData, err := app.GetDailyPLData(7)
	if err != nil {
		t.Fatalf("Failed to get daily P&L data: %v", err)
	}
	
	if plData == nil {
		t.Error("P&L data should not be nil")
	}
}

func TestChecklistCustomization(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Get default checklist items
	dailyItems, err := app.GetChecklistItems("DAILY")
	if err != nil {
		t.Fatalf("Failed to get daily checklist items: %v", err)
	}
	
	initialCount := len(dailyItems)
	if initialCount == 0 {
		t.Error("Expected default daily checklist items")
	}
	
	// Step 2: Add custom checklist item
	err = app.CreateChecklistItem(
		"DAILY",
		"custom_check",
		"Custom Check",
		"My custom checklist item",
		10,
	)
	if err != nil {
		t.Fatalf("Failed to create custom checklist item: %v", err)
	}
	
	// Step 3: Verify custom item was added
	updatedItems, err := app.GetChecklistItems("DAILY")
	if err != nil {
		t.Fatalf("Failed to get updated checklist items: %v", err)
	}
	
	if len(updatedItems) != initialCount+1 {
		t.Errorf("Expected %d items, got %d", initialCount+1, len(updatedItems))
	}
}

func TestMultipleTradesWithDifferentInstruments(t *testing.T) {
	app := NewApp()
	app.startup(context.Background())
	defer app.shutdown(context.Background())
	
	// Step 1: Create equity trade
	equityID, err := app.CreateTrade(
		"RELIANCE",
		"BUY",
		10,
		2500.00,
		20.0,
		5.0,
		"Equity trade",
		"Confident",
		"EQUITY",
		"",
		0,
		"",
	)
	if err != nil {
		t.Fatalf("Failed to create equity trade: %v", err)
	}
	
	// Step 2: Create options trade
	expiryDate := time.Now().AddDate(0, 0, 30).Format("2006-01-02")
	optionsID, err := app.CreateTrade(
		"NIFTY",
		"BUY",
		50,
		100.00,
		20.0,
		5.0,
		"Options trade",
		"Cautious",
		"OPTIONS",
		"CALL",
		18000.00,
		expiryDate,
	)
	if err != nil {
		t.Fatalf("Failed to create options trade: %v", err)
	}
	
	// Step 3: Close both trades
	err = app.CloseTrade(equityID, 2550.00, "Good profit")
	if err != nil {
		t.Fatalf("Failed to close equity trade: %v", err)
	}
	
	err = app.CloseTrade(optionsID, 120.00, "Options profit")
	if err != nil {
		t.Fatalf("Failed to close options trade: %v", err)
	}
	
	// Step 4: Verify both trades
	trades, err := app.GetTrades(10)
	if err != nil {
		t.Fatalf("Failed to get trades: %v", err)
	}
	
	if len(trades) < 2 {
		t.Errorf("Expected at least 2 trades, got %d", len(trades))
	}
	
	// Verify instrument types
	hasEquity := false
	hasOptions := false
	for _, trade := range trades {
		if trade.InstrumentType != nil {
			if *trade.InstrumentType == "EQUITY" {
				hasEquity = true
			}
			if *trade.InstrumentType == "OPTIONS" {
				hasOptions = true
			}
		}
	}
	
	if !hasEquity {
		t.Error("Expected to find equity trade")
	}
	if !hasOptions {
		t.Error("Expected to find options trade")
	}
}

// Made with Bob