package database

import (
	"database/sql"
	"fmt"
	"time"
)

// Trade Services
func (d *Database) CreateTrade(trade *Trade) error {
	query := `INSERT INTO trades (date, symbol, trade_type, instrument_type, option_type, strike_price, expiry_date, quantity, entry_price, brokerage, other_charges, notes, emotion_before, status)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	result, err := d.DB.Exec(query, trade.Date, trade.Symbol, trade.TradeType, trade.InstrumentType,
		trade.OptionType, trade.StrikePrice, trade.ExpiryDate, trade.Quantity,
		trade.EntryPrice, trade.Brokerage, trade.OtherCharges, trade.Notes, trade.EmotionBefore, "OPEN")
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	trade.ID = int(id)
	d.LogMessage("TRADE", fmt.Sprintf("New trade created: %s %s %s", trade.TradeType, trade.InstrumentType, trade.Symbol), "")
	return nil
}

func (d *Database) UpdateTrade(trade *Trade) error {
	query := `UPDATE trades SET symbol = ?, trade_type = ?, instrument_type = ?, option_type = ?,
			  strike_price = ?, expiry_date = ?, quantity = ?, entry_price = ?, brokerage = ?,
			  other_charges = ?, notes = ?, emotion_before = ? WHERE id = ?`
	_, err := d.DB.Exec(query, trade.Symbol, trade.TradeType, trade.InstrumentType, trade.OptionType,
		trade.StrikePrice, trade.ExpiryDate, trade.Quantity, trade.EntryPrice, trade.Brokerage,
		trade.OtherCharges, trade.Notes, trade.EmotionBefore, trade.ID)
	if err != nil {
		return err
	}
	d.LogMessage("TRADE", fmt.Sprintf("Trade updated: ID %d, %s %s", trade.ID, trade.TradeType, trade.Symbol), "")
	return nil
}

func (d *Database) DeleteTrade(tradeID int) error {
	tx, err := d.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Remove from goal contributions if exists
	_, err = tx.Exec(`DELETE FROM goal_contributions WHERE trade_id = ?`, tradeID)
	if err != nil {
		return err
	}

	// Delete trade
	_, err = tx.Exec(`DELETE FROM trades WHERE id = ?`, tradeID)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	d.LogMessage("TRADE", fmt.Sprintf("Trade deleted: ID %d", tradeID), "")
	return nil
}

func (d *Database) CloseTrade(tradeID int, exitPrice float64, emotionAfter string) error {
	// Get trade details
	var trade Trade
	query := `SELECT quantity, entry_price, brokerage, other_charges, trade_type FROM trades WHERE id = ?`
	err := d.DB.QueryRow(query, tradeID).Scan(&trade.Quantity, &trade.EntryPrice, &trade.Brokerage, &trade.OtherCharges, &trade.TradeType)
	if err != nil {
		return err
	}

	// Calculate P&L
	var profitLoss float64
	if trade.TradeType == "BUY" {
		profitLoss = (exitPrice - trade.EntryPrice) * float64(trade.Quantity)
	} else {
		profitLoss = (trade.EntryPrice - exitPrice) * float64(trade.Quantity)
	}
	profitLoss -= (trade.Brokerage + trade.OtherCharges)

	updateQuery := `UPDATE trades SET exit_price = ?, profit_loss = ?, emotion_after = ?, status = 'CLOSED' WHERE id = ?`
	_, err = d.DB.Exec(updateQuery, exitPrice, profitLoss, emotionAfter, tradeID)
	if err != nil {
		return err
	}

	d.LogMessage("TRADE", fmt.Sprintf("Trade closed: ID %d, P&L: %.2f", tradeID, profitLoss), "")
	return nil
}

func (d *Database) GetTrades(limit int) ([]Trade, error) {
	query := `SELECT id, date, symbol, trade_type, COALESCE(instrument_type, 'EQUITY'),
			  COALESCE(option_type, ''), COALESCE(strike_price, 0), COALESCE(expiry_date, ''),
			  quantity, entry_price, COALESCE(exit_price, 0), COALESCE(profit_loss, 0),
			  brokerage, other_charges, status, notes, emotion_before, COALESCE(emotion_after, ''), created_at
			  FROM trades ORDER BY date DESC LIMIT ?`

	rows, err := d.DB.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trades []Trade
	for rows.Next() {
		var trade Trade
		var exitPrice, profitLoss, strikePrice float64
		var optionType, expiryDate string
		err := rows.Scan(&trade.ID, &trade.Date, &trade.Symbol, &trade.TradeType, &trade.InstrumentType,
			&optionType, &strikePrice, &expiryDate,
			&trade.Quantity, &trade.EntryPrice, &exitPrice, &profitLoss, &trade.Brokerage, &trade.OtherCharges,
			&trade.Status, &trade.Notes, &trade.EmotionBefore, &trade.EmotionAfter, &trade.CreatedAt)
		if err != nil {
			return nil, err
		}
		if exitPrice > 0 {
			trade.ExitPrice = &exitPrice
			trade.ProfitLoss = &profitLoss
		}
		if optionType != "" {
			trade.OptionType = &optionType
		}
		if strikePrice > 0 {
			trade.StrikePrice = &strikePrice
		}
		if expiryDate != "" {
			trade.ExpiryDate = &expiryDate
		}
		trades = append(trades, trade)
	}
	return trades, nil
}

func (d *Database) GetTodayTrades() ([]Trade, error) {
	today := time.Now().Format("2006-01-02")
	query := `SELECT id, date, symbol, trade_type, COALESCE(instrument_type, 'EQUITY'),
			  COALESCE(option_type, ''), COALESCE(strike_price, 0), COALESCE(expiry_date, ''),
			  quantity, entry_price, COALESCE(exit_price, 0), COALESCE(profit_loss, 0),
			  brokerage, other_charges, status, notes, emotion_before, COALESCE(emotion_after, ''), created_at
			  FROM trades WHERE DATE(date) = ? ORDER BY date DESC`

	rows, err := d.DB.Query(query, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trades []Trade
	for rows.Next() {
		var trade Trade
		var exitPrice, profitLoss, strikePrice float64
		var optionType, expiryDate string
		err := rows.Scan(&trade.ID, &trade.Date, &trade.Symbol, &trade.TradeType, &trade.InstrumentType,
			&optionType, &strikePrice, &expiryDate,
			&trade.Quantity, &trade.EntryPrice, &exitPrice, &profitLoss, &trade.Brokerage, &trade.OtherCharges,
			&trade.Status, &trade.Notes, &trade.EmotionBefore, &trade.EmotionAfter, &trade.CreatedAt)
		if err != nil {
			return nil, err
		}
		if exitPrice > 0 {
			trade.ExitPrice = &exitPrice
			trade.ProfitLoss = &profitLoss
		}
		if optionType != "" {
			trade.OptionType = &optionType
		}
		if strikePrice > 0 {
			trade.StrikePrice = &strikePrice
		}
		if expiryDate != "" {
			trade.ExpiryDate = &expiryDate
		}
		trades = append(trades, trade)
	}
	return trades, nil
}

// Daily Checklist Services
func (d *Database) GetOrCreateDailyChecklist(date string) (*DailyChecklist, error) {
	var checklist DailyChecklist
	query := `SELECT id, date, market_analysis, risk_assessment, trading_plan, mental_state, capital_check, news_review, created_at 
			  FROM daily_checklist WHERE date = ?`

	err := d.DB.QueryRow(query, date).Scan(&checklist.ID, &checklist.Date, &checklist.MarketAnalysis,
		&checklist.RiskAssessment, &checklist.TradingPlan, &checklist.MentalState,
		&checklist.CapitalCheck, &checklist.NewsReview, &checklist.CreatedAt)

	if err == sql.ErrNoRows {
		// Create new checklist
		insertQuery := `INSERT INTO daily_checklist (date) VALUES (?)`
		result, err := d.DB.Exec(insertQuery, date)
		if err != nil {
			return nil, err
		}
		id, _ := result.LastInsertId()
		checklist.ID = int(id)
		checklist.Date = date
		checklist.CreatedAt = time.Now()
		return &checklist, nil
	}

	return &checklist, err
}

func (d *Database) UpdateDailyChecklist(checklist *DailyChecklist) error {
	query := `UPDATE daily_checklist SET market_analysis = ?, risk_assessment = ?, trading_plan = ?, 
			  mental_state = ?, capital_check = ?, news_review = ? WHERE id = ?`
	_, err := d.DB.Exec(query, checklist.MarketAnalysis, checklist.RiskAssessment, checklist.TradingPlan,
		checklist.MentalState, checklist.CapitalCheck, checklist.NewsReview, checklist.ID)
	return err
}

// Weekly Checklist Services
func (d *Database) GetOrCreateWeeklyChecklist(weekStart string) (*WeeklyChecklist, error) {
	var checklist WeeklyChecklist
	query := `SELECT id, week_start, performance_review, strategy_analysis, goal_progress, 
			  COALESCE(learning_notes, ''), created_at FROM weekly_checklist WHERE week_start = ?`

	err := d.DB.QueryRow(query, weekStart).Scan(&checklist.ID, &checklist.WeekStart,
		&checklist.PerformanceReview, &checklist.StrategyAnalysis, &checklist.GoalProgress,
		&checklist.LearningNotes, &checklist.CreatedAt)

	if err == sql.ErrNoRows {
		insertQuery := `INSERT INTO weekly_checklist (week_start) VALUES (?)`
		result, err := d.DB.Exec(insertQuery, weekStart)
		if err != nil {
			return nil, err
		}
		id, _ := result.LastInsertId()
		checklist.ID = int(id)
		checklist.WeekStart = weekStart
		checklist.CreatedAt = time.Now()
		return &checklist, nil
	}

	return &checklist, err
}

func (d *Database) UpdateWeeklyChecklist(checklist *WeeklyChecklist) error {
	query := `UPDATE weekly_checklist SET performance_review = ?, strategy_analysis = ?, 
			  goal_progress = ?, learning_notes = ? WHERE id = ?`
	_, err := d.DB.Exec(query, checklist.PerformanceReview, checklist.StrategyAnalysis,
		checklist.GoalProgress, checklist.LearningNotes, checklist.ID)
	return err
}

// Task Services
func (d *Database) CreateTask(task *Task) error {
	query := `INSERT INTO tasks (title, description, priority, due_date) VALUES (?, ?, ?, ?)`
	result, err := d.DB.Exec(query, task.Title, task.Description, task.Priority, task.DueDate)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	task.ID = int(id)
	return nil
}

func (d *Database) GetTasks() ([]Task, error) {
	query := `SELECT id, title, description, priority, status, COALESCE(progress, 0), due_date,
			  created_at, completed_at, updated_at
			  FROM tasks ORDER BY
			  CASE status
			    WHEN 'IN_PROGRESS' THEN 1
			    WHEN 'PENDING' THEN 2
			    WHEN 'COMPLETED' THEN 3
			  END,
			  priority DESC, due_date ASC`

	rows, err := d.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var task Task
		var dueDate sql.NullString
		var completedTime, updatedTime sql.NullTime
		err := rows.Scan(&task.ID, &task.Title, &task.Description, &task.Priority, &task.Status,
			&task.Progress, &dueDate, &task.CreatedAt, &completedTime, &updatedTime)
		if err != nil {
			return nil, err
		}
		if dueDate.Valid {
			task.DueDate = &dueDate.String
		}
		if completedTime.Valid {
			task.CompletedAt = &completedTime.Time
		}
		// Use updated_at if available, otherwise use created_at
		if updatedTime.Valid {
			task.UpdatedAt = updatedTime.Time
		} else {
			task.UpdatedAt = task.CreatedAt
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (d *Database) UpdateTaskStatus(taskID int, status string) error {
	query := `UPDATE tasks SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	var completedAt interface{}
	if status == "COMPLETED" {
		completedAt = time.Now()
	}
	_, err := d.DB.Exec(query, status, completedAt, taskID)
	return err
}

func (d *Database) UpdateTaskProgress(taskID int, progress int) error {
	if progress < 0 {
		progress = 0
	}
	if progress > 100 {
		progress = 100
	}

	query := `UPDATE tasks SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := d.DB.Exec(query, progress, taskID)

	if err == nil {
		d.LogMessage("INFO", fmt.Sprintf("Task progress updated: ID %d, Progress: %d%%", taskID, progress), "")
	}
	return err
}

func (d *Database) AddTaskLog(taskID int, logMessage string) error {
	// Get current progress
	var currentProgress int
	err := d.DB.QueryRow(`SELECT progress FROM tasks WHERE id = ?`, taskID).Scan(&currentProgress)
	if err != nil {
		return err
	}

	// Insert log with progress snapshot
	query := `INSERT INTO task_logs (task_id, log_message, progress_snapshot) VALUES (?, ?, ?)`
	_, err = d.DB.Exec(query, taskID, logMessage, currentProgress)

	if err == nil {
		// Update task's updated_at timestamp
		d.DB.Exec(`UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, taskID)
		d.LogMessage("INFO", fmt.Sprintf("Task log added: ID %d, Progress: %d%%", taskID, currentProgress), logMessage)
	}
	return err
}

func (d *Database) GetTaskLogs(taskID int) ([]TaskLog, error) {
	query := `SELECT id, task_id, log_message, COALESCE(progress_snapshot, 0), created_at FROM task_logs
			  WHERE task_id = ? ORDER BY created_at DESC`

	rows, err := d.DB.Query(query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []TaskLog
	for rows.Next() {
		var log TaskLog
		err := rows.Scan(&log.ID, &log.TaskID, &log.LogMessage, &log.ProgressSnapshot, &log.CreatedAt)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

func (d *Database) DeleteTask(taskID int) error {
	query := `DELETE FROM tasks WHERE id = ?`
	_, err := d.DB.Exec(query, taskID)
	return err
}

// Goal Services
func (d *Database) CreateGoal(goal *Goal) error {
	query := `INSERT INTO goals (title, target_amount, deadline) VALUES (?, ?, ?)`
	result, err := d.DB.Exec(query, goal.Title, goal.TargetAmount, goal.Deadline)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	goal.ID = int(id)
	return nil
}

func (d *Database) GetGoals() ([]Goal, error) {
	query := `SELECT id, title, target_amount, current_amount, deadline, status, created_at
			  FROM goals WHERE status = 'ACTIVE' ORDER BY created_at DESC`

	rows, err := d.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []Goal
	for rows.Next() {
		var goal Goal
		var deadline sql.NullString
		err := rows.Scan(&goal.ID, &goal.Title, &goal.TargetAmount, &goal.CurrentAmount,
			&deadline, &goal.Status, &goal.CreatedAt)
		if err != nil {
			return nil, err
		}
		if deadline.Valid {
			goal.Deadline = &deadline.String
		}
		goals = append(goals, goal)
	}
	return goals, nil
}

func (d *Database) UpdateGoal(goal *Goal) error {
	query := `UPDATE goals SET title = ?, target_amount = ?, deadline = ? WHERE id = ?`
	_, err := d.DB.Exec(query, goal.Title, goal.TargetAmount, goal.Deadline, goal.ID)
	return err
}

func (d *Database) DeleteGoal(goalID int) error {
	tx, err := d.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete goal contributions first
	_, err = tx.Exec(`DELETE FROM goal_contributions WHERE goal_id = ?`, goalID)
	if err != nil {
		return err
	}

	// Delete goal
	_, err = tx.Exec(`DELETE FROM goals WHERE id = ?`, goalID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (d *Database) ContributeToGoal(goalID, tradeID int, amount float64) error {
	tx, err := d.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Add contribution
	_, err = tx.Exec(`INSERT INTO goal_contributions (goal_id, trade_id, amount) VALUES (?, ?, ?)`,
		goalID, tradeID, amount)
	if err != nil {
		return err
	}

	// Update goal current amount
	_, err = tx.Exec(`UPDATE goals SET current_amount = current_amount + ? WHERE id = ?`, amount, goalID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// Get Daily P&L Data for graphs
func (d *Database) GetDailyPLData(days int) ([]map[string]interface{}, error) {
	query := `
		SELECT DATE(date) as trade_date, 
			   COUNT(*) as trade_count,
			   SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as profit,
			   SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as loss,
			   SUM(COALESCE(profit_loss, 0)) as net_pl,
			   SUM(brokerage + other_charges) as total_charges
		FROM trades 
		WHERE date >= DATE('now', '-' || ? || ' days')
		AND status = 'CLOSED'
		GROUP BY DATE(date)
		ORDER BY DATE(date) ASC
	`

	rows, err := d.DB.Query(query, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var tradeDate string
		var tradeCount int
		var profit, loss, netPL, totalCharges float64

		err := rows.Scan(&tradeDate, &tradeCount, &profit, &loss, &netPL, &totalCharges)
		if err != nil {
			return nil, err
		}

		data = append(data, map[string]interface{}{
			"date":          tradeDate,
			"trade_count":   tradeCount,
			"profit":        profit,
			"loss":          round2(loss),
			"net_pl":        round2(netPL),
			"total_charges": totalCharges,
		})
	}

	return data, nil
}

// Trading Statistics
func (d *Database) GetTradingStats(startDate, endDate string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total trades
	var totalTrades int
	d.DB.QueryRow(`SELECT COUNT(*) FROM trades WHERE DATE(date) BETWEEN ? AND ?`, startDate, endDate).Scan(&totalTrades)
	stats["total_trades"] = totalTrades

	// Winning trades
	var winningTrades int
	d.DB.QueryRow(`SELECT COUNT(*) FROM trades WHERE profit_loss > 0 AND DATE(date) BETWEEN ? AND ?`, startDate, endDate).Scan(&winningTrades)
	stats["winning_trades"] = winningTrades

	// Losing trades
	var losingTrades int
	d.DB.QueryRow(`SELECT COUNT(*) FROM trades WHERE profit_loss < 0 AND DATE(date) BETWEEN ? AND ?`, startDate, endDate).Scan(&losingTrades)
	stats["losing_trades"] = losingTrades

	// Total profit/loss
	var totalPL sql.NullFloat64
	d.DB.QueryRow(`SELECT SUM(profit_loss) FROM trades WHERE DATE(date) BETWEEN ? AND ?`, startDate, endDate).Scan(&totalPL)
	if totalPL.Valid {
		stats["total_pl"] = totalPL.Float64
	} else {
		stats["total_pl"] = 0.0
	}

	// Total brokerage
	var totalBrokerage sql.NullFloat64
	d.DB.QueryRow(`SELECT SUM(brokerage + other_charges) FROM trades WHERE DATE(date) BETWEEN ? AND ?`, startDate, endDate).Scan(&totalBrokerage)
	if totalBrokerage.Valid {
		stats["total_charges"] = totalBrokerage.Float64
	} else {
		stats["total_charges"] = 0.0
	}

	return stats, nil
}

// Check if overtrading
func (d *Database) CheckOvertrading() (bool, string, error) {
	var settings TradingSettings
	err := d.DB.QueryRow(`SELECT max_trades_per_day, max_loss_per_day FROM trading_settings WHERE id = 1`).
		Scan(&settings.MaxTradesPerDay, &settings.MaxLossPerDay)
	if err != nil {
		return false, "", err
	}

	today := time.Now().Format("2006-01-02")

	// Check trade count
	var tradeCount int
	d.DB.QueryRow(`SELECT COUNT(*) FROM trades WHERE DATE(date) = ?`, today).Scan(&tradeCount)

	if tradeCount >= settings.MaxTradesPerDay {
		return true, fmt.Sprintf("Maximum trades per day (%d) reached. Stop trading!", settings.MaxTradesPerDay), nil
	}

	// Check daily loss
	var dailyLoss sql.NullFloat64
	d.DB.QueryRow(`SELECT SUM(profit_loss) FROM trades WHERE DATE(date) = ? AND profit_loss < 0`, today).Scan(&dailyLoss)

	if dailyLoss.Valid && dailyLoss.Float64 < -settings.MaxLossPerDay {
		return true, fmt.Sprintf("Maximum daily loss (%.2f) exceeded. Stop trading!", settings.MaxLossPerDay), nil
	}

	return false, "", nil
}

func (d *Database) GetTradingSettings() (*TradingSettings, error) {
	var settings TradingSettings
	err := d.DB.QueryRow(`SELECT id, max_trades_per_day, max_loss_per_day, max_loss_per_trade, updated_at 
						  FROM trading_settings WHERE id = 1`).
		Scan(&settings.ID, &settings.MaxTradesPerDay, &settings.MaxLossPerDay,
			&settings.MaxLossPerTrade, &settings.UpdatedAt)
	return &settings, err
}

func (d *Database) UpdateTradingSettings(settings *TradingSettings) error {
	query := `UPDATE trading_settings SET max_trades_per_day = ?, max_loss_per_day = ?,
			  max_loss_per_trade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
	_, err := d.DB.Exec(query, settings.MaxTradesPerDay, settings.MaxLossPerDay, settings.MaxLossPerTrade)
	return err
}

// Broker Configuration Services
func (d *Database) CreateBrokerConfig(config *BrokerConfig) error {
	query := `INSERT INTO broker_config (broker_name, api_key, api_secret, access_token, refresh_token,
			  token_expiry, is_active, auto_sync_trades, auto_sync_positions, sync_interval)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	result, err := d.DB.Exec(query, config.BrokerName, config.APIKey, config.APISecret,
		config.AccessToken, config.RefreshToken, config.TokenExpiry, config.IsActive,
		config.AutoSyncTrades, config.AutoSyncPositions, config.SyncInterval)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	config.ID = int(id)
	return nil
}

func (d *Database) GetBrokerConfig(brokerName string) (*BrokerConfig, error) {
	var config BrokerConfig
	var tokenExpiry, lastSync sql.NullTime

	query := `SELECT id, broker_name, api_key, api_secret, access_token, refresh_token,
			  token_expiry, is_active, auto_sync_trades, auto_sync_positions, sync_interval,
			  last_sync, created_at, updated_at
			  FROM broker_config WHERE broker_name = ? ORDER BY id DESC LIMIT 1`

	err := d.DB.QueryRow(query, brokerName).Scan(&config.ID, &config.BrokerName, &config.APIKey,
		&config.APISecret, &config.AccessToken, &config.RefreshToken, &tokenExpiry,
		&config.IsActive, &config.AutoSyncTrades, &config.AutoSyncPositions, &config.SyncInterval,
		&lastSync, &config.CreatedAt, &config.UpdatedAt)

	if err != nil {
		return nil, err
	}

	if tokenExpiry.Valid {
		config.TokenExpiry = &tokenExpiry.Time
	}
	if lastSync.Valid {
		config.LastSync = &lastSync.Time
	}

	return &config, nil
}

func (d *Database) GetAllBrokerConfigs() ([]BrokerConfig, error) {
	query := `SELECT id, broker_name, api_key, api_secret, access_token, refresh_token,
			  token_expiry, is_active, auto_sync_trades, auto_sync_positions, sync_interval,
			  last_sync, created_at, updated_at
			  FROM broker_config ORDER BY created_at DESC`

	rows, err := d.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []BrokerConfig
	for rows.Next() {
		var config BrokerConfig
		var tokenExpiry, lastSync sql.NullTime

		err := rows.Scan(&config.ID, &config.BrokerName, &config.APIKey, &config.APISecret,
			&config.AccessToken, &config.RefreshToken, &tokenExpiry, &config.IsActive,
			&config.AutoSyncTrades, &config.AutoSyncPositions, &config.SyncInterval,
			&lastSync, &config.CreatedAt, &config.UpdatedAt)
		if err != nil {
			return nil, err
		}

		if tokenExpiry.Valid {
			config.TokenExpiry = &tokenExpiry.Time
		}
		if lastSync.Valid {
			config.LastSync = &lastSync.Time
		}

		configs = append(configs, config)
	}
	return configs, nil
}

func (d *Database) UpdateBrokerConfig(config *BrokerConfig) error {
	query := `UPDATE broker_config SET api_key = ?, api_secret = ?, access_token = ?,
			  refresh_token = ?, token_expiry = ?, is_active = ?, auto_sync_trades = ?,
			  auto_sync_positions = ?, sync_interval = ?, updated_at = CURRENT_TIMESTAMP
			  WHERE id = ?`
	_, err := d.DB.Exec(query, config.APIKey, config.APISecret, config.AccessToken,
		config.RefreshToken, config.TokenExpiry, config.IsActive, config.AutoSyncTrades,
		config.AutoSyncPositions, config.SyncInterval, config.ID)
	return err
}

func (d *Database) UpdateBrokerTokens(brokerID int, accessToken, refreshToken string, expiry *time.Time) error {
	query := `UPDATE broker_config SET access_token = ?, refresh_token = ?, token_expiry = ?,
			  updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := d.DB.Exec(query, accessToken, refreshToken, expiry, brokerID)
	return err
}

func (d *Database) UpdateBrokerLastSync(brokerID int) error {
	query := `UPDATE broker_config SET last_sync = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := d.DB.Exec(query, brokerID)
	return err
}

func (d *Database) DeleteBrokerConfig(brokerID int) error {
	query := `DELETE FROM broker_config WHERE id = ?`
	_, err := d.DB.Exec(query, brokerID)
	return err
}

// Synced Trades Services
func (d *Database) CreateSyncedTrade(trade *SyncedTrade) error {
	query := `INSERT INTO synced_trades (broker_id, broker_trade_id, local_trade_id, symbol,
			  trade_type, quantity, price, trade_date, sync_status, raw_data)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	result, err := d.DB.Exec(query, trade.BrokerID, trade.BrokerTradeID, trade.LocalTradeID,
		trade.Symbol, trade.TradeType, trade.Quantity, trade.Price, trade.TradeDate,
		trade.SyncStatus, trade.RawData)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	trade.ID = int(id)
	return nil
}

func (d *Database) GetSyncedTrades(brokerID int, limit int) ([]SyncedTrade, error) {
	query := `SELECT id, broker_id, broker_trade_id, local_trade_id, symbol, trade_type,
			  quantity, price, trade_date, sync_status, raw_data, created_at
			  FROM synced_trades WHERE broker_id = ? ORDER BY trade_date DESC LIMIT ?`

	rows, err := d.DB.Query(query, brokerID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trades []SyncedTrade
	for rows.Next() {
		var trade SyncedTrade
		var localTradeID sql.NullInt64

		err := rows.Scan(&trade.ID, &trade.BrokerID, &trade.BrokerTradeID, &localTradeID,
			&trade.Symbol, &trade.TradeType, &trade.Quantity, &trade.Price, &trade.TradeDate,
			&trade.SyncStatus, &trade.RawData, &trade.CreatedAt)
		if err != nil {
			return nil, err
		}

		if localTradeID.Valid {
			id := int(localTradeID.Int64)
			trade.LocalTradeID = &id
		}

		trades = append(trades, trade)
	}
	return trades, nil
}

func (d *Database) UpdateSyncedTradeLocalID(syncedTradeID, localTradeID int) error {
	query := `UPDATE synced_trades SET local_trade_id = ?, sync_status = 'SYNCED' WHERE id = ?`
	_, err := d.DB.Exec(query, localTradeID, syncedTradeID)
	return err
}

func (d *Database) CheckBrokerTradeExists(brokerTradeID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM synced_trades WHERE broker_trade_id = ?`
	err := d.DB.QueryRow(query, brokerTradeID).Scan(&count)
	return count > 0, err
}

// Capital Transaction Services
func (d *Database) AddCapitalTransaction(transactionType string, amount float64, notes string) (*CapitalTransaction, error) {
	// Get current balance
	var currentBalance float64
	err := d.DB.QueryRow(`
		SELECT COALESCE(balance_after, 0) FROM capital_transactions
		ORDER BY transaction_date DESC LIMIT 1
	`).Scan(&currentBalance)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Calculate new balance
	var balanceAfter float64
	if transactionType == "DEPOSIT" {
		balanceAfter = currentBalance + amount
	} else if transactionType == "WITHDRAWAL" {
		balanceAfter = currentBalance - amount
	} else {
		return nil, fmt.Errorf("invalid transaction type: %s", transactionType)
	}

	// Insert transaction
	query := `INSERT INTO capital_transactions (transaction_type, amount, balance_after, notes)
			  VALUES (?, ?, ?, ?)`
	result, err := d.DB.Exec(query, transactionType, amount, balanceAfter, notes)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()

	transaction := &CapitalTransaction{
		ID:              int(id),
		TransactionType: transactionType,
		Amount:          amount,
		BalanceAfter:    balanceAfter,
		Notes:           notes,
		TransactionDate: time.Now(),
		CreatedAt:       time.Now(),
	}

	d.LogMessage("INFO", fmt.Sprintf("Capital %s: %.2f", transactionType, amount),
		fmt.Sprintf("New balance: %.2f", balanceAfter))

	return transaction, nil
}

func (d *Database) GetCapitalTransactions(limit int) ([]CapitalTransaction, error) {
	query := `SELECT id, transaction_type, amount, balance_after, COALESCE(notes, ''),
			  transaction_date, created_at FROM capital_transactions
			  ORDER BY transaction_date DESC LIMIT ?`

	rows, err := d.DB.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []CapitalTransaction
	for rows.Next() {
		var t CapitalTransaction
		err := rows.Scan(&t.ID, &t.TransactionType, &t.Amount, &t.BalanceAfter,
			&t.Notes, &t.TransactionDate, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

func (d *Database) GetCurrentCapitalBalance() (float64, error) {
	var balance float64
	err := d.DB.QueryRow(`
		SELECT COALESCE(balance_after, 0) FROM capital_transactions
		ORDER BY transaction_date DESC LIMIT 1
	`).Scan(&balance)

	if err == sql.ErrNoRows {
		return 0, nil
	}
	return balance, err
}

// Checklist Item Services
func (d *Database) CreateChecklistItem(item *ChecklistItem) error {
	query := `INSERT INTO checklist_items (checklist_type, item_key, item_label,
			  item_description, display_order) VALUES (?, ?, ?, ?, ?)`
	result, err := d.DB.Exec(query, item.ChecklistType, item.ItemKey, item.ItemLabel,
		item.ItemDescription, item.DisplayOrder)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	item.ID = int(id)
	return nil
}

func (d *Database) GetChecklistItems(checklistType string) ([]ChecklistItem, error) {
	query := `SELECT id, checklist_type, item_key, item_label, item_description,
			  display_order, is_active, created_at FROM checklist_items
			  WHERE checklist_type = ? AND is_active = 1 ORDER BY display_order ASC`

	rows, err := d.DB.Query(query, checklistType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ChecklistItem
	for rows.Next() {
		var item ChecklistItem
		err := rows.Scan(&item.ID, &item.ChecklistType, &item.ItemKey, &item.ItemLabel,
			&item.ItemDescription, &item.DisplayOrder, &item.IsActive, &item.CreatedAt)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (d *Database) UpdateChecklistItem(item *ChecklistItem) error {
	query := `UPDATE checklist_items SET item_label = ?, item_description = ?,
			  display_order = ? WHERE id = ?`
	_, err := d.DB.Exec(query, item.ItemLabel, item.ItemDescription,
		item.DisplayOrder, item.ID)
	return err
}

func (d *Database) DeleteChecklistItem(itemID int) error {
	query := `UPDATE checklist_items SET is_active = 0 WHERE id = ?`
	_, err := d.DB.Exec(query, itemID)
	return err
}

func (d *Database) InitializeDefaultChecklistItems() error {
	// Check if items already exist
	var count int
	d.DB.QueryRow(`SELECT COUNT(*) FROM checklist_items`).Scan(&count)
	if count > 0 {
		return nil // Already initialized
	}

	dailyItems := []ChecklistItem{
		{ChecklistType: "DAILY", ItemKey: "market_analysis", ItemLabel: "Market Analysis", ItemDescription: "Analyzed market trends and conditions", DisplayOrder: 1},
		{ChecklistType: "DAILY", ItemKey: "risk_assessment", ItemLabel: "Risk Assessment", ItemDescription: "Evaluated potential risks for today", DisplayOrder: 2},
		{ChecklistType: "DAILY", ItemKey: "trading_plan", ItemLabel: "Trading Plan", ItemDescription: "Created a clear trading plan", DisplayOrder: 3},
		{ChecklistType: "DAILY", ItemKey: "mental_state", ItemLabel: "Mental State Check", ItemDescription: "Feeling calm and focused", DisplayOrder: 4},
		{ChecklistType: "DAILY", ItemKey: "capital_check", ItemLabel: "Capital Check", ItemDescription: "Verified available capital", DisplayOrder: 5},
		{ChecklistType: "DAILY", ItemKey: "news_review", ItemLabel: "News Review", ItemDescription: "Reviewed important market news", DisplayOrder: 6},
	}

	weeklyItems := []ChecklistItem{
		{ChecklistType: "WEEKLY", ItemKey: "performance_review", ItemLabel: "Performance Review", ItemDescription: "Reviewed weekly trading performance", DisplayOrder: 1},
		{ChecklistType: "WEEKLY", ItemKey: "strategy_analysis", ItemLabel: "Strategy Analysis", ItemDescription: "Analyzed trading strategies effectiveness", DisplayOrder: 2},
		{ChecklistType: "WEEKLY", ItemKey: "goal_progress", ItemLabel: "Goal Progress", ItemDescription: "Checked progress towards financial goals", DisplayOrder: 3},
	}

	for _, item := range dailyItems {
		if err := d.CreateChecklistItem(&item); err != nil {
			return err
		}
	}

	for _, item := range weeklyItems {
		if err := d.CreateChecklistItem(&item); err != nil {
			return err
		}
	}

	return nil
}

// Made with Bob
