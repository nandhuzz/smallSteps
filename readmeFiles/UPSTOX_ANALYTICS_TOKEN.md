# Upstox Analytics Token Integration

## Overview

SmallSteps supports Upstox Analytics Token for read-only access to your trading data. This is the **recommended method** for portfolio analysis and trade tracking.

## What is an Analytics Token?

The Analytics Token is a **long-lived access token** provided by Upstox with the following characteristics:

- **Validity**: 1 year from creation date
- **Access Type**: Read-only
- **Authentication**: No OAuth flow required
- **Setup**: Simple - just add to .env file
- **Static IP**: Can be configured with static IP for enhanced security

## Supported Features

### ✅ What You CAN Do

- View portfolio and positions
- Fetch trade history
- Get market quotes and data
- Access user profile information
- Analyze mutual funds
- Review orders

### ❌ What You CANNOT Do

- Place new orders
- Modify existing orders
- Cancel orders
- Any trading operations

## Setup Instructions

### Step 1: Get Your Analytics Token

1. Visit [Upstox API Apps](https://api.upstox.com/apps)
2. Sign in with your Upstox account
3. Navigate to **My Apps** section
4. Find or create an app
5. Look for **Analytics Token** in the app details
6. Copy the token (format: `eyJ0eXAiOi...`)

**Token Details:**
- Created: Check the "Date Created" column
- Expires: Check the "Expiry Date" column (1 year from creation)
- Can be revoked anytime from the dashboard

### Step 2: Configure in SmallSteps

1. Locate the `.env` file in SmallSteps root directory
   - If it doesn't exist, copy `.env.example` to `.env`

2. Open `.env` and add your token:
   ```env
   UPSTOX_ANALYTICS_TOKEN=eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ...
   ```

3. Save the file

4. Restart SmallSteps application

### Step 3: Verify Token

1. Launch SmallSteps
2. Go to **Broker** tab
3. Click **Check Analytics Token Status**
4. You should see:
   - ✓ Token is valid and working
   - User ID and Name displayed

## Using Analytics Token Features

### Check Token Status

```typescript
import { CheckAnalyticsTokenStatus } from '../wailsjs/go/main/App';

const status = await CheckAnalyticsTokenStatus();
console.log(status);
// {
//   configured: true,
//   valid: true,
//   message: "Analytics token is valid and working",
//   user_id: "3KA8DV",
//   user_name: "Your Name"
// }
```

### Fetch Portfolio

```typescript
import { GetPortfolioWithAnalyticsToken } from '../wailsjs/go/main/App';

const positions = await GetPortfolioWithAnalyticsToken();
// Returns array of positions with P&L, prices, etc.
```

### Fetch Trades

```typescript
import { GetTradesWithAnalyticsToken } from '../wailsjs/go/main/App';

const trades = await GetTradesWithAnalyticsToken();
// Returns array of executed trades
```

### Get Market Quote

```typescript
import { GetMarketQuoteWithAnalyticsToken } from '../wailsjs/go/main/App';

const quote = await GetMarketQuoteWithAnalyticsToken('RELIANCE', 'NSE');
// Returns real-time market data
```

### Get User Profile

```typescript
import { GetUserProfileWithAnalyticsToken } from '../wailsjs/go/main/App';

const profile = await GetUserProfileWithAnalyticsToken();
// Returns user account information
```

## Backend API Methods

All methods are available in `app.go`:

```go
// Check if token is configured and valid
CheckAnalyticsTokenStatus() (map[string]interface{}, error)

// Fetch portfolio positions
GetPortfolioWithAnalyticsToken() ([]broker.Position, error)

// Fetch trade history
GetTradesWithAnalyticsToken() ([]broker.Trade, error)

// Get market quote for a symbol
GetMarketQuoteWithAnalyticsToken(symbol, exchange string) (*broker.MarketQuote, error)

// Get user profile
GetUserProfileWithAnalyticsToken() (*broker.UserProfile, error)
```

## Security Best Practices

### ✅ DO

- Store token in `.env` file only
- Add `.env` to `.gitignore` (already done)
- Keep token confidential
- Revoke token if compromised
- Use static IP if available

### ❌ DON'T

- Commit `.env` to version control
- Share token publicly
- Hardcode token in source files
- Use expired tokens

## Token Management

### Checking Expiry

Your token details are in the `.env` file comments:
```env
# Created: 10/06/2026
# Expires: 10/06/2027
```

### Renewing Token

When your token expires:
1. Go to [Upstox API Apps](https://api.upstox.com/apps)
2. Revoke old token
3. Generate new Analytics Token
4. Update `.env` file with new token
5. Restart SmallSteps

### Revoking Token

If you need to revoke:
1. Visit Upstox API Apps dashboard
2. Find your app
3. Click "Revoke" next to Analytics Token
4. Generate new token if needed

## Troubleshooting

### Token Not Found

**Error:** "Analytics token not configured in .env file"

**Solution:**
1. Check `.env` file exists in root directory
2. Verify `UPSTOX_ANALYTICS_TOKEN` is set
3. Restart application

### Invalid Token

**Error:** "Token is invalid or expired"

**Solution:**
1. Check token expiry date
2. Verify token is copied correctly (no spaces/line breaks)
3. Generate new token if expired
4. Check Upstox API status

### API Errors

**Error:** "Failed to fetch..."

**Solution:**
1. Check internet connection
2. Verify Upstox API is operational
3. Check token hasn't been revoked
4. Review logs in Logs tab

## Static IP Configuration

If you configured your Analytics Token with static IP:

1. Ensure your application runs from the configured IP
2. Contact Upstox support to add/modify static IPs
3. Token will only work from whitelisted IPs

## Comparison: Analytics Token vs OAuth

| Feature | Analytics Token | OAuth |
|---------|----------------|-------|
| Validity | 1 year | Short-lived |
| Setup | Simple | Complex |
| Trading | ❌ No | ✅ Yes (future) |
| Portfolio | ✅ Yes | ✅ Yes |
| Market Data | ✅ Yes | ✅ Yes |
| Refresh | Manual (yearly) | Automatic |
| Use Case | Analysis | Full trading |

## Support

For issues:
1. Check application logs (Logs tab)
2. Verify token status
3. Review [Upstox API Documentation](https://upstox.com/developer/api-documentation)
4. Contact Upstox support for token issues

## Example .env File

```env
# Upstox Analytics Token
UPSTOX_ANALYTICS_TOKEN=eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzS0E4RFYiLCJqdGkiOiI2YTI5YTYyYmIxZmQzMDczZTlkMzUxOTUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlzRXh0ZW5kZWQiOnRydWUsImlhdCI6MTc4MTExNDQxMSwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxODEyNjY0ODAwfQ.yH9P3LN4wVnZ-T-w3MxeR0OQqu-r0Ttl1aTOdvdpqsw

# Token Details
# Created: 10/06/2026
# Expires: 10/06/2027
# Type: Analytics Token (Read-only)
```

---

**Made with Bob**