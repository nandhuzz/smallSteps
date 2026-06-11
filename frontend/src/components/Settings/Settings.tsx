import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTradingSettings, UpdateTradingSettingsWithProtection } from '../../../wailsjs/go/main/App';
import './Settings.css';

interface TradingSettings {
    id: number;
    max_trades_per_day: number;
    max_loss_per_day: number;
    max_loss_per_trade: number;
    capital_protection_enabled: boolean;
    protected_capital: number;
    min_capital_threshold: number;
    updated_at: string;
}

const Settings = () => {
    const [settings, setSettings] = useState<TradingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        loadSettings();
        // Load dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add('dark-mode');
        }
    }, []);

    useEffect(() => {
        // Apply dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode]);

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

    const handleInputChange = (field: keyof TradingSettings, value: number | boolean) => {
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

        if (settings.capital_protection_enabled && settings.protected_capital <= 0) {
            setErrorMessage('Protected capital must be greater than 0 when capital protection is enabled');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await UpdateTradingSettingsWithProtection(
                settings.max_trades_per_day,
                settings.max_loss_per_day,
                settings.max_loss_per_trade,
                settings.capital_protection_enabled,
                settings.protected_capital,
                settings.min_capital_threshold
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
            max_loss_per_trade: 2000,
            capital_protection_enabled: false,
            protected_capital: 0,
            min_capital_threshold: 0
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
                        <h2>🛡️ Capital Protection</h2>
                        <p className="section-description">
                            Protect a portion of your capital from trading losses
                        </p>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.capital_protection_enabled}
                                    onChange={(e) => handleInputChange('capital_protection_enabled', (e.target as HTMLInputElement).checked)}
                                />
                                <span>Enable Capital Protection</span>
                            </label>
                        </div>

                        {settings.capital_protection_enabled && (
                            <>
                                <div className="form-group">
                                    <label>
                                        Protected Capital (₹)
                                        <span className="label-hint">Amount of capital that cannot be used for trading</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.protected_capital}
                                        onChange={(e) => handleInputChange('protected_capital', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                        min="0"
                                        step="1000"
                                        required
                                    />
                                    <div className="input-hint">
                                        This amount will be reserved and not available for trading
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Minimum Capital Threshold (₹)
                                        <span className="label-hint">Stop trading if capital falls below this amount</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.min_capital_threshold}
                                        onChange={(e) => handleInputChange('min_capital_threshold', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                        min="0"
                                        step="1000"
                                    />
                                    <div className="input-hint">
                                        Trading will be blocked if your capital drops below this threshold
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="settings-section">
                        <h2>🌙 Appearance</h2>
                        <p className="section-description">
                            Customize the look and feel of the application
                        </p>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) => setDarkMode((e.target as HTMLInputElement).checked)}
                                />
                                <span>Enable Dark Mode</span>
                            </label>
                            <div className="input-hint">
                                Switch between light and dark themes
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
                                    <strong>Capital Protection:</strong> Reserves a portion of your capital to prevent complete loss
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
