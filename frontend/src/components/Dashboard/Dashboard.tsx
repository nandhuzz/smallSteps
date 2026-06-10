import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
// @ts-ignore - Recharts is designed for React but works with Preact
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GetTodayTrades, GetMonthlyStats, CheckOvertrading } from '../../../wailsjs/go/main/App';
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

const Dashboard = () => {
    const [todayTrades, setTodayTrades] = useState<Trade[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [overtradingStatus, setOvertradingStatus] = useState<any>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [trades, monthStats, overtrading] = await Promise.all([
                GetTodayTrades(),
                GetMonthlyStats(),
                CheckOvertrading()
            ]);
            setTodayTrades((trades || []) as Trade[]);
            setStats(monthStats as Stats);
            setOvertradingStatus(overtrading);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
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

            {overtradingStatus?.is_overtrading && (
                <div className="alert alert-danger">
                    <strong>⚠️ Warning:</strong> {overtradingStatus.message}
                </div>
            )}

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
