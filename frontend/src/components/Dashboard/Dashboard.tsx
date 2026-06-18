import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
// @ts-ignore - Recharts is designed for React but works with Preact
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GetTodayTrades, GetMonthlyStats, GetDailyPLData, GetWeeklyPLData, GetMonthlyPLData, GetPerTradePLData } from '../../../wailsjs/go/main/App';
import { database } from '../../../wailsjs/go/models';
import './Dashboard.css';

type Trade = database.Trade;

interface Stats {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    total_pl: number;
    total_charges: number;
}

interface DailyData {
    date: string;
    trade_count: number;
    profit: number;
    loss: number;
    net_pl: number;
    total_charges: number;
    trade_id?: number;
    symbol?: string;
    trade_type?: string;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'per_trade';

const Dashboard = () => {
    const [todayTrades, setTodayTrades] = useState<Trade[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [timePeriod]);

    const loadData = async () => {
        try {
            let plData;
            if (timePeriod === 'daily') {
                plData = await GetDailyPLData(30); // Last 30 days
            } else if (timePeriod === 'weekly') {
                plData = await GetWeeklyPLData(12); // Last 12 weeks
            } else if (timePeriod === 'monthly') {
                plData = await GetMonthlyPLData(12); // Last 12 months
            } else {
                plData = await GetPerTradePLData(0); // Per trade for last day
            }

            const [trades, monthStats] = await Promise.all([
                GetTodayTrades(),
                GetMonthlyStats()
            ]);
            
            setTodayTrades((trades || []) as Trade[]);
            setStats(monthStats as Stats);
            setDailyData((plData || []) as DailyData[]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimePeriodChange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        setTimePeriod(target.value as TimePeriod);
    };

    if (loading) {
        return <div className="dashboard loading">Loading dashboard...</div>;
    }

    const winRate = stats && stats.total_trades > 0 
        ? ((stats.winning_trades / stats.total_trades) * 100).toFixed(1)
        : '0';

    const pieData = stats ? [
        { name: 'Winning', value: stats.winning_trades, color: '#4CAF50' },
        { name: 'Losing', value: stats.losing_trades, color: '#f44336' }
    ] : [];

    const todayPL = todayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Trading Dashboard</h1>
                <p className="date">{new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>
           
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Today's Trades</h3>
                        <p className="stat-value">{todayTrades.length}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Today's P&L</h3>
                        <p className={`stat-value ${todayPL >= 0 ? 'positive' : 'negative'}`}>
                            ₹{todayPL.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>Monthly Trades</h3>
                        <p className="stat-value">{stats?.total_trades || 0}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <h3>Win Rate</h3>
                        <p className="stat-value">{winRate}%</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <h3>Monthly P&L</h3>
                        <p className={`stat-value ${(stats?.total_pl || 0) >= 0 ? 'positive' : 'negative'}`}>
                            ₹{(stats?.total_pl || 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💸</div>
                    <div className="stat-content">
                        <h3>Total Charges</h3>
                        <p className="stat-value negative">₹{(stats?.total_charges || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="chart-header">
                        <h3>📈 Profit & Loss Trend</h3>
                        <select
                            className="time-period-selector"
                            value={timePeriod}
                            onChange={handleTimePeriodChange}
                        >
                            <option value="daily">Daily (Last 30 Days)</option>
                            <option value="weekly">Weekly (Last 12 Weeks)</option>
                            <option value="monthly">Monthly (Last 12 Months)</option>
                            <option value="per_trade">Per Trade (1 Day)</option>
                        </select>
                    </div>
                    {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* @ts-ignore - Recharts compatibility with Preact */}
                            <LineChart data={dailyData}>
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <CartesianGrid strokeDasharray="3 3" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <XAxis dataKey="date" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <YAxis />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Tooltip />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Legend />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Line type="monotone" dataKey="net_pl" stroke="#2196F3" name="Net P&L" strokeWidth={2} />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Line type="monotone" dataKey="profit" stroke="#4CAF50" name="Profit" strokeWidth={2} />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Line type="monotone" dataKey="loss" stroke="#f44336" name="Loss" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">No data available for the last 30 days</div>
                    )}
                </div>

                <div className="chart-card">
                    <h3>📊 Number of Trades (Last 30 Days)</h3>
                    {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* @ts-ignore - Recharts compatibility with Preact */}
                            <BarChart data={dailyData}>
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <CartesianGrid strokeDasharray="3 3" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <XAxis dataKey="date" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <YAxis />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Tooltip />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Legend />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Bar dataKey="trade_count" fill="#667eea" name="Trades" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">No data available</div>
                    )}
                </div>

                <div className="chart-card">
                    <h3>💸 Brokerage & Charges (Last 30 Days)</h3>
                    {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* @ts-ignore - Recharts compatibility with Preact */}
                            <LineChart data={dailyData}>
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <CartesianGrid strokeDasharray="3 3" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <XAxis dataKey="date" />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <YAxis />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Tooltip />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Legend />
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Line type="monotone" dataKey="total_charges" stroke="#FF9800" name="Total Charges" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">No data available</div>
                    )}
                </div>

                <div className="chart-card">
                    <h3>Win/Loss Distribution</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            {/* @ts-ignore - Recharts compatibility with Preact */}
                            <PieChart>
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => {
                                        // @ts-ignore - Recharts compatibility with Preact
                                        return <Cell key={`cell-${index}`} fill={entry.color} />;
                                    })}
                                </Pie>
                                {/* @ts-ignore - Recharts compatibility with Preact */}
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">No trades data available</div>
                    )}
                </div>

                <div className="chart-card">
                    <h3>Today's Trades</h3>
                    {todayTrades.length > 0 ? (
                        <div className="trades-list">
                            {todayTrades.map(trade => (
                                <div key={trade.id} className="trade-item">
                                    <span className="trade-symbol">{trade.symbol}</span>
                                    <span className={`trade-type ${trade.trade_type.toLowerCase()}`}>
                                        {trade.trade_type}
                                    </span>
                                    <span className={`trade-pl ${(trade.profit_loss || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        ₹{(trade.profit_loss || 0).toFixed(2)}
                                    </span>
                                    <span className={`trade-status ${trade.status.toLowerCase()}`}>
                                        {trade.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data">No trades today</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

// Made with Bob
