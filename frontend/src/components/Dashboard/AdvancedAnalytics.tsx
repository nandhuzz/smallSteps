import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  GetAdvancedAnalytics,
  GetRiskRewardTrend,
  GetExpectancyTrend,
  GetProfitFactorTrend,
  GetEmotionalAnalysis,
  GetMistakeAnalysis,
  GetChargesImpactData,
  GetHoldingTimeAnalysis,
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
  no_data?: boolean;
}

interface DateRange {
  start: string;
  end: string;
}

interface TrendData {
  month: string;
  ratio?: number;
  expectancy?: number;
  profit_factor?: number;
}

interface EmotionData {
  emotion: string;
  trade_count: number;
  win_rate: number;
  avg_pl: number;
  total_pl: number;
}

interface MistakeData {
  mistake: string;
  frequency: number;
  total_loss: number;
  avg_loss: number;
  net_impact: number;
}

interface ChargesData {
  date: string;
  gross_profit: number;
  total_charges: number;
  net_profit: number;
}

interface HoldingData {
  period: string;
  trade_count: number;
  win_rate: number;
  avg_winner: number;
  avg_loser: number;
  avg_pl: number;
}

interface PlatformData {
  Mobile?: {
    trade_count: number;
    win_rate: number;
    net_pl: number;
    avg_pl: number;
  };
  Desktop?: {
    trade_count: number;
    win_rate: number;
    net_pl: number;
    avg_pl: number;
  };
}

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [riskRewardTrend, setRiskRewardTrend] = useState<TrendData[]>([]);
  const [expectancyTrend, setExpectancyTrend] = useState<TrendData[]>([]);
  const [profitFactorTrend, setProfitFactorTrend] = useState<TrendData[]>([]);
  const [emotionalData, setEmotionalData] = useState<EmotionData[]>([]);
  const [mistakeData, setMistakeData] = useState<MistakeData[]>([]);
  const [chargesData, setChargesData] = useState<ChargesData[]>([]);
  const [holdingData, setHoldingData] = useState<HoldingData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformData>({});
  const [dateRange, setDateRange] = useState<DateRange>({
    start: getMonthStart(),
    end: getTodayDate()
  });
  const [activeDate, setActiveDate] = useState<String>("month")

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [kpi, rrTrend, expTrend, pfTrend, emotional, mistakes, charges, holding, platform] =
        await Promise.all([
          GetAdvancedAnalytics(dateRange.start, dateRange.end),
          GetRiskRewardTrend(12),
          GetExpectancyTrend(12),
          GetProfitFactorTrend(12),
          GetEmotionalAnalysis(dateRange.start, dateRange.end),
          GetMistakeAnalysis(dateRange.start, dateRange.end),
          GetChargesImpactData(30),
          GetHoldingTimeAnalysis(dateRange.start, dateRange.end),
          GetMobileVsDesktopStats(dateRange.start, dateRange.end)
        ]);

      setKpiData(kpi as KPIData);
      setRiskRewardTrend((rrTrend as TrendData[]).reverse());
      setExpectancyTrend((expTrend as TrendData[]).reverse());
      setProfitFactorTrend((pfTrend as TrendData[]).reverse());
      setEmotionalData(emotional as EmotionData[]);
      setMistakeData(mistakes as MistakeData[]);
      setChargesData(charges as ChargesData[]);
      setHoldingData(holding as HoldingData[]);
      setPlatformData(platform as PlatformData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setActiveDate(preset)
    const today = getTodayDate();
    let start = today;

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = getDateDaysAgo(7);
        break;
      case 'month':
        start = getMonthStart();
        break;
      case 'quarter':
        start = getDateDaysAgo(90);
        break;
      case 'year':
        start = getYearStart();
        break;
    }

    setDateRange({ start, end: today });
  };

  if (loading) {
    return <div className="analytics-loading">Loading advanced analytics...</div>;
  }

  const DateFilter = () => {
    const dateFilters = [
      { label: "Today", value: "today" },
      { label: "Week", value: "week" },
      { label: "Month", value: "month" },
      { label: "Quarter", value: "quarter" },
      { label: "Year", value: "year" },
    ];

    return (
      <div className="analytics-header">
        <h2>📊 Advanced Trading Analytics</h2>

        <div className="date-filter">
          {dateFilters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handlePresetChange(value)}
              className={activeDate === value ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!kpiData || kpiData.no_data || kpiData.total_trades === 0) {
    return (
      <div className="advanced-analytics">
        <DateFilter />
        <div className="analytics-no-data">
          <h3>📊 No Data Available</h3>
          <p>No closed trades found in the selected date range</p>
        </div>
      </div>

    );
  }

  return (
    <div className="advanced-analytics">
      <DateFilter />

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

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Win vs Loss Comparison */}
        <div className="chart-card">
          <h3>📊 Average Win vs Loss</h3>
          <ResponsiveContainer width="100%" height={250}>
            {/* @ts-ignore */}
            <BarChart data={[
              { name: 'Average Winner', value: kpiData.avg_winner },
              { name: 'Average Loser', value: kpiData.avg_loser }
            ]} layout="vertical">
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis type="number" />
              {/* @ts-ignore */}
              <YAxis type="category" dataKey="name" />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Reward Trend */}
        <div className="chart-card">
          <h3>📈 Risk Reward Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            {/* @ts-ignore */}
            <LineChart data={riskRewardTrend}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="month" />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Legend />
              {/* @ts-ignore */}
              <Line type="monotone" dataKey="ratio" stroke="#667eea" strokeWidth={2} name="Risk:Reward" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expectancy Trend */}
        <div className="chart-card">
          <h3>🎯 Expectancy Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            {/* @ts-ignore */}
            <AreaChart data={expectancyTrend}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="month" />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Area type="monotone" dataKey="expectancy" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Factor Trend */}
        <div className="chart-card">
          <h3>💎 Profit Factor Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            {/* @ts-ignore */}
            <LineChart data={profitFactorTrend}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="month" />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Line type="monotone" dataKey="profit_factor" stroke="#FF9800" strokeWidth={2} name="Profit Factor" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Emotional Analysis */}
        {emotionalData.length > 0 && (
          <div className="chart-card">
            <h3>😊 Emotional Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              {/* @ts-ignore */}
              <BarChart data={emotionalData}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis dataKey="emotion" />
                {/* @ts-ignore */}
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Legend />
                {/* @ts-ignore */}
                <Bar dataKey="avg_pl" fill="#667eea" name="Avg P&L" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mistake Analysis */}
        {mistakeData.length > 0 && (
          <div className="chart-card">
            <h3>⚠️ Top Mistakes</h3>
            <ResponsiveContainer width="100%" height={250}>
              {/* @ts-ignore */}
              <BarChart data={mistakeData} layout="vertical">
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis type="number" />
                {/* @ts-ignore */}
                <YAxis type="category" dataKey="mistake" width={120} />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Bar dataKey="total_loss" fill="#f44336" name="Total Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charges Impact */}
        {chargesData.length > 0 && (
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <h3>💸 Charges Impact</h3>
            <ResponsiveContainer width="100%" height={250}>
              {/* @ts-ignore */}
              <AreaChart data={chargesData}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis dataKey="date" />
                {/* @ts-ignore */}
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Legend />
                {/* @ts-ignore */}
                <Area type="monotone" dataKey="gross_profit" stackId="1" stroke="#4CAF50" fill="#4CAF50" name="Gross Profit" />
                {/* @ts-ignore */}
                <Area type="monotone" dataKey="total_charges" stackId="1" stroke="#FF9800" fill="#FF9800" name="Charges" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Holding Time Analysis */}
        {holdingData.length > 0 && (
          <div className="chart-card">
            <h3>⏱️ Holding Time Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              {/* @ts-ignore */}
              <BarChart data={holdingData}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* @ts-ignore */}
                <XAxis dataKey="period" />
                {/* @ts-ignore */}
                <YAxis />
                {/* @ts-ignore */}
                <Tooltip />
                {/* @ts-ignore */}
                <Legend />
                {/* @ts-ignore */}
                <Bar dataKey="avg_pl" fill="#667eea" name="Avg P&L" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mobile vs Desktop */}
        {(platformData.Mobile || platformData.Desktop) && (
          <div className="chart-card">
            <h3>📱 Mobile vs Desktop</h3>
            <div className="platform-comparison">
              {platformData.Mobile && (
                <div className="platform-card mobile">
                  <h4>📱 Mobile</h4>
                  <div className="platform-stats">
                    <div className="stat">
                      <span className="label">Trades:</span>
                      <span className="value">{platformData.Mobile.trade_count}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Win Rate:</span>
                      <span className="value">{platformData.Mobile.win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Net P&L:</span>
                      <span className={`value ${platformData.Mobile.net_pl >= 0 ? 'positive' : 'negative'}`}>
                        ₹{platformData.Mobile.net_pl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {platformData.Desktop && (
                <div className="platform-card desktop">
                  <h4>💻 Desktop</h4>
                  <div className="platform-stats">
                    <div className="stat">
                      <span className="label">Trades:</span>
                      <span className="value">{platformData.Desktop.trade_count}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Win Rate:</span>
                      <span className="value">{platformData.Desktop.win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Net P&L:</span>
                      <span className={`value ${platformData.Desktop.net_pl >= 0 ? 'positive' : 'negative'}`}>
                        ₹{platformData.Desktop.net_pl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
    <h3>📋 Trading Performance Summary</h3>
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
        <tr>
          <td>Total Trades</td>
          <td>{data.total_trades}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Winning Trades</td>
          <td>{data.winning_trades}</td>
          <td><Badge status="good" /></td>
        </tr>
        <tr>
          <td>Losing Trades</td>
          <td>{data.losing_trades}</td>
          <td><Badge status="poor" /></td>
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

function getYearStart(): string {
  const date = new Date();
  return `${date.getFullYear()}-01-01`;
}

function getTodayDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
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

// Made with Bob