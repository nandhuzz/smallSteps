import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetRecentLogs } from '../../../wailsjs/go/main/App';
import './Logs.css';

interface LogEntry {
    log_type: string;
    message: string;
    details: string;
    created_at: string;
}

const Logs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        let interval: number | undefined | any;
        if (autoRefresh) {
            interval = setInterval(() => {
                loadLogs();
            }, 5000); // Refresh every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    useEffect(() => {
        applyFilters();
    }, [logs, filterType, searchTerm]);

    const loadLogs = async () => {
        try {
            const data = await GetRecentLogs(100);
            setLogs((data as LogEntry[]) || []);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        if (filterType !== 'ALL') {
            filtered = filtered.filter(log => log.log_type === filterType);
        }

        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
    };

    const getLogTypeColor = (type: string) => {
        switch (type) {
            case 'INFO': return '#2196F3';
            case 'WARNING': return '#FF9800';
            case 'ERROR': return '#f44336';
            case 'TRADE': return '#4CAF50';
            default: return '#666';
        }
    };

    const getLogTypeIcon = (type: string) => {
        switch (type) {
            case 'INFO': return 'ℹ️';
            case 'WARNING': return '⚠️';
            case 'ERROR': return '❌';
            case 'TRADE': return '💹';
            default: return '📝';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const exportLogs = () => {
        const headers = ['Timestamp', 'Type', 'Message', 'Details'];
        const rows = filteredLogs.map(log => [
            log.created_at,
            log.log_type,
            log.message,
            log.details
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const clearFilters = () => {
        setFilterType('ALL');
        setSearchTerm('');
    };

    const logTypeCounts = {
        total: logs.length,
        info: logs.filter(l => l.log_type === 'INFO').length,
        warning: logs.filter(l => l.log_type === 'WARNING').length,
        error: logs.filter(l => l.log_type === 'ERROR').length,
        trade: logs.filter(l => l.log_type === 'TRADE').length
    };

    if (loading) {
        return <div className="container loading">Loading logs...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>📋 System Logs</h1>
                <p>View application activity and errors</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Logs</div>
                    <div className="stat-value">{logTypeCounts.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Info</div>
                    <div className="stat-value" style={{ color: '#2196F3' }}>{logTypeCounts.info}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Warnings</div>
                    <div className="stat-value" style={{ color: '#FF9800' }}>{logTypeCounts.warning}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Errors</div>
                    <div className="stat-value" style={{ color: '#f44336' }}>{logTypeCounts.error}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Trades</div>
                    <div className="stat-value" style={{ color: '#4CAF50' }}>{logTypeCounts.trade}</div>
                </div>
            </div>

            <div className="filters">
                <div className="filter-row">
                    <div className="form-group">
                        <label>Log Type</label>
                        <select value={filterType} onChange={(e) => setFilterType((e.target as HTMLSelectElement).value)}>
                            <option value="ALL">All Types</option>
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="ERROR">Error</option>
                            <option value="TRADE">Trade</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                            placeholder="Search logs..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Auto Refresh</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh((e.target as HTMLInputElement).checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button className="action-button action-button-primary" onClick={loadLogs}>
                        🔄 Refresh
                    </button>
                    <button className="action-button action-button-secondary" onClick={exportLogs}>
                        📥 Export CSV
                    </button>
                    <button className="action-button action-button-secondary" onClick={clearFilters}>
                        🗑️ Clear Filters
                    </button>
                </div>
            </div>

            <div className="logs-list">
                {filteredLogs.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>No logs found</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <div key={index} className="log-card">
                            <div className="log-header">
                                <div className="log-type-badge" style={{ background: getLogTypeColor(log.log_type) }}>
                                    {getLogTypeIcon(log.log_type)} {log.log_type}
                                </div>
                                <div className="log-timestamp">
                                    {formatTimestamp(log.created_at)}
                                </div>
                            </div>

                            <div className="log-message">{log.message}</div>

                            {log.details && (
                                <div className="log-details">
                                    <strong>Details:</strong> {log.details}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {autoRefresh && (
                <div className="auto-refresh-indicator">
                    🔄 Auto-refreshing every 5 seconds...
                </div>
            )}
        </div>
    );
};

export default Logs;

// Made with Bob
