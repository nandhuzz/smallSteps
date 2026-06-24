# 🚀 Advanced Analytics - Quick Start Guide

This guide provides ready-to-use code snippets to accelerate implementation.

---

## 📦 Step 1: Database Functions (database/services.go)

Add these functions to [`database/services.go`](../database/services.go):

### Basic Metrics Functions

```go
// GetAdvancedAnalytics returns comprehensive trading metrics
func (d *Database) GetAdvancedAnalytics(startDate, endDate string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	// Check if we have data
	var count int
	err := d.DB.QueryRow(`SELECT COUNT(*) FROM trades WHERE status = 'CLOSED' AND date BETWEEN ? AND ?`,
		startDate, endDate).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count == 0 {
		return map[string]interface{}{"no_data": true}, nil
	}

	// Get all metrics in one query for efficiency
	query := `
		SELECT 
			COUNT(*) as total_trades,
			COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
			COUNT(CASE WHEN profit_loss < 0 THEN 1 END) as losing_trades,
			AVG(CASE WHEN profit_loss > 0 THEN profit_loss END) as avg_winner,
			AVG(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) END) as avg_loser,
			SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
			ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)) as gross_loss,
			SUM(profit_loss) as net_profit,
			SUM(brokerage + other_charges) as total_charges
		FROM trades
		WHERE status = 'CLOSED' AND date BETWEEN ? AND ?
	`

	var totalTrades, winningTrades, losingTrades int
	var avgWinner, avgLoser, grossProfit, grossLoss, netProfit, totalCharges sql.NullFloat64

	err = d.DB.QueryRow(query, startDate, endDate).Scan(
		&totalTrades, &winningTrades, &losingTrades,
		&avgWinner, &avgLoser, &grossProfit, &grossLoss, &netProfit, &totalCharges,
	)
	if err != nil {
		return nil, err
	}

	// Calculate derived metrics
	winRate := 0.0
	if totalTrades > 0 {
		winRate = float64(winningTrades) / float64(totalTrades) * 100
	}

	riskReward := 0.0
	if avgLoser.Valid && avgLoser.Float64 > 0 && avgWinner.Valid {
		riskReward = avgWinner.Float64 / avgLoser.Float64
	}

	expectancy := 0.0
	if avgWinner.Valid && avgLoser.Valid && totalTrades > 0 {
		lossRate := float64(losingTrades) / float64(totalTrades)
		expectancy = (winRate/100 * avgWinner.Float64) - (lossRate * avgLoser.Float64)
	}

	profitFactor := 0.0
	if grossLoss.Valid && grossLoss.Float64 > 0 && grossProfit.Valid {
		profitFactor = grossProfit.Float64 / grossLoss.Float64
	}

	result["total_trades"] = totalTrades
	result["winning_trades"] = winningTrades
	result["losing_trades"] = losingTrades
	result["win_rate"] = winRate
	result["avg_winner"] = avgWinner.Float64
	result["avg_loser"] = avgLoser.Float64
	result["risk_reward"] = riskReward
	result["expectancy"] = expectancy
	result["profit_factor"] = profitFactor
	result["gross_profit"] = grossProfit.Float64
	result["gross_loss"] = grossLoss.Float64
	result["net_profit"] = netProfit.Float64
	result["total_charges"] = totalCharges.Float64

	return result, nil
}

// GetMonthlyRiskReward returns risk:reward ratio per month
func (d *Database) GetMonthlyRiskReward(months int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			strftime('%Y-%m', date) as month,
			AVG(CASE WHEN profit_loss > 0 THEN profit_loss END) as avg_winner,
			AVG(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) END) as avg_loser
		FROM trades
		WHERE status = 'CLOSED' 
			AND date >= date('now', '-' || ? || ' months')
		GROUP BY strftime('%Y-%m', date)
		ORDER BY month DESC
	`

	rows, err := d.DB.Query(query, months)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var month string
		var avgWinner, avgLoser sql.NullFloat64

		if err := rows.Scan(&month, &avgWinner, &avgLoser); err != nil {
			continue
		}

		ratio := 0.0
		if avgLoser.Valid && avgLoser.Float64 > 0 && avgWinner.Valid {
			ratio = avgWinner.Float64 / avgLoser.Float64
		}

		results = append(results, map[string]interface{}{
			"month":       month,
			"ratio":       ratio,
			"avg_winner":  avgWinner.Float64,
			"avg_loser":   avgLoser.Float64,
		})
	}

	return results, nil
}

// GetEmotionalAnalysis analyzes trades by emotion
func (d *Database) GetEmotionalAnalysis(startDate, endDate string) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			emotion_before,
			COUNT(*) as trade_count,
			COUNT(CASE WHEN profit_loss > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
			AVG(profit_loss) as avg_pl,
			SUM(profit_loss) as total_pl
		FROM trades
		WHERE status = 'CLOSED'
			AND emotion_before IS NOT NULL
			AND emotion_before != ''
			AND date BETWEEN ? AND ?
		GROUP BY emotion_before
		ORDER BY avg_pl DESC
	`

	rows, err := d.DB.Query(query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var emotion string
		var tradeCount int
		var winRate, avgPL, totalPL float64

		if err := rows.Scan(&emotion, &tradeCount, &winRate, &avgPL, &totalPL); err != nil {
			continue
		}

		results = append(results, map[string]interface{}{
			"emotion":     emotion,
			"trade_count": tradeCount,
			"win_rate":    winRate,
			"avg_pl":      avgPL,
			"total_pl":    totalPL,
		})
	}

	return results, nil
}

// GetMistakeAnalysis parses notes for common mistakes
func (d *Database) GetMistakeAnalysis(startDate, endDate string) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			CASE 
				WHEN LOWER(notes) LIKE '%mobile%' OR LOWER(notes) LIKE '%phone%' THEN 'Mobile Trading'
				WHEN LOWER(notes) LIKE '%trial%' OR LOWER(notes) LIKE '%testing%' THEN 'Trial/Testing'
				WHEN LOWER(notes) LIKE '%no plan%' OR LOWER(notes) LIKE '%unplanned%' THEN 'No Planning'
				WHEN LOWER(notes) LIKE '%revenge%' OR LOWER(notes) LIKE '%emotional%' THEN 'Revenge Trading'
				WHEN LOWER(notes) LIKE '%late entry%' OR LOWER(notes) LIKE '%missed%' THEN 'Late Entry'
				WHEN LOWER(notes) LIKE '%overtrading%' THEN 'Overtrading'
				WHEN LOWER(notes) LIKE '%fomo%' THEN 'FOMO'
				WHEN LOWER(notes) LIKE '%greed%' THEN 'Greed'
			END as mistake_type,
			COUNT(*) as frequency,
			SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as total_loss,
			AVG(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as avg_loss,
			SUM(profit_loss) as net_impact
		FROM trades
		WHERE status = 'CLOSED'
			AND notes IS NOT NULL
			AND notes != ''
			AND date BETWEEN ? AND ?
		GROUP BY mistake_type
		HAVING mistake_type IS NOT NULL
		ORDER BY total_loss DESC
		LIMIT 10
	`

	rows, err := d.DB.Query(query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var mistakeType string
		var frequency int
		var totalLoss, avgLoss, netImpact float64

		if err := rows.Scan(&mistakeType, &frequency, &totalLoss, &avgLoss, &netImpact); err != nil {
			continue
		}

		results = append(results, map[string]interface{}{
			"mistake":    mistakeType,
			"frequency":  frequency,
			"total_loss": totalLoss,
			"avg_loss":   avgLoss,
			"net_impact": netImpact,
		})
	}

	return results, nil
}

// GetMobileVsDesktopPerformance compares mobile vs desktop trading
func (d *Database) GetMobileVsDesktopPerformance(startDate, endDate string) (map[string]interface{}, error) {
	query := `
		SELECT 
			CASE 
				WHEN LOWER(notes) LIKE '%mobile%' OR LOWER(notes) LIKE '%phone%' THEN 'Mobile'
				ELSE 'Desktop'
			END as platform,
			COUNT(*) as trade_count,
			COUNT(CASE WHEN profit_loss > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
			SUM(profit_loss) as net_pl,
			AVG(profit_loss) as avg_pl
		FROM trades
		WHERE status = 'CLOSED'
			AND date BETWEEN ? AND ?
		GROUP BY platform
	`

	rows, err := d.DB.Query(query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]interface{})
	for rows.Next() {
		var platform string
		var tradeCount int
		var winRate, netPL, avgPL float64

		if err := rows.Scan(&platform, &tradeCount, &winRate, &netPL, &avgPL); err != nil {
			continue
		}

		result[platform] = map[string]interface{}{
			"trade_count": tradeCount,
			"win_rate":    winRate,
			"net_pl":      netPL,
			"avg_pl":      avgPL,
		}
	}

	return result, nil
}
```

---

## 🔌 Step 2: Backend API (app.go)

Add these methods to [`app.go`](../app.go):

```go
// Advanced Analytics API Methods

func (a *App) GetAdvancedAnalytics(startDate, endDate string) (map[string]interface{}, error) {
	return a.db.GetAdvancedAnalytics(startDate, endDate)
}

func (a *App) GetRiskRewardTrend(months int) ([]map[string]interface{}, error) {
	return a.db.GetMonthlyRiskReward(months)
}

func (a *App) GetEmotionalAnalysis(startDate, endDate string) ([]map[string]interface{}, error) {
	return a.db.GetEmotionalAnalysis(startDate, endDate)
}

func (a *App) GetMistakeAnalysis(startDate, endDate string) ([]map[string]interface{}, error) {
	return a.db.GetMistakeAnalysis(startDate, endDate)
}

func (a *App) GetMobileVsDesktopStats(startDate, endDate string) (map[string]interface{}, error) {
	return a.db.GetMobileVsDesktopPerformance(startDate, endDate)
}
```

---

## 🎨 Step 3: Frontend Component (AdvancedAnalytics.tsx)

Create [`frontend/src/components/Dashboard/AdvancedAnalytics.tsx`](../frontend/src/components/Dashboard/AdvancedAnalytics.tsx):

```typescript
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { 
  GetAdvancedAnalytics, 
  GetRiskRewardTrend,
  GetEmotionalAnalysis,
  GetMistakeAnalysis,
  GetMobileVsDesktopStats
} from '../../../wailsjs/go/main/App';
import './AdvancedAnalytics.css';

interface KPIData {
  avg_winner: number;
  avg_loser: number;
  risk_reward: number;
  expectancy: number;
  profit_factor: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  gross_profit: number;
  gross_loss: number;
  net_profit: number;
  total_charges: number;
}

interface DateRange {
  start: string;
  end: string;
}

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: getMonthStart(),
    end: getTodayDate()
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await GetAdvancedAnalytics(dateRange.start, dateRange.end);
      setKpiData(data as KPIData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!kpiData || kpiData.total_trades === 0) {
    return <div className="analytics-no-data">No data available for selected period</div>;
  }

  return (
    <div className="advanced-analytics">
      <h2>📊 Advanced Trading Analytics</h2>
      
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          icon="📈"
          label="Average Winner"
          value={`₹${kpiData.avg_winner.toFixed(2)}`}
          status="positive"
        />
        <KPICard
          icon="📉"
          label="Average Loser"
          value={`₹${kpiData.avg_loser.toFixed(2)}`}
          status="negative"
        />
        <KPICard
          icon="⚖️"
          label="Risk Reward"
          value={`1 : ${kpiData.risk_reward.toFixed(2)}`}
          status={getRiskRewardStatus(kpiData.risk_reward)}
        />
        <KPICard
          icon="🎯"
          label="Expectancy"
          value={`₹${kpiData.expectancy.toFixed(2)}`}
          status={kpiData.expectancy > 0 ? 'positive' : 'negative'}
        />
        <KPICard
          icon="💎"
          label="Profit Factor"
          value={kpiData.profit_factor.toFixed(2)}
          status={getProfitFactorStatus(kpiData.profit_factor)}
        />
      </div>

      {/* Performance Summary Table */}
      <PerformanceTable data={kpiData} />
    </div>
  );
};

// Helper Components
const KPICard = ({ icon, label, value, status }: any) => (
  <div className={`kpi-card kpi-${status}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-content">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  </div>
);

const PerformanceTable = ({ data }: { data: KPIData }) => (
  <div className="performance-table">
    <h3>Trading Performance Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Win Rate</td>
          <td>{data.win_rate.toFixed(1)}%</td>
          <td><Badge status={getWinRateStatus(data.win_rate)} /></td>
        </tr>
        <tr>
          <td>Average Winner</td>
          <td>₹{data.avg_winner.toFixed(2)}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Average Loser</td>
          <td>₹{data.avg_loser.toFixed(2)}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Risk Reward Ratio</td>
          <td>1:{data.risk_reward.toFixed(2)}</td>
          <td><Badge status={getRiskRewardStatus(data.risk_reward)} /></td>
        </tr>
        <tr>
          <td>Profit Factor</td>
          <td>{data.profit_factor.toFixed(2)}</td>
          <td><Badge status={getProfitFactorStatus(data.profit_factor)} /></td>
        </tr>
        <tr>
          <td>Expectancy</td>
          <td>₹{data.expectancy.toFixed(2)}</td>
          <td><Badge status={data.expectancy > 0 ? 'good' : 'poor'} /></td>
        </tr>
        <tr>
          <td>Gross Profit</td>
          <td>₹{data.gross_profit.toFixed(2)}</td>
          <td><Badge status="good" /></td>
        </tr>
        <tr>
          <td>Gross Loss</td>
          <td>₹{data.gross_loss.toFixed(2)}</td>
          <td><Badge status="poor" /></td>
        </tr>
        <tr>
          <td>Net Profit</td>
          <td>₹{data.net_profit.toFixed(2)}</td>
          <td><Badge status={data.net_profit > 0 ? 'good' : 'poor'} /></td>
        </tr>
        <tr>
          <td>Total Charges</td>
          <td>₹{data.total_charges.toFixed(2)}</td>
          <td><Badge status="warning" /></td>
        </tr>
      </tbody>
    </table>
  </div>
);

const Badge = ({ status }: { status: string }) => (
  <span className={`badge badge-${status}`}>
    {status === 'good' && '🟢'}
    {status === 'fair' && '🟡'}
    {status === 'warning' && '🟠'}
    {status === 'poor' && '🔴'}
  </span>
);

// Helper Functions
function getMonthStart(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function getTodayDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function getRiskRewardStatus(ratio: number): string {
  if (ratio > 1.5) return 'good';
  if (ratio >= 1) return 'fair';
  return 'poor';
}

function getProfitFactorStatus(factor: number): string {
  if (factor > 2) return 'good';
  if (factor >= 1.5) return 'fair';
  if (factor >= 1) return 'warning';
  return 'poor';
}

function getWinRateStatus(rate: number): string {
  if (rate > 60) return 'good';
  if (rate >= 50) return 'fair';
  return 'poor';
}

export default AdvancedAnalytics;
```

---

## 🎨 Step 4: Styles (AdvancedAnalytics.css)

Create [`frontend/src/components/Dashboard/AdvancedAnalytics.css`](../frontend/src/components/Dashboard/AdvancedAnalytics.css):

```css
.advanced-analytics {
  padding: 20px;
  background: var(--bg-primary);
}

.advanced-analytics h2 {
  margin: 0 0 24px 0;
  color: var(--text-primary);
  font-size: 28px;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.kpi-icon {
  font-size: 40px;
}

.kpi-content {
  flex: 1;
}

.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.kpi-positive .kpi-value {
  color: #4CAF50;
}

.kpi-negative .kpi-value {
  color: #f44336;
}

.kpi-good .kpi-value {
  color: #4CAF50;
}

.kpi-fair .kpi-value {
  color: #FF9800;
}

.kpi-poor .kpi-value {
  color: #f44336;
}

/* Performance Table */
.performance-table {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-top: 30px;
}

.performance-table h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: var(--text-primary);
}

.performance-table table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table th {
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
}

.performance-table td {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.performance-table tr:last-child td {
  border-bottom: none;
}

.performance-table tr:hover {
  background: var(--bg-tertiary);
}

/* Badges */
.badge {
  display: inline-block;
  font-size: 18px;
}

/* Loading & No Data States */
.analytics-loading,
.analytics-no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: 18px;
  color: var(--text-secondary);
}
```

---

## 🔗 Step 5: Integration

Update [`Dashboard.tsx`](../frontend/src/components/Dashboard/Dashboard.tsx) to include the new component:

```typescript
import AdvancedAnalytics from './AdvancedAnalytics';

// Inside the Dashboard component, add after existing charts:
return (
  <div className="dashboard">
    {/* Existing dashboard content */}
    
    {/* Add Advanced Analytics */}
    <AdvancedAnalytics />
  </div>
);
```

---

## ✅ Testing Checklist

- [ ] Backend functions compile without errors
- [ ] API endpoints return correct data
- [ ] Frontend component renders without errors
- [ ] KPI cards display correct values
- [ ] Performance table shows all metrics
- [ ] Styles are applied correctly
- [ ] Date range filtering works
- [ ] No data state displays properly
- [ ] Loading state displays properly

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution**: Run `wails generate` to regenerate TypeScript bindings

### Issue: Incorrect calculations
**Solution**: Check SQL queries with sample data, verify NULL handling

### Issue: Styles not applying
**Solution**: Ensure CSS file is imported, check CSS variable definitions

### Issue: Slow performance
**Solution**: Add database indexes, implement caching

---

## 📚 Next Steps

1. Implement remaining charts (see ADVANCED_ANALYTICS_PLAN.md)
2. Add date range filtering component
3. Implement emotional analysis chart
4. Add mistake analysis visualization
5. Create mobile vs desktop comparison
6. Add export functionality

---

**Quick Start Complete!** 🎉

You now have the foundation for advanced analytics. Continue with the full implementation plan for complete functionality.