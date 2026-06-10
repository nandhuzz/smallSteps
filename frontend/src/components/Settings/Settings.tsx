import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTradingSettings, UpdateTradingSettings } from '../../../wailsjs/go/main/App';
import './Settings.css';

interface TradingSettings {
    id: number;
    max_trades_per_day: number;
    max_loss_per_day: number;
    max_loss_per_trade: number;
    updated_at: string;
}

const Settings = () => {
    const [settings, setSettings] = useState<TradingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await GetTradingSettings();
            setSettings(data as TradingSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
            setErrorMessage('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof TradingSettings, value: number) => {
        if (!settings) return;
        setSettings(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = async (e: Event) => {
        e.preventDefault();
        
        if (!settings) return;

        if (settings.max_trades_per_day < 1) {
            setErrorMessage('Max trades per day must be at least 1');
            return;
        }

        if (settings.max_loss_per_day < 0) {
            setErrorMessage('Max loss per day cannot be negative');
            return;
        }

        if (settings.max_loss_per_trade < 0) {
            setErrorMessage('Max loss per trade cannot be negative');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await UpdateTradingSettings(
                settings.max_trades_per_day,
                settings.max_loss_per_day,
                settings.max_loss_per_trade
            );
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error saving settings: ' + error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!confirm('Reset to default settings?')) return;
        
        setSettings(prev => prev ? {
            ...prev,
            max_trades_per_day: 5,
            max_loss_per_day: 5000,
            max_loss_per_trade: 2000
        } : null);
    };

    if (loading) {
        return <div className="container loading">Loading settings...</div>;
    }

    if (!settings) {
        return (
            <div className="container">
                <div className="header">
                    <h1>⚙️ Settings</h1>
                    <p>Configure trading limits</p>
                </div>
                <div className="card">
                    <p style={{ color: '#f44336' }}>Error loading settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>⚙️ Settings</h1>
                <p>Configure trading limits to prevent overtrading</p>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <strong>✅ Success:</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-error">
                    <strong>❌ Error:</strong> {errorMessage}
                </div>
            )}

            <div className="settings-card">
                <form onSubmit={handleSave}>
                    <div className="settings-section">
                        <h2>🔢 Trading Limits</h2>
                        <p className="section-description">
                            Set limits to protect yourself from overtrading and excessive losses
                        </p>

                        <div className="form-group">
                            <label>
                                Maximum Trades Per Day
                                <span className="label-hint">How many trades you can make in a single day</span>
                            </label>
                            <input
                                type="number"
                                value={settings.max_trades_per_day}
                                onChange={(e) => handleInputChange('max_trades_per_day', parseInt((e.target as HTMLInputElement).value) || 0)}
                                min="1"
                                max="50"
                                required
                            />
                            <div className="input-hint">
                                Current: {settings.max_trades_per_day} trades/day
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                Maximum Loss Per Day (₹)
                                <span className="label-hint">Stop trading if daily loss exceeds this amount</span>
                            </label>
                            <input
                                type="number"
                                value={settings.max_loss_per_day}
                                onChange={(e) => handleInputChange('max_loss_per_day', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                min="0"
                                step="100"
                                required
                            />
                            <div className="input-hint">
                                Current: ₹{settings.max_loss_per_day.toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                Maximum Loss Per Trade (₹)
                                <span className="label-hint">Maximum risk you're willing to take on a single trade</span>
                            </label>
                            <input
                                type="number"
                                value={settings.max_loss_per_trade}
                                onChange={(e) => handleInputChange('max_loss_per_trade', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                min="0"
                                step="100"
                                required
                            />
                            <div className="input-hint">
                                Current: ₹{settings.max_loss_per_trade.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>ℹ️ How It Works</h2>
                        <div className="info-box">
                            <ul>
                                <li>
                                    <strong>Trade Limit:</strong> You'll receive a warning when you reach the maximum number of trades for the day
                                </li>
                                <li>
                                    <strong>Daily Loss Limit:</strong> Trading will be blocked if your total losses exceed this amount in a single day
                                </li>
                                <li>
                                    <strong>Per-Trade Loss Limit:</strong> Helps you maintain proper position sizing and risk management
                                </li>
                                <li>
                                    <strong>Overtrading Prevention:</strong> These limits help you avoid emotional trading and stick to your plan
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="settings-actions">
                        <button
                            type="submit"
                            className="action-button action-button-primary"
                            disabled={saving}
                        >
                            {saving ? '💾 Saving...' : '💾 Save Settings'}
                        </button>
                        <button
                            type="button"
                            className="action-button action-button-secondary"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </form>
            </div>

            <div className="settings-footer">
                <p className="footer-note">
                    💡 <strong>Tip:</strong> Start with conservative limits and adjust based on your experience and capital.
                    These settings are designed to protect you from emotional trading decisions.
                </p>
                <p className="footer-timestamp">
                    Last updated: {new Date(settings.updated_at).toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    );
};

export default Settings;

// Made with Bob
