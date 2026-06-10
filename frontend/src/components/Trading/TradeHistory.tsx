import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTrades, CloseTrade, UpdateTrade, DeleteTrade } from '../../../wailsjs/go/main/App';
import './Trading.css';

interface Trade {
    id: number;
    date: string;
    symbol: string;
    trade_type: string;
    instrument_type?: string;
    option_type?: string;
    strike_price?: number;
    expiry_date?: string;
    quantity: number;
    entry_price: number;
    exit_price?: number;
    profit_loss?: number;
    brokerage: number;
    other_charges: number;
    status: string;
    notes: string;
    emotion_before: string;
    emotion_after: string;
    created_at: string;
}

const TradeHistory = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'ALL',
        symbol: '',
        startDate: '',
        endDate: ''
    });
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [closeData, setCloseData] = useState({
        exitPrice: 0,
        emotionAfter: 'Calm'
    });
    const [editData, setEditData] = useState({
        id: 0,
        symbol: '',
        tradeType: 'BUY',
        instrumentType: 'EQUITY',
        optionType: '',
        strikePrice: 0,
        expiryDate: '',
        quantity: 0,
        entryPrice: 0,
        brokerage: 0,
        otherCharges: 0,
        notes: '',
        emotionBefore: 'Calm'
    });

    useEffect(() => {
        loadTrades();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [trades, filters]);

    const loadTrades = async () => {
        try {
            const data = await GetTrades(100);
            setTrades(data || []);
        } catch (error) {
            console.error('Error loading trades:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...trades];

        if (filters.status !== 'ALL') {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters.symbol) {
            filtered = filtered.filter(t =>
                t.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
            );
        }

        if (filters.startDate) {
            filtered = filtered.filter(t =>
                new Date(t.date) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filtered = filtered.filter(t =>
                new Date(t.date) <= new Date(filters.endDate)
            );
        }

        setFilteredTrades(filtered);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleCloseTrade = (trade: Trade) => {
        setSelectedTrade(trade);
        setCloseData({
            exitPrice: 0,
            emotionAfter: 'Calm'
        });
        setShowCloseModal(true);
    };

    const submitCloseTrade = async () => {
        if (!selectedTrade || closeData.exitPrice <= 0) {
            alert('Please enter a valid exit price');
            return;
        }

        try {
            await CloseTrade(selectedTrade.id, closeData.exitPrice, closeData.emotionAfter);
            setShowCloseModal(false);
            setSelectedTrade(null);
            await loadTrades();
        } catch (error) {
            alert('Error closing trade: ' + error);
        }
    };

    const handleEditTrade = (trade: Trade) => {
        setEditData({
            id: trade.id,
            symbol: trade.symbol,
            tradeType: trade.trade_type,
            instrumentType: trade.instrument_type || 'EQUITY',
            optionType: trade.option_type || '',
            strikePrice: trade.strike_price || 0,
            expiryDate: trade.expiry_date || '',
            quantity: trade.quantity,
            entryPrice: trade.entry_price,
            brokerage: trade.brokerage,
            otherCharges: trade.other_charges,
            notes: trade.notes,
            emotionBefore: trade.emotion_before
        });
        setShowEditModal(true);
    };

    const submitEditTrade = async () => {
        if (!editData.symbol || editData.quantity <= 0 || editData.entryPrice <= 0) {
            alert('Please provide valid trade details');
            return;
        }

        try {
            await UpdateTrade(
                editData.id,
                editData.symbol,
                editData.tradeType,
                editData.quantity,
                editData.entryPrice,
                editData.brokerage,
                editData.otherCharges,
                editData.notes,
                editData.emotionBefore,
                editData.instrumentType,
                editData.optionType,
                editData.strikePrice,
                editData.expiryDate
            );
            setShowEditModal(false);
            await loadTrades();
        } catch (error) {
            alert('Error updating trade: ' + error);
        }
    };

    const handleDeleteTrade = async (tradeId: number) => {
        if (!confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
            return;
        }

        try {
            await DeleteTrade(tradeId);
            await loadTrades();
        } catch (error) {
            alert('Error deleting trade: ' + error);
        }
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Symbol', 'Type', 'Quantity', 'Entry Price', 'Exit Price', 'P&L', 'Status', 'Emotion Before', 'Emotion After'];
        const rows = filteredTrades.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.symbol,
            t.trade_type,
            t.quantity,
            t.entry_price.toFixed(2),
            t.exit_price?.toFixed(2) || '-',
            t.profit_loss?.toFixed(2) || '-',
            t.status,
            t.emotion_before,
            t.emotion_after || '-'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateStats = () => {
        const closedTrades = filteredTrades.filter(t => t.status === 'CLOSED');
        const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0).length;
        const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) < 0).length;
        const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length * 100) : 0;

        return { totalPL, winningTrades, losingTrades, winRate, totalTrades: closedTrades.length };
    };

    const stats = calculateStats();

    if (loading) {
        return <div className="container loading">Loading trades...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>📈 Trade History</h1>
                <p>View and manage your trades</p>
            </div>

            <div className="filters">
                <div className="filter-row">
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', (e.target as HTMLSelectElement).value)}
                        >
                            <option value="ALL">All</option>
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Symbol</label>
                        <input
                            type="text"
                            value={filters.symbol}
                            onChange={(e) => handleFilterChange('symbol', (e.target as HTMLInputElement).value)}
                            placeholder="Search symbol..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', (e.target as HTMLInputElement).value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', (e.target as HTMLInputElement).value)}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button className="action-button action-button-secondary" onClick={exportToCSV}>
                        📥 Export to CSV
                    </button>
                    <button className="action-button action-button-primary" onClick={loadTrades}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Trades</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{stats.totalTrades}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Win Rate</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#4CAF50' }}>{stats.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Winning Trades</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#4CAF50' }}>{stats.winningTrades}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Losing Trades</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#f44336' }}>{stats.losingTrades}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total P&L</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: stats.totalPL >= 0 ? '#4CAF50' : '#f44336' }}>
                            ₹{stats.totalPL.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="trade-list">
                {filteredTrades.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>No trades found</p>
                    </div>
                ) : (
                    filteredTrades.map(trade => (
                        <div key={trade.id} className="trade-card">
                            <div className="trade-header">
                                <div>
                                    <span className="trade-symbol">{trade.symbol}</span>
                                    {trade.instrument_type === 'OPTIONS' && trade.strike_price && (
                                        <span className="option-badge" style={{ marginLeft: '10px', background: '#667eea', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                                            {trade.strike_price} {trade.option_type}
                                        </span>
                                    )}
                                    <span className={`status-badge status-${trade.status.toLowerCase()}`} style={{ marginLeft: '10px' }}>
                                        {trade.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {formatDate(trade.date)}
                                </div>
                            </div>

                            {trade.instrument_type === 'OPTIONS' && trade.expiry_date && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                    📅 Expiry: {new Date(trade.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            )}

                            <div className="trade-details">
                                <div className="trade-detail">
                                    <span className="trade-detail-label">Type</span>
                                    <span className="trade-detail-value" style={{ color: trade.trade_type === 'BUY' ? '#4CAF50' : '#f44336' }}>
                                        {trade.trade_type}
                                    </span>
                                </div>
                                {trade.instrument_type && (
                                    <div className="trade-detail">
                                        <span className="trade-detail-label">Instrument</span>
                                        <span className="trade-detail-value">{trade.instrument_type}</span>
                                    </div>
                                )}
                                <div className="trade-detail">
                                    <span className="trade-detail-label">Quantity</span>
                                    <span className="trade-detail-value">{trade.quantity}</span>
                                </div>
                                <div className="trade-detail">
                                    <span className="trade-detail-label">Entry Price</span>
                                    <span className="trade-detail-value">₹{trade.entry_price.toFixed(2)}</span>
                                </div>
                                {trade.exit_price && (
                                    <div className="trade-detail">
                                        <span className="trade-detail-label">Exit Price</span>
                                        <span className="trade-detail-value">₹{trade.exit_price.toFixed(2)}</span>
                                    </div>
                                )}
                                {trade.profit_loss !== undefined && (
                                    <div className="trade-detail">
                                        <span className="trade-detail-label">P&L</span>
                                        <span className={trade.profit_loss >= 0 ? 'profit-positive' : 'profit-negative'}>
                                            ₹{trade.profit_loss.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="trade-detail">
                                    <span className="trade-detail-label">Emotion</span>
                                    <span className="trade-detail-value">{trade.emotion_before}</span>
                                </div>
                            </div>

                            {trade.notes && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Notes:</div>
                                    <div style={{ fontSize: '14px', color: '#333' }}>{trade.notes}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                {trade.status === 'OPEN' && (
                                    <button
                                        className="action-button action-button-primary"
                                        onClick={() => handleCloseTrade(trade)}
                                        style={{ flex: 1 }}
                                    >
                                        Close Trade
                                    </button>
                                )}
                                {trade.status === 'OPEN' && (
                                    <button
                                        className="action-button action-button-secondary"
                                        onClick={() => handleEditTrade(trade)}
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Edit
                                    </button>
                                )}
                                <button
                                    className="action-button"
                                    onClick={() => handleDeleteTrade(trade.id)}
                                    style={{ flex: 1, background: '#f44336', color: 'white' }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCloseModal && selectedTrade && (
                <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Close Trade: {selectedTrade.symbol}</h2>
                        </div>

                        <div className="form-group">
                            <label>Exit Price (₹) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={closeData.exitPrice || ''}
                                onChange={(e) => setCloseData(prev => ({ ...prev, exitPrice: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                min="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Emotion After Trade</label>
                            <select
                                value={closeData.emotionAfter}
                                onChange={(e) => setCloseData(prev => ({ ...prev, emotionAfter: (e.target as HTMLSelectElement).value }))}
                            >
                                <option value="Calm">Calm</option>
                                <option value="Anxious">Anxious</option>
                                <option value="Confident">Confident</option>
                                <option value="Fearful">Fearful</option>
                                <option value="Greedy">Greedy</option>
                                <option value="Relieved">Relieved</option>
                                <option value="Disappointed">Disappointed</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="action-button action-button-primary"
                                onClick={submitCloseTrade}
                            >
                                Close Trade
                            </button>
                            <button
                                className="action-button action-button-secondary"
                                onClick={() => setShowCloseModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Trade</h2>
                        </div>

                        <div className="form-group">
                            <label>Symbol *</label>
                            <input
                                type="text"
                                value={editData.symbol}
                                onChange={(e) => setEditData(prev => ({ ...prev, symbol: (e.target as HTMLInputElement).value }))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Trade Type *</label>
                            <select
                                value={editData.tradeType}
                                onChange={(e) => setEditData(prev => ({ ...prev, tradeType: (e.target as HTMLSelectElement).value }))}
                            >
                                <option value="BUY">BUY</option>
                                <option value="SELL">SELL</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Quantity *</label>
                            <input
                                type="number"
                                value={editData.quantity || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, quantity: parseInt((e.target as HTMLInputElement).value) || 0 }))}
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Entry Price (₹) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editData.entryPrice || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, entryPrice: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                min="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Brokerage (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editData.brokerage || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, brokerage: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Other Charges (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editData.otherCharges || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, otherCharges: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={editData.notes}
                                onChange={(e) => setEditData(prev => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
                                rows={3}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="action-button action-button-primary"
                                onClick={submitEditTrade}
                            >
                                Update Trade
                            </button>
                            <button
                                className="action-button action-button-secondary"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeHistory;

// Made with Bob
