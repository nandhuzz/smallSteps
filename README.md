# SmallSteps - Trading & Emotion Control Desktop Application

A comprehensive Windows desktop application built with Wails and React TypeScript to help traders track their trading activities, manage emotions, and maintain discipline.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

### Core Features
- **📊 Trading Dashboard** - Real-time overview of trades, P&L, and statistics
- **✅ Daily Checklist** - Pre-trading routine to ensure mental readiness
- **📅 Weekly Checklist** - Weekly performance review and strategy analysis
- **💹 Trade Entry** - Log trades with emotion tracking and validation
- **📈 Trade History** - Complete trade log with filtering and analysis
- **📝 Task Management** - Track trading-related tasks and to-dos
- **🎯 Goal Tracker** - Set financial goals and track progress
- **📰 Market News** - Latest Indian market news integration
- **🔗 Broker Integration** - Upstox Analytics Token support for portfolio sync
- **⚙️ Settings** - Configure trading limits and preferences
- **📋 System Logs** - Comprehensive activity logging

### Key Capabilities
- **Overtrading Prevention** - Automatic alerts when limits are exceeded
- **Emotion Tracking** - Record emotions before and after trades
- **P&L Calculation** - Automatic profit/loss calculation with charges
- **Goal-Based Trading** - Contribute profits to specific financial goals
- **Local SQLite Database** - All data stored locally and securely
- **Indian Market Focus** - Tailored for Indian stock market traders

## 🚀 Getting Started

### Prerequisites

1. **Go** (version 1.23 or higher)
   ```bash
   # Download from https://golang.org/dl/
   ```

2. **Node.js** (version 16 or higher)
   ```bash
   # Download from https://nodejs.org/
   ```

3. **Wails CLI**
   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```

### Installation

1. **Clone the repository**
   ```bash
   cd d:/Project/smallSteps
   ```

2. **Install Go dependencies**
   ```bash
   go mod tidy
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Development Mode (with hot reload)
```bash
wails dev
```

#### Production Build
```bash
# Build for Windows
wails build

# The executable will be in build/bin/smallSteps.exe
```

## 📁 Project Structure

```
smallSteps/
├── main.go                 # Application entry point
├── app.go                  # Main application logic and API methods
├── database/
│   ├── database.go        # Database initialization and models
│   └── services.go        # CRUD operations and business logic
├── frontend/
│   ├── src/
│   │   ├── app.tsx        # Main React app with routing
│   │   ├── App.css        # Global styles
│   │   └── components/
│   │       ├── Dashboard/      # Trading dashboard
│   │       ├── Checklists/     # Daily & weekly checklists
│   │       ├── Trading/        # Trade entry & history
│   │       ├── Tasks/          # Task management
│   │       ├── Goals/          # Goal tracking
│   │       ├── News/           # Market news
│   │       ├── Settings/       # App settings
│   │       ├── Logs/           # System logs
│   │       ├── Broker/         # Upstox integration
│   │       └── Sidebar/        # Navigation sidebar
│   └── package.json
├── broker/
│   └── upstox.go          # Upstox API client
├── build/                  # Build artifacts
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── IMPLEMENTATION_GUIDE.md # Detailed implementation guide
├── UPSTOX_INTEGRATION.md   # Upstox OAuth integration guide
├── UPSTOX_ANALYTICS_TOKEN.md # Analytics Token setup guide
└── README.md              # This file
```

## 🗄️ Database Schema

The application uses SQLite with the following tables:

- **trades** - Trading transactions with P&L
- **daily_checklist** - Daily pre-trading checklist
- **weekly_checklist** - Weekly review checklist
- **trade_entry_checklist** - Pre-trade validation
- **tasks** - Task management
- **goals** - Financial goal tracking
- **goal_contributions** - Link trades to goals
- **trading_logs** - System activity logs
- **trading_settings** - Trading limits configuration

Database location: `C:\Users\<username>\.smallsteps\trading.db`

## 🎨 Technology Stack

### Backend
- **Go** - Backend language
- **Wails v2** - Desktop application framework
- **SQLite** - Local database
- **mattn/go-sqlite3** - SQLite driver

### Frontend
- **Preact** - Lightweight React alternative
- **TypeScript** - Type-safe JavaScript
- **Preact Router** - Client-side routing
- **Recharts** - Data visualization
- **date-fns** - Date manipulation

## 📊 Current Implementation Status

### ✅ Completed
- [x] Database schema and models
- [x] All backend services and API methods
- [x] Frontend routing structure
- [x] Sidebar navigation
- [x] Dashboard with charts and statistics
- [x] Daily checklist component
- [x] Weekly checklist implementation
- [x] Trade entry form with validation
- [x] Trade history with filters
- [x] Task management interface
- [x] Goal tracker with progress bars
- [x] News display component
- [x] Settings configuration page
- [x] Logs viewer with filtering
- [x] Overtrading detection system
- [x] Indian market news integration
- [x] Comprehensive logging system
- [x] Global styling and design system
- [x] **Dark mode support** 🌙
- [x] **Unit tests for backend (Go)**
- [x] **Integration tests**
- [x] **Frontend tests (Vitest)**

See `IMPLEMENTATION_GUIDE.md` for detailed implementation instructions.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Upstox Analytics Token (optional)
UPSTOX_ANALYTICS_TOKEN=your_token_here
```

**Upstox Integration:**
- See [UPSTOX_ANALYTICS_TOKEN.md](UPSTOX_ANALYTICS_TOKEN.md) for setup guide
- Get your token from [Upstox API Apps](https://api.upstox.com/apps)
- Provides read-only access to portfolio, trades, and market data

### Trading Limits
Configure in Settings (default values):
- Max trades per day: 5
- Max loss per day: ₹5,000
- Max loss per trade: ₹1,000

### News API
To enable real market news:
1. Get a free API key from [NewsAPI.org](https://newsapi.org/)
2. Update `app.go` line 199 with your API key
3. Rebuild the application

## 📖 Usage Guide

### Daily Workflow
1. **Morning Routine**
   - Open Daily Checklist
   - Complete all 6 items before trading
   - Review market news

2. **During Trading**
   - Use Trade Entry for each trade
   - Complete pre-entry checklist
   - Record emotions before trading
   - Monitor dashboard for overtrading alerts

3. **After Trading**
   - Close open trades with exit prices
   - Record emotions after trading
   - Review P&L in dashboard
   - Update tasks if needed

4. **Weekly Review**
   - Complete Weekly Checklist
   - Analyze performance
   - Adjust strategy
   - Update goals

## 🛡️ Security & Privacy

- All data stored locally on your computer
- No cloud synchronization or data transmission
- Database encrypted at rest (optional)
- No personal information collected
- Open source - audit the code yourself

## 🐛 Troubleshooting

### TypeScript Errors
Run `wails dev` or `wails build` first to generate Go bindings. TypeScript errors will resolve after bindings are generated.

### Database Issues
Delete the database file and restart:
```bash
# Windows
del C:\Users\<username>\.smallsteps\trading.db
```

### Build Errors
```bash
# Clean and rebuild
wails clean
go mod tidy
cd frontend && npm install && cd ..
wails build
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Anandhu N V**
- Email: anandhu7299@gmail.com

## 🙏 Acknowledgments

- [Wails](https://wails.io/) - Amazing Go + Web framework
- [Preact](https://preactjs.com/) - Fast React alternative
- [Recharts](https://recharts.org/) - Beautiful charts
- [SQLite](https://www.sqlite.org/) - Reliable database

## 📚 Additional Resources

- [Wails Documentation](https://wails.io/docs/introduction)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Upstox Analytics Token Guide](./UPSTOX_ANALYTICS_TOKEN.md)
- [Upstox OAuth Integration](./UPSTOX_INTEGRATION.md)
- [Go Documentation](https://golang.org/doc/)
- [Preact Documentation](https://preactjs.com/)

## 🧪 Testing

### Backend Tests (Go)

Run all backend tests:
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...

# Run specific test file
go test ./database/database_test.go
go test ./app_test.go
go test ./integration_test.go
```

### Frontend Tests (Vitest)

Run frontend tests:
```bash
cd frontend

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Note:** Install test dependencies first:
```bash
cd frontend
npm install
```

## 🌙 Dark Mode

The application now supports dark mode!

### Enabling Dark Mode

Dark mode can be toggled from the Settings page. The preference is saved in localStorage and persists across sessions.

### Features
- Automatic theme switching
- CSS variables for consistent theming
- All components support dark mode
- Smooth transitions between themes
- Accessible color contrast ratios

### CSS Variables

The app uses CSS custom properties for theming:
- Light mode: Default colors
- Dark mode: Activated via `.dark-mode` class on `<html>` element

See `frontend/src/style.css` for all theme variables.

## 🔮 Future Enhancements

- [ ] Data export to CSV/PDF
- [ ] Backup and restore functionality
- [ ] Mobile companion app
- [ ] Advanced analytics and reports
- [ ] Trading journal with screenshots
- [ ] Multi-user support
- [ ] Cloud sync (optional)
- [ ] Performance optimization
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: anandhu7299@gmail.com

---

**Built with ❤️ for disciplined traders**

*Remember: The goal is not just profit, but consistent, disciplined, and emotionally controlled trading.*
