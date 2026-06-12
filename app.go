package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"smallSteps/broker"
	"smallSteps/database"
	"time"
)

// App struct
type App struct {
	ctx context.Context
	db  *database.Database
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Initialize database
	db, err := database.NewDatabase()
	if err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		return
	}
	a.db = db
	
	// Initialize default checklist items if not already done
	if err := a.db.InitializeDefaultChecklistItems(); err != nil {
		fmt.Printf("Warning: Failed to initialize default checklist items: %v\n", err)
	}
	
	a.db.LogMessage("INFO", "Application started", "")
}

func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// Trade Methods
func (a *App) CreateTrade(symbol, tradeType string, quantity int, entryPrice, brokerage, otherCharges float64, notes, emotionBefore, instrumentType, optionType string, strikePrice float64, expiryDate string) (int, error) {
	trade := &database.Trade{
		Date:          time.Now(),
		Symbol:        symbol,
		TradeType:     tradeType,
		Quantity:      quantity,
		EntryPrice:    entryPrice,
		Brokerage:     brokerage,
		OtherCharges:  otherCharges,
		Notes:         notes,
		EmotionBefore: emotionBefore,
	}
	
	// Set optional fields for options trading
	if instrumentType != "" {
		instType := instrumentType
		trade.InstrumentType = &instType
	}
	if optionType != "" {
		optType := optionType
		trade.OptionType = &optType
	}
	if strikePrice > 0 {
		strike := strikePrice
		trade.StrikePrice = &strike
	}
	if expiryDate != "" {
		expiry := expiryDate
		trade.ExpiryDate = &expiry
	}
	
	err := a.db.CreateTrade(trade)
	return trade.ID, err
}

func (a *App) UpdateTrade(tradeID int, symbol, tradeType string, quantity int, entryPrice, brokerage, otherCharges float64, notes, emotionBefore, instrumentType, optionType string, strikePrice float64, expiryDate string) error {
	trade := &database.Trade{
		ID:            tradeID,
		Symbol:        symbol,
		TradeType:     tradeType,
		Quantity:      quantity,
		EntryPrice:    entryPrice,
		Brokerage:     brokerage,
		OtherCharges:  otherCharges,
		Notes:         notes,
		EmotionBefore: emotionBefore,
	}
	
	// Set optional fields for options trading
	if instrumentType != "" {
		instType := instrumentType
		trade.InstrumentType = &instType
	}
	if optionType != "" {
		optType := optionType
		trade.OptionType = &optType
	}
	if strikePrice > 0 {
		strike := strikePrice
		trade.StrikePrice = &strike
	}
	if expiryDate != "" {
		expiry := expiryDate
		trade.ExpiryDate = &expiry
	}
	
	return a.db.UpdateTrade(trade)
}

func (a *App) DeleteTrade(tradeID int) error {
	return a.db.DeleteTrade(tradeID)
}

func (a *App) CloseTrade(tradeID int, exitPrice float64, emotionAfter string) error {
	return a.db.CloseTrade(tradeID, exitPrice, emotionAfter)
}

func (a *App) GetTrades(limit int) ([]database.Trade, error) {
	return a.db.GetTrades(limit)
}

func (a *App) GetTodayTrades() ([]database.Trade, error) {
	return a.db.GetTodayTrades()
}

// Daily Checklist Methods
func (a *App) GetTodayChecklist() (*database.DailyChecklist, error) {
	today := time.Now().Format("2006-01-02")
	return a.db.GetOrCreateDailyChecklist(today)
}

func (a *App) UpdateDailyChecklist(id int, marketAnalysis, riskAssessment, tradingPlan, mentalState, capitalCheck, newsReview bool) error {
	checklist := &database.DailyChecklist{
		ID:             id,
		MarketAnalysis: marketAnalysis,
		RiskAssessment: riskAssessment,
		TradingPlan:    tradingPlan,
		MentalState:    mentalState,
		CapitalCheck:   capitalCheck,
		NewsReview:     newsReview,
	}
	return a.db.UpdateDailyChecklist(checklist)
}

// Weekly Checklist Methods
func (a *App) GetThisWeekChecklist() (*database.WeeklyChecklist, error) {
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	return a.db.GetOrCreateWeeklyChecklist(weekStart.Format("2006-01-02"))
}

func (a *App) UpdateWeeklyChecklist(id int, performanceReview, strategyAnalysis, goalProgress bool, learningNotes string) error {
	checklist := &database.WeeklyChecklist{
		ID:                id,
		PerformanceReview: performanceReview,
		StrategyAnalysis:  strategyAnalysis,
		GoalProgress:      goalProgress,
		LearningNotes:     learningNotes,
	}
	return a.db.UpdateWeeklyChecklist(checklist)
}

// Task Methods
func (a *App) CreateTask(title, description, priority string, dueDate *string) error {
	task := &database.Task{
		Title:       title,
		Description: description,
		Priority:    priority,
		DueDate:     dueDate,
	}
	return a.db.CreateTask(task)
}

func (a *App) GetTasks() ([]database.Task, error) {
	return a.db.GetTasks()
}

func (a *App) UpdateTaskStatus(taskID int, status string) error {
	return a.db.UpdateTaskStatus(taskID, status)
}

func (a *App) DeleteTask(taskID int) error {
	return a.db.DeleteTask(taskID)
}

func (a *App) UpdateTaskProgress(taskID int, progress int) error {
	return a.db.UpdateTaskProgress(taskID, progress)
}

func (a *App) AddTaskLog(taskID int, logMessage string) error {
	return a.db.AddTaskLog(taskID, logMessage)
}

func (a *App) GetTaskLogs(taskID int) ([]database.TaskLog, error) {
	return a.db.GetTaskLogs(taskID)
}

// Goal Methods
func (a *App) CreateGoal(title string, targetAmount float64, deadline *string) error {
	goal := &database.Goal{
		Title:        title,
		TargetAmount: targetAmount,
		Deadline:     deadline,
	}
	return a.db.CreateGoal(goal)
}

func (a *App) GetGoals() ([]database.Goal, error) {
	return a.db.GetGoals()
}

func (a *App) UpdateGoal(id int, title string, targetAmount float64, deadline *string) error {
	goal := &database.Goal{
		ID:           id,
		Title:        title,
		TargetAmount: targetAmount,
		Deadline:     deadline,
	}
	return a.db.UpdateGoal(goal)
}

func (a *App) DeleteGoal(goalID int) error {
	return a.db.DeleteGoal(goalID)
}

func (a *App) ContributeToGoal(goalID, tradeID int, amount float64) error {
	return a.db.ContributeToGoal(goalID, tradeID, amount)
}

// Statistics Methods
func (a *App) GetTradingStats(startDate, endDate string) (map[string]interface{}, error) {
	return a.db.GetTradingStats(startDate, endDate)
}

func (a *App) GetMonthlyStats() (map[string]interface{}, error) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).Format("2006-01-02")
	endDate := now.Format("2006-01-02")
	return a.db.GetTradingStats(startDate, endDate)
}

func (a *App) GetDailyPLData(days int) ([]map[string]interface{}, error) {
	return a.db.GetDailyPLData(days)
}

// Overtrading Check
func (a *App) CheckOvertrading() (map[string]interface{}, error) {
	isOvertrading, message, err := a.db.CheckOvertrading()
	if err != nil {
		return nil, err
	}
	
	result := map[string]interface{}{
		"is_overtrading": isOvertrading,
		"message":        message,
	}
	
	if isOvertrading {
		a.db.LogMessage("WARNING", "Overtrading detected", message)
	}
	
	return result, nil
}

// Settings Methods
func (a *App) GetTradingSettings() (*database.TradingSettings, error) {
	return a.db.GetTradingSettings()
}

func (a *App) UpdateTradingSettings(maxTradesPerDay int, maxLossPerDay, maxLossPerTrade float64) error {
	settings := &database.TradingSettings{
		MaxTradesPerDay: maxTradesPerDay,
		MaxLossPerDay:   maxLossPerDay,
		MaxLossPerTrade: maxLossPerTrade,
	}
	return a.db.UpdateTradingSettings(settings)
}

// News API - Fetch Indian Market News
type NewsArticle struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url"`
	PublishedAt string `json:"publishedAt"`
	Source      string `json:"source"`
}

func (a *App) GetIndianMarketNews() ([]NewsArticle, error) {
	// Using NewsAPI.org - You'll need to get a free API key from https://newsapi.org/
	// For now, returning mock data. Replace with actual API call
	
	apiKey := "YOUR_NEWS_API_KEY" // Replace with actual API key
	url := fmt.Sprintf("https://newsapi.org/v2/everything?q=indian+stock+market+OR+nse+OR+bse+OR+sensex+OR+nifty&language=en&sortBy=publishedAt&apiKey=%s", apiKey)
	
	resp, err := http.Get(url)
	if err != nil {
		// Return mock data if API fails
		return a.getMockNews(), nil
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		return a.getMockNews(), nil
	}
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return a.getMockNews(), nil
	}
	
	var result struct {
		Articles []struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			URL         string `json:"url"`
			PublishedAt string `json:"publishedAt"`
			Source      struct {
				Name string `json:"name"`
			} `json:"source"`
		} `json:"articles"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return a.getMockNews(), nil
	}
	
	var news []NewsArticle
	for i, article := range result.Articles {
		if i >= 10 { // Limit to 10 articles
			break
		}
		news = append(news, NewsArticle{
			Title:       article.Title,
			Description: article.Description,
			URL:         article.URL,
			PublishedAt: article.PublishedAt,
			Source:      article.Source.Name,
		})
	}
	
	return news, nil
}

func (a *App) getMockNews() []NewsArticle {
	return []NewsArticle{
		{
			Title:       "Sensex rises 500 points on positive global cues",
			Description: "Indian stock markets opened higher today following positive trends in global markets.",
			URL:         "https://example.com/news1",
			PublishedAt: time.Now().Format(time.RFC3339),
			Source:      "Economic Times",
		},
		{
			Title:       "Nifty crosses 18,000 mark amid strong buying",
			Description: "The Nifty 50 index crossed the 18,000 mark today driven by strong buying in banking and IT stocks.",
			URL:         "https://example.com/news2",
			PublishedAt: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			Source:      "Moneycontrol",
		},
		{
			Title:       "RBI announces new monetary policy measures",
			Description: "Reserve Bank of India announced new measures to control inflation and support economic growth.",
			URL:         "https://example.com/news3",
			PublishedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Source:      "Business Standard",
		},
	}
}

// Get Market News from Upstox integration
func (a *App) GetUpstoxMarketNews() ([]NewsArticle, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	
	news, err := client.GetMarketNews()
	if err != nil {
		// Fallback to mock news
		return a.getMockNews(), nil
	}
	
	var articles []NewsArticle
	for _, n := range news {
		articles = append(articles, NewsArticle{
			Title:       n.Title,
			Description: n.Description,
			URL:         n.URL,
			PublishedAt: n.PublishedAt.Format(time.RFC3339),
			Source:      n.Source,
		})
	}
	
	return articles, nil
}

// Get Recent Logs
func (a *App) GetRecentLogs(limit int) ([]map[string]interface{}, error) {
	query := `SELECT log_type, message, details, created_at FROM trading_logs ORDER BY created_at DESC LIMIT ?`
	rows, err := a.db.DB.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var logs []map[string]interface{}
	for rows.Next() {
		var logType, message, details string
		var createdAt time.Time
		if err := rows.Scan(&logType, &message, &details, &createdAt); err != nil {
			continue
		}
		logs = append(logs, map[string]interface{}{
			"log_type":   logType,
			"message":    message,
			"details":    details,
			"created_at": createdAt.Format("2006-01-02 15:04:05"),
		})
	}
	return logs, nil
}

// Broker Configuration Methods
func (a *App) SaveBrokerConfig(brokerName, apiKey, apiSecret string, autoSyncTrades, autoSyncPositions bool, syncInterval int) error {
	config := &database.BrokerConfig{
		BrokerName:        brokerName,
		APIKey:            apiKey,
		APISecret:         apiSecret,
		IsActive:          false, // Will be activated after successful auth
		AutoSyncTrades:    autoSyncTrades,
		AutoSyncPositions: autoSyncPositions,
		SyncInterval:      syncInterval,
	}
	return a.db.CreateBrokerConfig(config)
}

func (a *App) GetBrokerConfig(brokerName string) (*database.BrokerConfig, error) {
	return a.db.GetBrokerConfig(brokerName)
}

func (a *App) GetAllBrokerConfigs() ([]database.BrokerConfig, error) {
	return a.db.GetAllBrokerConfigs()
}

func (a *App) UpdateBrokerConfig(id int, apiKey, apiSecret string, autoSyncTrades, autoSyncPositions bool, syncInterval int) error {
	config := &database.BrokerConfig{
		ID:                id,
		APIKey:            apiKey,
		APISecret:         apiSecret,
		AutoSyncTrades:    autoSyncTrades,
		AutoSyncPositions: autoSyncPositions,
		SyncInterval:      syncInterval,
	}
	return a.db.UpdateBrokerConfig(config)
}

func (a *App) DeleteBrokerConfig(brokerID int) error {
	return a.db.DeleteBrokerConfig(brokerID)
}

// Upstox Integration Methods
func (a *App) GetUpstoxAuthURL(apiKey, redirectURI string) string {
	client := broker.NewUpstoxClient(apiKey, "", redirectURI)
	return client.GetAuthorizationURL()
}

func (a *App) AuthorizeUpstox(brokerID int, code string) error {
	// Get broker config
	config, err := a.db.GetBrokerConfig("UPSTOX")
	if err != nil {
		return fmt.Errorf("broker config not found: %v", err)
	}

	// Create Upstox client
	client := broker.NewUpstoxClient(config.APIKey, config.APISecret, "http://localhost:34115/callback")
	
	// Exchange code for token
	tokenResp, err := client.ExchangeCodeForToken(code)
	if err != nil {
		return fmt.Errorf("failed to exchange code: %v", err)
	}

	// Calculate token expiry
	expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

	// Update broker config with tokens
	err = a.db.UpdateBrokerTokens(config.ID, tokenResp.AccessToken, tokenResp.RefreshToken, &expiry)
	if err != nil {
		return err
	}

	a.db.LogMessage("INFO", "Upstox authorization successful", fmt.Sprintf("Broker ID: %d", brokerID))
	return nil
}

func (a *App) SyncUpstoxTrades(brokerID int) (map[string]interface{}, error) {
	// Get broker config
	config, err := a.db.GetBrokerConfig("UPSTOX")
	if err != nil {
		return nil, fmt.Errorf("broker config not found: %v", err)
	}

	if config.AccessToken == "" {
		return nil, fmt.Errorf("broker not authorized")
	}

	// Create Upstox client
	client := broker.NewUpstoxClient(config.APIKey, config.APISecret, "")
	client.AccessToken = config.AccessToken

	// Fetch trades from Upstox
	trades, err := client.GetTrades()
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to sync Upstox trades", err.Error())
		return nil, err
	}

	syncedCount := 0
	skippedCount := 0

	// Process each trade
	for _, trade := range trades {
		// Check if trade already exists
		exists, _ := a.db.CheckBrokerTradeExists(trade.OrderID)
		if exists {
			skippedCount++
			continue
		}

		// Convert to synced trade
		rawData, _ := json.Marshal(trade)
		syncedTrade := &database.SyncedTrade{
			BrokerID:      config.ID,
			BrokerTradeID: trade.OrderID,
			Symbol:        trade.Symbol,
			TradeType:     trade.TransactionType,
			Quantity:      trade.Quantity,
			Price:         trade.Price,
			TradeDate:     trade.TradeDate,
			SyncStatus:    "SYNCED",
			RawData:       string(rawData),
		}

		// Save synced trade
		if err := a.db.CreateSyncedTrade(syncedTrade); err != nil {
			a.db.LogMessage("ERROR", "Failed to save synced trade", err.Error())
			continue
		}

		syncedCount++
	}

	// Update last sync time
	a.db.UpdateBrokerLastSync(config.ID)

	result := map[string]interface{}{
		"synced":  syncedCount,
		"skipped": skippedCount,
		"total":   len(trades),
	}

	a.db.LogMessage("INFO", "Upstox trades synced", fmt.Sprintf("Synced: %d, Skipped: %d", syncedCount, skippedCount))
	return result, nil
}

func (a *App) GetSyncedTrades(brokerID int, limit int) ([]database.SyncedTrade, error) {
	return a.db.GetSyncedTrades(brokerID, limit)
}

func (a *App) GetUpstoxPositions(brokerID int) ([]broker.Position, error) {
	// Get broker config
	config, err := a.db.GetBrokerConfig("UPSTOX")
	if err != nil {
		return nil, fmt.Errorf("broker config not found: %v", err)
	}

	if config.AccessToken == "" {
		return nil, fmt.Errorf("broker not authorized")
	}

	// Create Upstox client
	client := broker.NewUpstoxClient(config.APIKey, config.APISecret, "")
	client.AccessToken = config.AccessToken

	// Fetch positions
	positions, err := client.GetPositions()
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to fetch Upstox positions", err.Error())
		return nil, err
	}

	return positions, nil
}

func (a *App) GetUpstoxMarketQuote(symbol, exchange string) (*broker.MarketQuote, error) {
	// Get broker config
	config, err := a.db.GetBrokerConfig("UPSTOX")
	if err != nil {
		return nil, fmt.Errorf("broker config not found: %v", err)
	}

	if config.AccessToken == "" {
		return nil, fmt.Errorf("broker not authorized")
	}

	// Create Upstox client
	client := broker.NewUpstoxClient(config.APIKey, config.APISecret, "")
	client.AccessToken = config.AccessToken

	// Fetch market quote
	quote, err := client.GetMarketQuote(symbol, exchange)
	if err != nil {
		return nil, err
	}

	return quote, nil
}

// Analytics Token Methods - Read-only operations using long-lived token
func (a *App) GetPortfolioWithAnalyticsToken() ([]broker.Position, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	if client.AccessToken == "" {
		return nil, fmt.Errorf("analytics token not configured in .env file")
	}

	positions, err := client.GetPositions()
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to fetch portfolio with analytics token", err.Error())
		return nil, err
	}

	a.db.LogMessage("INFO", "Portfolio fetched using analytics token", fmt.Sprintf("Found %d positions", len(positions)))
	return positions, nil
}

func (a *App) GetTradesWithAnalyticsToken() ([]broker.Trade, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	if client.AccessToken == "" {
		return nil, fmt.Errorf("analytics token not configured in .env file")
	}

	trades, err := client.GetTrades()
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to fetch trades with analytics token", err.Error())
		return nil, err
	}

	a.db.LogMessage("INFO", "Trades fetched using analytics token", fmt.Sprintf("Found %d trades", len(trades)))
	return trades, nil
}

func (a *App) GetMarketQuoteWithAnalyticsToken(symbol, exchange string) (*broker.MarketQuote, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	if client.AccessToken == "" {
		return nil, fmt.Errorf("analytics token not configured in .env file")
	}

	quote, err := client.GetMarketQuote(symbol, exchange)
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to fetch market quote with analytics token", err.Error())
		return nil, err
	}

	return quote, nil
}

func (a *App) GetUserProfileWithAnalyticsToken() (*broker.UserProfile, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	if client.AccessToken == "" {
		return nil, fmt.Errorf("analytics token not configured in .env file")
	}

	profile, err := client.GetUserProfile()
	if err != nil {
		a.db.LogMessage("ERROR", "Failed to fetch user profile with analytics token", err.Error())
		return nil, err
	}

	a.db.LogMessage("INFO", "User profile fetched using analytics token", fmt.Sprintf("User: %s", profile.UserName))
	return profile, nil
}

func (a *App) CheckAnalyticsTokenStatus() (map[string]interface{}, error) {
	client := broker.NewUpstoxClientWithAnalyticsToken()
	
	result := map[string]interface{}{
		"configured": client.AccessToken != "",
		"token_set":  client.AccessToken != "",
	}

	if client.AccessToken == "" {
		result["message"] = "Analytics token not found in .env file"
		return result, nil
	}

	// Try to fetch user profile to verify token
	profile, err := client.GetUserProfile()
	if err != nil {
		result["valid"] = false
		result["message"] = "Token is invalid or expired"
		result["error"] = err.Error()
		return result, nil
	}

	result["valid"] = true
	result["message"] = "Analytics token is valid and working"
	result["user_id"] = profile.UserID
	result["user_name"] = profile.UserName
	
	return result, nil
}

// Capital Transaction Methods
func (a *App) AddDeposit(amount float64, notes string) (*database.CapitalTransaction, error) {
	return a.db.AddCapitalTransaction("DEPOSIT", amount, notes)
}

func (a *App) AddWithdrawal(amount float64, notes string) (*database.CapitalTransaction, error) {
	return a.db.AddCapitalTransaction("WITHDRAWAL", amount, notes)
}

func (a *App) GetCapitalTransactions(limit int) ([]database.CapitalTransaction, error) {
	return a.db.GetCapitalTransactions(limit)
}

func (a *App) GetCurrentCapitalBalance() (float64, error) {
	return a.db.GetCurrentCapitalBalance()
}

// Checklist Item Methods
func (a *App) GetChecklistItems(checklistType string) ([]database.ChecklistItem, error) {
	return a.db.GetChecklistItems(checklistType)
}

func (a *App) CreateChecklistItem(checklistType, itemKey, itemLabel, itemDescription string, displayOrder int) error {
	item := &database.ChecklistItem{
		ChecklistType:   checklistType,
		ItemKey:         itemKey,
		ItemLabel:       itemLabel,
		ItemDescription: itemDescription,
		DisplayOrder:    displayOrder,
	}
	return a.db.CreateChecklistItem(item)
}

func (a *App) UpdateChecklistItem(id int, itemLabel, itemDescription string, displayOrder int) error {
	item := &database.ChecklistItem{
		ID:              id,
		ItemLabel:       itemLabel,
		ItemDescription: itemDescription,
		DisplayOrder:    displayOrder,
	}
	return a.db.UpdateChecklistItem(item)
}

func (a *App) DeleteChecklistItem(itemID int) error {
	return a.db.DeleteChecklistItem(itemID)
}

// Enhanced Trading Settings with Capital Protection
func (a *App) UpdateTradingSettingsWithProtection(maxTradesPerDay int, maxLossPerDay, maxLossPerTrade float64,
	capitalProtectionEnabled bool, protectedCapital, minCapitalThreshold float64) error {
	settings := &database.TradingSettings{
		MaxTradesPerDay:          maxTradesPerDay,
		MaxLossPerDay:            maxLossPerDay,
		MaxLossPerTrade:          maxLossPerTrade,
		CapitalProtectionEnabled: capitalProtectionEnabled,
		ProtectedCapital:         protectedCapital,
		MinCapitalThreshold:      minCapitalThreshold,
	}
	return a.db.UpdateTradingSettings(settings)
}

// Made with Bob
