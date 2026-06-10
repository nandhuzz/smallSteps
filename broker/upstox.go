package broker

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	UpstoxBaseURL     = "https://api.upstox.com/v2"
	UpstoxAuthURL     = "https://api.upstox.com/v2/login/authorization/dialog"
	UpstoxTokenURL    = "https://api.upstox.com/v2/login/authorization/token"
)

type UpstoxClient struct {
	APIKey       string
	APISecret    string
	AccessToken  string
	RefreshToken string
	RedirectURI  string
	httpClient   *http.Client
}

// NewUpstoxClient creates a new Upstox API client
func NewUpstoxClient(apiKey, apiSecret, redirectURI string) *UpstoxClient {
	return &UpstoxClient{
		APIKey:      apiKey,
		APISecret:   apiSecret,
		RedirectURI: redirectURI,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewUpstoxClientWithAnalyticsToken creates a new Upstox client using Analytics Token from environment
func NewUpstoxClientWithAnalyticsToken() *UpstoxClient {
	analyticsToken := os.Getenv("UPSTOX_ANALYTICS_TOKEN")
	client := &UpstoxClient{
		AccessToken: analyticsToken,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
	return client
}


// GetAuthorizationURL generates the OAuth authorization URL
func (c *UpstoxClient) GetAuthorizationURL() string {
	return fmt.Sprintf("%s?client_id=%s&redirect_uri=%s&response_type=code",
		UpstoxAuthURL, c.APIKey, c.RedirectURI)
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// ExchangeCodeForToken exchanges authorization code for access token
func (c *UpstoxClient) ExchangeCodeForToken(code string) (*TokenResponse, error) {
	data := map[string]string{
		"code":          code,
		"client_id":     c.APIKey,
		"client_secret": c.APISecret,
		"redirect_uri":  c.RedirectURI,
		"grant_type":    "authorization_code",
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", UpstoxTokenURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	c.AccessToken = tokenResp.AccessToken
	c.RefreshToken = tokenResp.RefreshToken

	return &tokenResp, nil
}

// Trade represents a trade from Upstox
type Trade struct {
	OrderID       string    `json:"order_id"`
	Symbol        string    `json:"trading_symbol"`
	Exchange      string    `json:"exchange"`
	TransactionType string  `json:"transaction_type"` // BUY or SELL
	Quantity      int       `json:"quantity"`
	Price         float64   `json:"average_price"`
	OrderType     string    `json:"order_type"`
	Status        string    `json:"status"`
	TradeDate     time.Time `json:"order_timestamp"`
	Product       string    `json:"product"`
}

// Position represents a position from Upstox
type Position struct {
	Symbol        string  `json:"trading_symbol"`
	Exchange      string  `json:"exchange"`
	Quantity      int     `json:"quantity"`
	AveragePrice  float64 `json:"average_price"`
	LastPrice     float64 `json:"last_price"`
	PnL           float64 `json:"pnl"`
	DayChange     float64 `json:"day_change"`
	DayChangePerc float64 `json:"day_change_percentage"`
}

// GetTrades fetches trades from Upstox
func (c *UpstoxClient) GetTrades() ([]Trade, error) {
	if c.AccessToken == "" {
		return nil, fmt.Errorf("access token not set")
	}

	req, err := http.NewRequest("GET", UpstoxBaseURL+"/order/trades", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch trades: %s", string(body))
	}

	var result struct {
		Status string  `json:"status"`
		Data   []Trade `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result.Data, nil
}

// GetPositions fetches current positions from Upstox
func (c *UpstoxClient) GetPositions() ([]Position, error) {
	if c.AccessToken == "" {
		return nil, fmt.Errorf("access token not set")
	}

	req, err := http.NewRequest("GET", UpstoxBaseURL+"/portfolio/short-term-positions", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch positions: %s", string(body))
	}

	var result struct {
		Status string     `json:"status"`
		Data   []Position `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result.Data, nil
}

// MarketQuote represents market data for a symbol
type MarketQuote struct {
	Symbol       string    `json:"trading_symbol"`
	LastPrice    float64   `json:"last_price"`
	Open         float64   `json:"ohlc.open"`
	High         float64   `json:"ohlc.high"`
	Low          float64   `json:"ohlc.low"`
	Close        float64   `json:"ohlc.close"`
	Volume       int64     `json:"volume"`
	Change       float64   `json:"net_change"`
	ChangePercent float64  `json:"change_percent"`
	LastTradeTime time.Time `json:"last_trade_time"`
}

// GetMarketQuote fetches market quote for a symbol
func (c *UpstoxClient) GetMarketQuote(symbol, exchange string) (*MarketQuote, error) {
	if c.AccessToken == "" {
		return nil, fmt.Errorf("access token not set")
	}

	instrumentKey := fmt.Sprintf("%s:%s", exchange, symbol)
	url := fmt.Sprintf("%s/market-quote/quotes?instrument_key=%s", UpstoxBaseURL, instrumentKey)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch market quote: %s", string(body))
	}

	var result struct {
		Status string                 `json:"status"`
		Data   map[string]MarketQuote `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if quote, ok := result.Data[instrumentKey]; ok {
		return &quote, nil
	}

	return nil, fmt.Errorf("quote not found for %s", instrumentKey)
}

// UserProfile represents user profile information
type UserProfile struct {
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name"`
	Email     string `json:"email"`
	UserType  string `json:"user_type"`
	Broker    string `json:"broker"`
	Products  []string `json:"products"`
	Exchanges []string `json:"exchanges"`
}

// GetUserProfile fetches user profile
func (c *UpstoxClient) GetUserProfile() (*UserProfile, error) {
	if c.AccessToken == "" {
		return nil, fmt.Errorf("access token not set")
	}

	req, err := http.NewRequest("GET", UpstoxBaseURL+"/user/profile", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch user profile: %s", string(body))
	}

	var result struct {
		Status string      `json:"status"`
		Data   UserProfile `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result.Data, nil
}

// Made with Bob