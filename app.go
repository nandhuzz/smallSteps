package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
	a.db.LogMessage("INFO", "Application started", "")
}

func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// Trade Methods
func (a *App) CreateTrade(symbol, tradeType string, quantity int, entryPrice, brokerage, otherCharges float64, notes, emotionBefore string) (int, error) {
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
	err := a.db.CreateTrade(trade)
	return trade.ID, err
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

// Made with Bob
