# Upstox Broker Integration Guide

## Overview
SmallSteps now includes full integration with Upstox broker, allowing you to:
- Sync trades automatically from your Upstox account
- View real-time positions
- Fetch market quotes

## 📖 Documentation

- **[Analytics Token Guide](UPSTOX_ANALYTICS_TOKEN.md)** - Recommended for read-only access (portfolio, trades, market data)
- **OAuth Integration** - Full trading capabilities (documented below)

- Auto-sync at configurable intervals

## Setup Instructions

### 1. Get Upstox API Credentials

1. Visit [Upstox Developer Console](https://api.upstox.com)
2. Sign in with your Upstox account
3. Create a new app:
   - App Name: SmallSteps Trading
   - Redirect URI: `http://localhost:34115/callback`
4. Note down your **API Key** and **API Secret**

### 2. Configure in SmallSteps

1. Launch SmallSteps application
2. Navigate to **Broker** tab from the sidebar (🔗 icon)
3. Enter your API Key and API Secret
4. Configure sync settings:
   - **Auto-sync trades**: Enable to automatically sync trades
   - **Auto-sync positions**: Enable to automatically sync positions
   - **Sync Interval**: Set interval in seconds (default: 300 = 5 minutes)
5. Click **Save Configuration**

### 3. Authorize Access

1. Click **Authorize Upstox** button
2. A browser window will open with Upstox login
3. Log in to your Upstox account
4. Grant permissions to SmallSteps
5. Copy the authorization code from the redirect URL
6. Paste the code in SmallSteps and click **Submit Code**
7. You should see "✓ Connected" status

## Features

### Trade Synchronization

**Manual Sync:**
- Go to Broker → Synced Trades tab
- Click **Sync Now** button
- View all synced trades with status

**Auto Sync:**
- Enable "Auto-sync trades" in configuration
- Trades will sync automatically at the specified interval
- Check "Last sync" timestamp in the configuration section

### Position Monitoring

- Go to Broker → Positions tab
- Click **Refresh** to fetch current positions
- View:
  - Symbol and Exchange
  - Quantity and Average Price
  - Current Price and P&L
  - Day Change percentage

### Market Data

The integration provides access to:
- Real-time market quotes
- OHLC data (Open, High, Low, Close)
- Volume and price changes
- Last trade time

## Database Schema

### broker_config Table
Stores broker API configuration and tokens:
- `broker_name`: UPSTOX
- `api_key`: Your API key
- `api_secret`: Your API secret (encrypted)
- `access_token`: OAuth access token
- `refresh_token`: OAuth refresh token
- `token_expiry`: Token expiration time
- `is_active`: Connection status
- `auto_sync_trades`: Auto-sync flag
- `sync_interval`: Sync interval in seconds
- `last_sync`: Last sync timestamp

### synced_trades Table
Stores trades synced from broker:
- `broker_trade_id`: Unique trade ID from broker
- `local_trade_id`: Link to local trades table
- `symbol`: Trading symbol
- `trade_type`: BUY or SELL
- `quantity`: Number of shares/contracts
- `price`: Execution price
- `trade_date`: Trade execution date
- `sync_status`: SYNCED, PENDING, or ERROR
- `raw_data`: Complete JSON data from broker

## API Methods

### Backend (Go)

```go
// Save broker configuration
SaveBrokerConfig(brokerName, apiKey, apiSecret string, autoSyncTrades, autoSyncPositions bool, syncInterval int) error

// Get broker configuration
GetBrokerConfig(brokerName string) (*database.BrokerConfig, error)

// Get authorization URL
GetUpstoxAuthURL(apiKey, redirectURI string) string

// Complete authorization
AuthorizeUpstox(brokerID int, code string) error

// Sync trades from broker
SyncUpstoxTrades(brokerID int) (map[string]interface{}, error)

// Get synced trades
GetSyncedTrades(brokerID int, limit int) ([]database.SyncedTrade, error)

// Get current positions
GetUpstoxPositions(brokerID int) ([]broker.Position, error)

// Get market quote
GetUpstoxMarketQuote(symbol, exchange string) (*broker.MarketQuote, error)
```

### Frontend (TypeScript)

```typescript
// All methods are auto-generated in wailsjs/go/main/App
import {
    SaveBrokerConfig,
    GetBrokerConfig,
    GetUpstoxAuthURL,
    AuthorizeUpstox,
    SyncUpstoxTrades,
    GetSyncedTrades,
    GetUpstoxPositions
} from '../wailsjs/go/main/App';
```

## Security Notes

1. **API Credentials**: Stored locally in SQLite database
2. **Access Tokens**: Automatically refreshed when expired
3. **Data Privacy**: All data stays on your local machine
4. **No Cloud Storage**: No data is sent to external servers

## Troubleshooting

### Authorization Failed
- Verify API Key and Secret are correct
- Check redirect URI matches: `http://localhost:34115/callback`
- Ensure Upstox account is active

### Sync Not Working
- Check if broker is authorized (✓ Connected status)
- Verify token hasn't expired
- Check internet connection
- Review logs in Logs tab

### Missing Trades
- Trades are synced from the time of authorization
- Historical trades may not be available via API
- Check sync status in Synced Trades tab

## Future Enhancements

Planned features:
- [ ] Automatic trade import to local trades
- [ ] Real-time position updates via WebSocket
- [ ] Order placement through SmallSteps
- [ ] Portfolio analytics from broker data
- [ ] Multi-broker support (Zerodha, Angel One, etc.)

## Support

For issues or questions:
1. Check application logs (Logs tab)
2. Review Upstox API documentation
3. Verify API credentials and permissions

## Made with Bob