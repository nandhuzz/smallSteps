import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import {
    SaveBrokerConfig,
    GetBrokerConfig,
    GetUpstoxAuthURL,
    AuthorizeUpstox,
    SyncUpstoxTrades,
    GetSyncedTrades,
    GetUpstoxPositions,
    CheckAnalyticsTokenStatus,
    GetPortfolioWithAnalyticsToken,
    GetTradesWithAnalyticsToken
} from '../../../wailsjs/go/main/App';
import './Broker.css';

interface BrokerConfig {
    id: number;
    broker_name: string;
    api_key: string;
    api_secret: string;
    access_token: string;
    is_active: boolean;
    auto_sync_trades: boolean;
    auto_sync_positions: boolean;
    sync_interval: number;
    last_sync?: string;
}

interface SyncedTrade {
    id: number;
    broker_trade_id: string;
    symbol: string;
    trade_type: string;
    quantity: number;
    price: number;
    trade_date: string;
    sync_status: string;
}

interface Trade {
    order_id: string;
    trading_symbol: string;
    exchange: string;
    transaction_type: string;
    quantity: number;
    average_price: number;
    order_type: string;
    status: string;
    order_timestamp: string;
    product: string;
}

interface Position {
    trading_symbol: string;
    exchange: string;
    quantity: number;
    average_price: number;
    last_price: number;
    pnl: number;
    day_change: number;
    day_change_percentage: number;
}

interface TokenStatus {
    configured: boolean;
    valid: boolean;
    message: string;
    user_id?: string;
    user_name?: string;
}

const Broker = () => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'config' | 'sync' | 'positions'>('analytics');
    const [brokerConfig, setBrokerConfig] = useState<BrokerConfig | null>(null);
    const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
    const [analyticsPositions, setAnalyticsPositions] = useState<Position[]>([]);
    const [analyticsTrades, setAnalyticsTrades] = useState<Trade[]>([]);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [autoSyncTrades, setAutoSyncTrades] = useState(true);
    const [autoSyncPositions, setAutoSyncPositions] = useState(true);
    const [syncInterval, setSyncInterval] = useState(300);
    const [authCode, setAuthCode] = useState('');
    const [syncedTrades, setSyncedTrades] = useState<SyncedTrade[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    useEffect(() => {
        loadBrokerConfig();
    }, []);

    const loadBrokerConfig = async () => {
        try {
            const config = await GetBrokerConfig('UPSTOX');
            setBrokerConfig(config);
            setApiKey(config.api_key);
            setApiSecret(config.api_secret);
            setAutoSyncTrades(config.auto_sync_trades);
            setAutoSyncPositions(config.auto_sync_positions);
            setSyncInterval(config.sync_interval);
        } catch (error) {
            console.log('No broker config found');
        }
    };

    const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleSaveConfig = async () => {
        if (!apiKey || !apiSecret) {
            showMessage('Please enter API Key and API Secret', 'error');
            return;
        }

        setLoading(true);
        try {
            await SaveBrokerConfig('UPSTOX', apiKey, apiSecret, autoSyncTrades, autoSyncPositions, syncInterval);
            showMessage('Broker configuration saved successfully!', 'success');
            await loadBrokerConfig();
        } catch (error) {
            showMessage('Error saving configuration: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async () => {
        if (!apiKey) {
            showMessage('Please save API Key first', 'error');
            return;
        }

        try {
            const authURL = await GetUpstoxAuthURL(apiKey, 'http://localhost:34115/callback');
            window.open(authURL, '_blank');
            showMessage('Authorization window opened. Please complete the authorization and paste the code below.', 'info');
        } catch (error) {
            showMessage('Error getting authorization URL: ' + error, 'error');
        }
    };

    const handleSubmitAuthCode = async () => {
        if (!authCode) {
            showMessage('Please enter authorization code', 'error');
            return;
        }

        setLoading(true);
        try {
            await AuthorizeUpstox(brokerConfig?.id || 0, authCode);
            showMessage('Authorization successful!', 'success');
            setAuthCode('');
            await loadBrokerConfig();
        } catch (error) {
            showMessage('Authorization failed: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncTrades = async () => {
        if (!brokerConfig?.is_active) {
            showMessage('Please authorize broker first', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await SyncUpstoxTrades(brokerConfig.id);
            showMessage(`Synced ${result.synced} trades (${result.skipped} skipped)`, 'success');
            await loadSyncedTrades();
        } catch (error) {
            showMessage('Error syncing trades: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSyncedTrades = async () => {
        if (!brokerConfig) return;

        try {
            const trades = await GetSyncedTrades(brokerConfig.id, 50);
            setSyncedTrades(trades);
        } catch (error) {
            console.error('Error loading synced trades:', error);
        }
    };

    const loadPositions = async () => {
        if (!brokerConfig?.is_active) {
            showMessage('Please authorize broker first', 'error');
            return;
        }

        setLoading(true);
        try {
            const pos = await GetUpstoxPositions(brokerConfig.id);
            setPositions(pos);
        } catch (error) {
            showMessage('Error loading positions: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkTokenStatus = async () => {
        setLoading(true);
        try {
            const status = await CheckAnalyticsTokenStatus() as any;
            setTokenStatus(status as TokenStatus);
            if (status.valid) {
                showMessage('Analytics Token is valid and working!', 'success');
            } else if (!status.configured) {
                showMessage('Analytics Token not configured in .env file', 'error');
            } else {
                showMessage(status.message, 'error');
            }
        } catch (error) {
            showMessage('Error checking token status: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalyticsPortfolio = async () => {
        setLoading(true);
        try {
            const positions = await GetPortfolioWithAnalyticsToken();
            setAnalyticsPositions(positions);
            showMessage(`Loaded ${positions.length} positions`, 'success');
        } catch (error) {
            showMessage('Error loading portfolio: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalyticsTrades = async () => {
        setLoading(true);
        try {
            const trades = await GetTradesWithAnalyticsToken();
            setAnalyticsTrades(trades);
            showMessage(`Loaded ${trades.length} trades`, 'success');
        } catch (error) {
            showMessage('Error loading trades: ' + error, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'sync' && brokerConfig) {
            loadSyncedTrades();
        } else if (activeTab === 'positions' && brokerConfig) {
            loadPositions();
        }
    }, [activeTab, brokerConfig]);

    return (
        <div className="container">
            <div className="header">
                <h1>🔗 Broker Integration</h1>
                <p>Connect and sync with Upstox broker</p>
            </div>

            {message && (
                <div className={`alert alert-${messageType}`}>
                    <strong>{messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'}</strong> {message}
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    📊 Analytics Token
                </button>
                <button
                    className={`tab ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    ⚙️ OAuth Config
                </button>
                <button
                    className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sync')}
                >
                    Synced Trades
                </button>
                <button
                    className={`tab ${activeTab === 'positions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('positions')}
                >
                    Positions
                </button>
            </div>

            {activeTab === 'analytics' && (
                <div className="analytics-section">
                    <div className="config-section">
                        <h2>📊 Analytics Token (Recommended)</h2>
                        <p>Use your long-lived Analytics Token for read-only access to portfolio, trades, and market data.</p>
                        
                        <div className="info-box" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h3>ℹ️ About Analytics Token</h3>
                            <ul style={{ marginLeft: '20px' }}>
                                <li>✅ No OAuth authorization required</li>
                                <li>✅ Valid for 1 year</li>
                                <li>✅ Read-only access (portfolio, trades, market data)</li>
                                <li>❌ Cannot place/modify/cancel orders</li>
                                <li>🔒 Configured in .env file</li>
                            </ul>
                        </div>

                        {tokenStatus && (
                            <div className={`status-card ${tokenStatus.valid ? 'success' : 'error'}`} style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', background: tokenStatus.valid ? '#d4edda' : '#f8d7da' }}>
                                <h3>{tokenStatus.valid ? '✅ Token Valid' : '❌ Token Invalid'}</h3>
                                <p>{tokenStatus.message}</p>
                                {tokenStatus.user_name && (
                                    <div className="user-info">
                                        <p><strong>User:</strong> {tokenStatus.user_name}</p>
                                        <p><strong>User ID:</strong> {tokenStatus.user_id}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            onClick={checkTokenStatus}
                            disabled={loading}
                        >
                            {loading ? 'Checking...' : 'Check Token Status'}
                        </button>

                        {tokenStatus?.valid && (
                            <div className="analytics-actions" style={{ marginTop: '20px' }}>
                                <h3>Available Actions</h3>
                                <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={loadAnalyticsPortfolio}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : '📈 Load Portfolio'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={loadAnalyticsTrades}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : '📊 Load Trades'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!tokenStatus?.configured && (
                            <div className="setup-guide" style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
                                <h3>🔧 Setup Instructions</h3>
                                <ol style={{ marginLeft: '20px' }}>
                                    <li>Get your Analytics Token from <a href="https://api.upstox.com/apps" target="_blank">Upstox API Apps</a></li>
                                    <li>Open the <code>.env</code> file in the SmallSteps root directory</li>
                                    <li>Add: <code>UPSTOX_ANALYTICS_TOKEN=your_token_here</code></li>
                                    <li>Save the file and restart SmallSteps</li>
                                    <li>Click "Check Token Status" above</li>
                                </ol>
                            </div>
                        )}
                    </div>

                    {analyticsPositions.length > 0 && (
                        <div className="config-section">
                            <h2>Portfolio Positions</h2>
                            <div className="positions-grid">
                                {analyticsPositions.map((pos, idx) => (
                                    <div key={idx} className="position-card">
                                        <div className="position-header">
                                            <h3>{pos.trading_symbol}</h3>
                                            <span className="exchange">{pos.exchange}</span>
                                        </div>
                                        <div className="position-details">
                                            <div className="detail-row">
                                                <span>Quantity:</span>
                                                <strong>{pos.quantity}</strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>Avg Price:</span>
                                                <strong>₹{pos.average_price.toFixed(2)}</strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>Last Price:</span>
                                                <strong>₹{pos.last_price.toFixed(2)}</strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>P&L:</span>
                                                <strong className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                                                    ₹{pos.pnl.toFixed(2)}
                                                </strong>
                                            </div>
                                            <div className="detail-row">
                                                <span>Day Change:</span>
                                                <strong className={pos.day_change >= 0 ? 'profit' : 'loss'}>
                                                    {pos.day_change_percentage.toFixed(2)}%
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {analyticsTrades.length > 0 && (
                        <div className="config-section">
                            <h2>Trade History</h2>
                            <div className="trades-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Symbol</th>
                                            <th>Type</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsTrades.map((trade, idx) => (
                                            <tr key={idx}>
                                                <td>{new Date(trade.order_timestamp).toLocaleString()}</td>
                                                <td>{trade.trading_symbol}</td>
                                                <td>
                                                    <span className={`badge ${trade.transaction_type.toLowerCase()}`}>
                                                        {trade.transaction_type}
                                                    </span>
                                                </td>
                                                <td>{trade.quantity}</td>
                                                <td>₹{trade.average_price.toFixed(2)}</td>
                                                <td>
                                                    <span className={`status ${trade.status.toLowerCase()}`}>
                                                        {trade.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'config' && (
                <div className="broker-config">
                    <div className="config-section">
                        <h2>Upstox OAuth Configuration</h2>
                        <p><em>Note: For simple read-only access, use the Analytics Token tab instead.</em></p>
                        
                        {brokerConfig?.is_active && (
                            <div className="status-badge active">
                                ✓ Connected
                                {brokerConfig.last_sync && (
                                    <span className="last-sync">Last sync: {new Date(brokerConfig.last_sync).toLocaleString()}</span>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label>API Key *</label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey((e.target as HTMLInputElement).value)}
                                placeholder="Enter your Upstox API Key"
                            />
                            <small>Get your API key from <a href="https://api.upstox.com" target="_blank">Upstox Developer Console</a></small>
                        </div>

                        <div className="form-group">
                            <label>API Secret *</label>
                            <input
                                type="password"
                                value={apiSecret}
                                onChange={(e) => setApiSecret((e.target as HTMLInputElement).value)}
                                placeholder="Enter your Upstox API Secret"
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={autoSyncTrades}
                                    onChange={(e) => setAutoSyncTrades((e.target as HTMLInputElement).checked)}
                                />
                                Auto-sync trades
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={autoSyncPositions}
                                    onChange={(e) => setAutoSyncPositions((e.target as HTMLInputElement).checked)}
                                />
                                Auto-sync positions
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Sync Interval (seconds)</label>
                            <input
                                type="number"
                                value={syncInterval}
                                onChange={(e) => setSyncInterval(parseInt((e.target as HTMLInputElement).value) || 300)}
                                min="60"
                                step="60"
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveConfig}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>

                    {brokerConfig && !brokerConfig.is_active && (
                        <div className="config-section">
                            <h2>Authorization</h2>
                            <p>Click the button below to authorize SmallSteps to access your Upstox account.</p>
                            
                            <button
                                className="btn btn-secondary"
                                onClick={handleAuthorize}
                            >
                                Authorize Upstox
                            </button>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Authorization Code</label>
                                <input
                                    type="text"
                                    value={authCode}
                                    onChange={(e) => setAuthCode((e.target as HTMLInputElement).value)}
                                    placeholder="Paste authorization code here"
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmitAuthCode}
                                    disabled={loading || !authCode}
                                    style={{ marginTop: '10px' }}
                                >
                                    {loading ? 'Authorizing...' : 'Submit Code'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="sync-section">
                    <div className="section-header">
                        <h2>Synced Trades</h2>
                        <button
                            className="btn btn-primary"
                            onClick={handleSyncTrades}
                            disabled={loading || !brokerConfig?.is_active}
                        >
                            {loading ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>

                    {syncedTrades.length === 0 ? (
                        <div className="empty-state">
                            <p>No synced trades yet. Click "Sync Now" to fetch trades from Upstox.</p>
                        </div>
                    ) : (
                        <div className="trades-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Symbol</th>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {syncedTrades.map(trade => (
                                        <tr key={trade.id}>
                                            <td>{new Date(trade.trade_date).toLocaleString()}</td>
                                            <td>{trade.symbol}</td>
                                            <td>
                                                <span className={`badge ${trade.trade_type.toLowerCase()}`}>
                                                    {trade.trade_type}
                                                </span>
                                            </td>
                                            <td>{trade.quantity}</td>
                                            <td>₹{trade.price.toFixed(2)}</td>
                                            <td>
                                                <span className={`status ${trade.sync_status.toLowerCase()}`}>
                                                    {trade.sync_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'positions' && (
                <div className="positions-section">
                    <div className="section-header">
                        <h2>Current Positions</h2>
                        <button
                            className="btn btn-primary"
                            onClick={loadPositions}
                            disabled={loading || !brokerConfig?.is_active}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {positions.length === 0 ? (
                        <div className="empty-state">
                            <p>No open positions found.</p>
                        </div>
                    ) : (
                        <div className="positions-grid">
                            {positions.map((pos, idx) => (
                                <div key={idx} className="position-card">
                                    <div className="position-header">
                                        <h3>{pos.trading_symbol}</h3>
                                        <span className="exchange">{pos.exchange}</span>
                                    </div>
                                    <div className="position-details">
                                        <div className="detail-row">
                                            <span>Quantity:</span>
                                            <strong>{pos.quantity}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Avg Price:</span>
                                            <strong>₹{pos.average_price.toFixed(2)}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Last Price:</span>
                                            <strong>₹{pos.last_price.toFixed(2)}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>P&L:</span>
                                            <strong className={pos.pnl >= 0 ? 'profit' : 'loss'}>
                                                ₹{pos.pnl.toFixed(2)}
                                            </strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Day Change:</span>
                                            <strong className={pos.day_change >= 0 ? 'profit' : 'loss'}>
                                                {pos.day_change_percentage.toFixed(2)}%
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Broker;

// Made with Bob