import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTradingSettings, UpdateTradingSettingsWithProtection, GetChecklistItems, CreateChecklistItem, UpdateChecklistItem, DeleteChecklistItem } from '../../../wailsjs/go/main/App';
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

interface ChecklistItem {
    id: number;
    checklist_type: string;
    item_key: string;
    item_label: string;
    item_description: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

const Settings = () => {
    const [settings, setSettings] = useState<TradingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    
    // Accordion state
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    
    // Checklist management state
    const [dailyItems, setDailyItems] = useState<ChecklistItem[]>([]);
    const [weeklyItems, setWeeklyItems] = useState<ChecklistItem[]>([]);
    const [showAddDaily, setShowAddDaily] = useState(false);
    const [showAddWeekly, setShowAddWeekly] = useState(false);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');

    useEffect(() => {
        loadSettings();
        loadChecklistItems();
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

    const loadChecklistItems = async () => {
        try {
            const daily = await GetChecklistItems('DAILY');
            const weekly = await GetChecklistItems('WEEKLY');
            setDailyItems(daily as ChecklistItem[]);
            setWeeklyItems(weekly as ChecklistItem[]);
        } catch (error) {
            console.error('Error loading checklist items:', error);
        }
    };

    const handleAddChecklistItem = async (type: string) => {
        if (!newItemLabel.trim()) {
            setErrorMessage('Item label is required');
            return;
        }

        try {
            const itemKey = newItemLabel.toLowerCase().replace(/\s+/g, '_');
            const displayOrder = type === 'DAILY' ? dailyItems.length + 1 : weeklyItems.length + 1;
            
            await CreateChecklistItem(type, itemKey, newItemLabel, newItemDescription, displayOrder);
            
            setNewItemLabel('');
            setNewItemDescription('');
            setShowAddDaily(false);
            setShowAddWeekly(false);
            await loadChecklistItems();
            setSuccessMessage('Checklist item added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error adding checklist item: ' + error);
        }
    };

    const handleUpdateChecklistItem = async () => {
        if (!editingItem || !newItemLabel.trim()) {
            setErrorMessage('Item label is required');
            return;
        }

        try {
            await UpdateChecklistItem(editingItem.id, newItemLabel, newItemDescription, editingItem.display_order);
            
            setEditingItem(null);
            setNewItemLabel('');
            setNewItemDescription('');
            await loadChecklistItems();
            setSuccessMessage('Checklist item updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error updating checklist item: ' + error);
        }
    };

    const handleDeleteChecklistItem = async (itemId: number) => {
        if (!confirm('Are you sure you want to delete this checklist item?')) return;

        try {
            await DeleteChecklistItem(itemId);
            await loadChecklistItems();
            setSuccessMessage('Checklist item deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error deleting checklist item: ' + error);
        }
    };

    const startEditItem = (item: ChecklistItem) => {
        setEditingItem(item);
        setNewItemLabel(item.item_label);
        setNewItemDescription(item.item_description);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setNewItemLabel('');
        setNewItemDescription('');
        setShowAddDaily(false);
        setShowAddWeekly(false);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const isSectionExpanded = (sectionId: string) => {
        return expandedSections.has(sectionId);
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
                        <div
                            className="accordion-header"
                            onClick={() => toggleSection('trading-limits')}
                        >
                            <h2>🔢 Trading Limits</h2>
                            <span className={`accordion-icon ${isSectionExpanded('trading-limits') ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isSectionExpanded('trading-limits') && (
                            <div className="accordion-content">
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
                        )}
                    </div>

                    <div className="settings-section">
                        <div
                            className="accordion-header"
                            onClick={() => toggleSection('capital-protection')}
                        >
                            <h2>🛡️ Capital Protection</h2>
                            <span className={`accordion-icon ${isSectionExpanded('capital-protection') ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isSectionExpanded('capital-protection') && (
                            <div className="accordion-content">
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
                        )}
                    </div>

                    <div className="settings-section">
                        <div
                            className="accordion-header"
                            onClick={() => toggleSection('appearance')}
                        >
                            <h2>🌙 Appearance</h2>
                            <span className={`accordion-icon ${isSectionExpanded('appearance') ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isSectionExpanded('appearance') && (
                            <div className="accordion-content">
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
                        )}
                    </div>

                    <div className="settings-section">
                        <div
                            className="accordion-header"
                            onClick={() => toggleSection('checklist-config')}
                        >
                            <h2>📋 Checklist Configuration</h2>
                            <span className={`accordion-icon ${isSectionExpanded('checklist-config') ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isSectionExpanded('checklist-config') && (
                            <div className="accordion-content">
                                <p className="section-description">
                                    Manage your daily and weekly checklist items
                                </p>

                        <div className="checklist-config">
                            <h3>Daily Checklist Items</h3>
                            <div className="checklist-items-list">
                                {dailyItems.map((item) => (
                                    <div key={item.id} className="checklist-item-row">
                                        {editingItem?.id === item.id ? (
                                            <div className="edit-item-form">
                                                <input
                                                    type="text"
                                                    value={newItemLabel}
                                                    onChange={(e) => setNewItemLabel((e.target as HTMLInputElement).value)}
                                                    placeholder="Item label"
                                                />
                                                <input
                                                    type="text"
                                                    value={newItemDescription}
                                                    onChange={(e) => setNewItemDescription((e.target as HTMLInputElement).value)}
                                                    placeholder="Description (optional)"
                                                />
                                                <div className="edit-actions">
                                                    <button onClick={handleUpdateChecklistItem} className="btn-save">Save</button>
                                                    <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="item-info">
                                                    <strong>{item.item_label}</strong>
                                                    {item.item_description && <span className="item-desc">{item.item_description}</span>}
                                                </div>
                                                <div className="item-actions">
                                                    <button onClick={() => startEditItem(item)} className="btn-edit">✏️ Edit</button>
                                                    <button onClick={() => handleDeleteChecklistItem(item.id)} className="btn-delete">🗑️ Delete</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {showAddDaily ? (
                                <div className="add-item-form">
                                    <input
                                        type="text"
                                        value={newItemLabel}
                                        onChange={(e) => setNewItemLabel((e.target as HTMLInputElement).value)}
                                        placeholder="Item label"
                                    />
                                    <input
                                        type="text"
                                        value={newItemDescription}
                                        onChange={(e) => setNewItemDescription((e.target as HTMLInputElement).value)}
                                        placeholder="Description (optional)"
                                    />
                                    <div className="add-actions">
                                        <button onClick={() => handleAddChecklistItem('DAILY')} className="btn-save">Add</button>
                                        <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddDaily(true)} className="btn-add-item">+ Add Daily Item</button>
                            )}

                            <h3 style={{ marginTop: '30px' }}>Weekly Checklist Items</h3>
                            <div className="checklist-items-list">
                                {weeklyItems.map((item) => (
                                    <div key={item.id} className="checklist-item-row">
                                        {editingItem?.id === item.id ? (
                                            <div className="edit-item-form">
                                                <input
                                                    type="text"
                                                    value={newItemLabel}
                                                    onChange={(e) => setNewItemLabel((e.target as HTMLInputElement).value)}
                                                    placeholder="Item label"
                                                />
                                                <input
                                                    type="text"
                                                    value={newItemDescription}
                                                    onChange={(e) => setNewItemDescription((e.target as HTMLInputElement).value)}
                                                    placeholder="Description (optional)"
                                                />
                                                <div className="edit-actions">
                                                    <button onClick={handleUpdateChecklistItem} className="btn-save">Save</button>
                                                    <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="item-info">
                                                    <strong>{item.item_label}</strong>
                                                    {item.item_description && <span className="item-desc">{item.item_description}</span>}
                                                </div>
                                                <div className="item-actions">
                                                    <button onClick={() => startEditItem(item)} className="btn-edit">✏️ Edit</button>
                                                    <button onClick={() => handleDeleteChecklistItem(item.id)} className="btn-delete">🗑️ Delete</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {showAddWeekly ? (
                                <div className="add-item-form">
                                    <input
                                        type="text"
                                        value={newItemLabel}
                                        onChange={(e) => setNewItemLabel((e.target as HTMLInputElement).value)}
                                        placeholder="Item label"
                                    />
                                    <input
                                        type="text"
                                        value={newItemDescription}
                                        onChange={(e) => setNewItemDescription((e.target as HTMLInputElement).value)}
                                        placeholder="Description (optional)"
                                    />
                                    <div className="add-actions">
                                        <button onClick={() => handleAddChecklistItem('WEEKLY')} className="btn-save">Add</button>
                                        <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                    <button onClick={() => setShowAddWeekly(true)} className="btn-add-item">+ Add Weekly Item</button>
                                )}
                            </div>
                            </div>
                        )}
                    </div>

                    <div className="settings-section">
                        <div
                            className="accordion-header"
                            onClick={() => toggleSection('how-it-works')}
                        >
                            <h2>ℹ️ How It Works</h2>
                            <span className={`accordion-icon ${isSectionExpanded('how-it-works') ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isSectionExpanded('how-it-works') && (
                            <div className="accordion-content">
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
                        )}
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
