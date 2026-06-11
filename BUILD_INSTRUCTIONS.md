# Build Instructions for SmallSteps

## Prerequisites
- Go 1.18 or higher
- Node.js 16 or higher
- Wails CLI installed (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

## Building the Application

### 1. Generate Wails Bindings
The TypeScript bindings for the new Go functions need to be generated:

```bash
wails generate module
```

This will create/update the TypeScript bindings in `frontend/wailsjs/go/main/App.js` and `App.d.ts` for all the new functions:
- `AddDeposit`
- `AddWithdrawal`
- `GetCapitalTransactions`
- `GetCurrentCapitalBalance`
- `UpdateTradingSettingsWithProtection`
- `GetChecklistItems`
- `CreateChecklistItem`
- `UpdateChecklistItem`
- `DeleteChecklistItem`

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Development Build
Run the application in development mode:
```bash
wails dev
```

### 4. Production Build
Create a production build:
```bash
wails build
```

The executable will be created in the `build/bin` directory.

## New Features Implemented

### Capital Management
- Navigate to the "Capital" menu item
- Add deposits and withdrawals
- View transaction history
- Track current balance

### Capital Protection
- Go to Settings
- Enable "Capital Protection"
- Set protected capital amount
- Set minimum capital threshold

### Kill Switch
- When overtrading is detected, a warning appears
- Must check the "Enable Kill Switch" checkbox to acknowledge
- Cannot dismiss without checking the box

### Dark Mode
- Go to Settings
- Toggle "Enable Dark Mode"
- Theme preference is saved automatically

### News Links
- Navigate to "Market News"
- Quick access links to major Indian market news sources including Zerodha Pulse

## Database Migrations

The application will automatically run migrations on startup to add new tables and columns:
- `capital_transactions` table
- `checklist_items` table
- New columns in `trading_settings` table for capital protection

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors about missing exports, run:
```bash
wails generate module
```

### Database Issues
If you encounter database errors, the database file is located at:
- Windows: `C:\Users\<username>\.smallsteps\trading.db`
- Linux/Mac: `~/.smallsteps/trading.db`

You can delete this file to start fresh (all data will be lost).

### Build Errors
Make sure all Go dependencies are installed:
```bash
go mod download
go mod tidy
```

## Testing New Features

1. **Capital Management**: Add a deposit, then add a withdrawal, verify balance updates
2. **Capital Protection**: Enable in settings, set values, verify they're saved
3. **Kill Switch**: Trigger overtrading warning (make max trades), verify checkbox requirement
4. **Dark Mode**: Toggle in settings, verify theme changes and persists on reload
5. **News Links**: Click on Zerodha Pulse link, verify it opens in browser

## Notes

- The Wails bindings are generated based on exported Go functions in `app.go`
- All new database tables are created automatically on first run
- Default checklist items are initialized automatically
- Dark mode preference is stored in browser localStorage
- Kill switch state is stored in browser localStorage