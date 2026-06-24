# 🏗️ Advanced Analytics - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                    (Dashboard Component)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADVANCED ANALYTICS UI                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    KPI Cards Row                          │  │
│  │  [Avg Winner] [Avg Loser] [R:R] [Expectancy] [P.Factor] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Date Range Filter                       │  │
│  │  [Today] [Week] [Month] [Quarter] [Year] [Custom]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │  Win vs Loss Chart  │  │ Risk Reward Trend   │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ Expectancy Trend    │  │ Profit Factor Trend │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ Emotional Analysis  │  │  Mistake Analysis   │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │  Charges Impact     │  │ Holding Time        │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Mobile vs Desktop Comparison                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Trading Performance Summary Table                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WAILS BRIDGE                                │
│              (Go Backend ↔ TypeScript Frontend)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API (app.go)                        │
│                                                                   │
│  GetAdvancedAnalytics(startDate, endDate)                       │
│  GetRiskRewardTrend(months)                                     │
│  GetExpectancyTrend(months)                                     │
│  GetProfitFactorTrend(months)                                   │
│  GetEmotionalAnalysis(startDate, endDate)                       │
│  GetMistakeAnalysis(startDate, endDate)                         │
│  GetChargesImpactData(days)                                     │
│  GetHoldingTimeAnalysis(startDate, endDate)                     │
│  GetMobileVsDesktopStats(startDate, endDate)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                DATABASE LAYER (database/services.go)             │
│                                                                   │
│  GetAdvancedAnalytics()      → Complex aggregations             │
│  GetAverageWinner()          → AVG(profit_loss) WHERE > 0       │
│  GetAverageLoser()           → AVG(ABS(profit_loss)) WHERE < 0  │
│  GetRiskRewardRatio()        → Winner / Loser                   │
│  GetExpectancy()             → (WR × Winner) - (LR × Loser)     │
│  GetProfitFactor()           → Gross Profit / Gross Loss        │
│  GetMonthlyRiskReward()      → Monthly aggregations             │
│  GetMonthlyExpectancy()      → Monthly aggregations             │
│  GetMonthlyProfitFactor()    → Monthly aggregations             │
│  GetEmotionalAnalysis()      → GROUP BY emotion_before          │
│  GetMistakeAnalysis()        → Parse notes field                │
│  GetChargesImpact()          → Profit - Charges over time       │
│  GetHoldingTimeAnalysis()    → Group by holding period          │
│  GetMobileVsDesktopPerf()    → Parse notes for "mobile"         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SQLite DATABASE                               │
│                                                                   │
│  trades table:                                                   │
│    - id, date, symbol, trade_type                               │
│    - quantity, entry_price, exit_price                          │
│    - profit_loss, brokerage, other_charges                      │
│    - status, notes                                              │
│    - emotion_before, emotion_after                              │
│    - instrument_type, option_type                               │
│    - strike_price, expiry_date                                  │
│    - created_at                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Selects date range
     ▼
┌─────────────────┐
│ Date Filter UI  │
└────┬────────────┘
     │ 2. Triggers data fetch
     ▼
┌──────────────────────┐
│ AdvancedAnalytics.tsx│
└────┬─────────────────┘
     │ 3. Calls multiple APIs in parallel
     ▼
┌────────────────────────────────────────────┐
│         Parallel API Calls                 │
│  ┌──────────────────────────────────────┐ │
│  │ GetAdvancedAnalytics()               │ │
│  │ GetRiskRewardTrend()                 │ │
│  │ GetExpectancyTrend()                 │ │
│  │ GetProfitFactorTrend()               │ │
│  │ GetEmotionalAnalysis()               │ │
│  │ GetMistakeAnalysis()                 │ │
│  │ GetChargesImpactData()               │ │
│  │ GetHoldingTimeAnalysis()             │ │
│  │ GetMobileVsDesktopStats()            │ │
│  └──────────────────────────────────────┘ │
└────┬───────────────────────────────────────┘
     │ 4. Returns aggregated data
     ▼
┌──────────────────────┐
│   State Update       │
│  (React useState)    │
└────┬─────────────────┘
     │ 5. Triggers re-render
     ▼
┌──────────────────────────────────────────┐
│        Component Re-render               │
│  ┌────────────────────────────────────┐ │
│  │ KPICards (5 cards)                 │ │
│  │ Charts (9 visualizations)          │ │
│  │ PerformanceTable (summary)         │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## Component Hierarchy

```
Dashboard.tsx
│
├── AdvancedAnalytics.tsx (NEW)
│   │
│   ├── DateRangeFilter.tsx (NEW)
│   │   └── Preset buttons + Custom date picker
│   │
│   ├── KPICards.tsx (NEW)
│   │   ├── KPICard (Average Winner)
│   │   ├── KPICard (Average Loser)
│   │   ├── KPICard (Risk Reward Ratio)
│   │   ├── KPICard (Expectancy)
│   │   └── KPICard (Profit Factor)
│   │
│   ├── charts/
│   │   ├── WinLossComparison.tsx (NEW)
│   │   ├── RiskRewardTrend.tsx (NEW)
│   │   ├── ExpectancyTrend.tsx (NEW)
│   │   ├── ProfitFactorTrend.tsx (NEW)
│   │   ├── EmotionalAnalysis.tsx (NEW)
│   │   ├── MistakeAnalysis.tsx (NEW)
│   │   ├── ChargesImpact.tsx (NEW)
│   │   ├── HoldingTimeAnalysis.tsx (NEW)
│   │   └── MobileVsDesktop.tsx (NEW)
│   │
│   └── PerformanceTable.tsx (NEW)
│       └── Summary table with badges
│
└── [Existing Dashboard Components]
    ├── Stats Grid
    ├── P&L Trend Chart
    ├── Number of Trades Chart
    ├── Brokerage Chart
    ├── Win/Loss Pie Chart
    └── Today's Trades List
```

---

## Database Query Flow

```
Frontend Request
      │
      ▼
┌─────────────────────────────────────┐
│  app.go API Method                  │
│  GetAdvancedAnalytics(start, end)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  database/services.go               │
│  GetAdvancedAnalytics()             │
└──────────────┬──────────────────────┘
               │
               ├─► GetAverageWinner()
               │   └─► SQL: AVG(profit_loss) WHERE > 0
               │
               ├─► GetAverageLoser()
               │   └─► SQL: AVG(ABS(profit_loss)) WHERE < 0
               │
               ├─► GetRiskRewardRatio()
               │   └─► SQL: Winner / Loser calculation
               │
               ├─► GetExpectancy()
               │   └─► SQL: (WR × Winner) - (LR × Loser)
               │
               └─► GetProfitFactor()
                   └─► SQL: Gross Profit / Gross Loss
               │
               ▼
┌─────────────────────────────────────┐
│  Aggregate Results                  │
│  Return map[string]interface{}      │
└──────────────┬──────────────────────┘
               │
               ▼
         JSON Response
               │
               ▼
      Frontend State Update
```

---

## Key Calculations

### 1. Average Winner
```
Input:  All closed trades with profit_loss > 0
Output: AVG(profit_loss)
```

### 2. Average Loser
```
Input:  All closed trades with profit_loss < 0
Output: AVG(ABS(profit_loss))
```

### 3. Risk Reward Ratio
```
Input:  Average Winner, Average Loser
Output: Average Winner / Average Loser
Format: "1 : X.XX"
```

### 4. Expectancy
```
Input:  Win Rate, Average Winner, Average Loser
Calc:   Loss Rate = 1 - Win Rate
Output: (Win Rate × Average Winner) - (Loss Rate × Average Loser)
```

### 5. Profit Factor
```
Input:  All closed trades
Calc:   Gross Profit = SUM(profit_loss WHERE > 0)
        Gross Loss = ABS(SUM(profit_loss WHERE < 0))
Output: Gross Profit / Gross Loss
```

### 6. Win Rate
```
Input:  All closed trades
Calc:   Winning Trades = COUNT(profit_loss > 0)
        Total Trades = COUNT(*)
Output: (Winning Trades / Total Trades) × 100
```

---

## State Management Strategy

### Global State (AdvancedAnalytics.tsx)
```typescript
const [state, setState] = useState({
  loading: true,
  error: null,
  dateRange: {
    start: getDefaultStartDate(),
    end: getDefaultEndDate()
  },
  data: {
    kpi: null,
    trends: null,
    emotional: null,
    mistakes: null,
    charges: null,
    holdingTime: null,
    platform: null
  }
});
```

### Data Fetching Pattern
```typescript
useEffect(() => {
  const fetchAllData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const [kpi, trends, emotional, mistakes, charges, holding, platform] = 
        await Promise.all([
          GetAdvancedAnalytics(dateRange.start, dateRange.end),
          GetRiskRewardTrend(12),
          GetEmotionalAnalysis(dateRange.start, dateRange.end),
          GetMistakeAnalysis(dateRange.start, dateRange.end),
          GetChargesImpactData(30),
          GetHoldingTimeAnalysis(dateRange.start, dateRange.end),
          GetMobileVsDesktopStats(dateRange.start, dateRange.end)
        ]);
      
      setState(prev => ({
        ...prev,
        loading: false,
        data: { kpi, trends, emotional, mistakes, charges, holding, platform }
      }));
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error }));
    }
  };
  
  fetchAllData();
}, [dateRange]);
```

---

## Performance Optimization

### 1. Database Indexes
```sql
CREATE INDEX idx_trades_date ON trades(date);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_profit_loss ON trades(profit_loss);
CREATE INDEX idx_trades_emotion_before ON trades(emotion_before);
CREATE INDEX idx_trades_notes ON trades(notes);
```

### 2. Query Optimization
- Use prepared statements
- Combine multiple queries where possible
- Cache results for 5 minutes
- Use EXPLAIN to analyze query performance

### 3. Frontend Optimization
- Lazy load charts (only render when visible)
- Memoize expensive calculations
- Debounce date range changes (500ms)
- Use React.memo for chart components
- Virtual scrolling for large tables

### 4. Data Transfer Optimization
- Compress API responses
- Send only necessary data
- Use pagination for large datasets
- Implement incremental loading

---

## Error Handling Strategy

### Backend Errors
```go
func (d *Database) GetAdvancedAnalytics(startDate, endDate string) (map[string]interface{}, error) {
    result := make(map[string]interface{})
    
    // Handle no data case
    var count int
    err := d.DB.QueryRow("SELECT COUNT(*) FROM trades WHERE date BETWEEN ? AND ?", 
        startDate, endDate).Scan(&count)
    if err != nil {
        return nil, fmt.Errorf("failed to count trades: %w", err)
    }
    if count == 0 {
        return map[string]interface{}{
            "no_data": true,
            "message": "No trades found in selected date range"
        }, nil
    }
    
    // Continue with calculations...
}
```

### Frontend Errors
```typescript
if (error) {
  return (
    <div className="analytics-error">
      <h3>Unable to load analytics</h3>
      <p>{error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}

if (data.no_data) {
  return (
    <div className="analytics-no-data">
      <h3>No data available</h3>
      <p>No trades found in the selected date range</p>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (Backend)
```go
func TestGetAverageWinner(t *testing.T) {
    // Setup test database
    db := setupTestDB()
    defer db.Close()
    
    // Insert test data
    insertTestTrades(db, []Trade{
        {ProfitLoss: 100, Status: "CLOSED"},
        {ProfitLoss: 200, Status: "CLOSED"},
        {ProfitLoss: -50, Status: "CLOSED"},
    })
    
    // Test
    avgWinner, err := db.GetAverageWinner("2024-01-01", "2024-12-31")
    assert.NoError(t, err)
    assert.Equal(t, 150.0, avgWinner)
}
```

### Integration Tests (Frontend)
```typescript
describe('AdvancedAnalytics', () => {
  it('should display KPI cards with correct values', async () => {
    const { getByText } = render(<AdvancedAnalytics />);
    
    await waitFor(() => {
      expect(getByText('Average Winner')).toBeInTheDocument();
      expect(getByText('₹150.00')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment Checklist

- [ ] Database indexes created
- [ ] Backend functions tested
- [ ] API endpoints tested
- [ ] Frontend components tested
- [ ] Responsive design verified
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] User guide created

---

## Monitoring & Maintenance

### Metrics to Track
1. Query execution time
2. API response time
3. Frontend render time
4. Error rates
5. User engagement with analytics

### Regular Maintenance
1. Review and optimize slow queries
2. Update indexes as data grows
3. Monitor database size
4. Review user feedback
5. Add new metrics based on user needs

---

**Last Updated**: 2026-06-22  
**Version**: 1.0