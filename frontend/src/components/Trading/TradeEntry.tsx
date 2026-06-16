import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateTrade, GetTodayTrades, CloseTrade } from '../../../wailsjs/go/main/App';
import './Trading.css';
import {IsKillSwitchEnabledToday} from '../../app';


interface TradeFormData {
    symbol: string;
    tradeType: string;
    instrumentType: string;
    optionType: string;
    strikePrice: number;
    expiryDate: string;
    quantity: number;
    entryPrice: number;
    brokerage: number;
    otherCharges: number;
    notes: string;
    emotionBefore: string;
}

interface PreEntryChecklist {
    setupConfirmed: boolean;
    riskCalculated: boolean;
    stopLossSet: boolean;
    positionSized: boolean;
    emotionCheck: boolean;
    planFollowed: boolean;
}

interface OpenTrade {
    id: number;
    symbol: string;
    trade_type: string;
    instrument_type?: string;
    option_type?: string;
    strike_price?: number;
    expiry_date?: string;
    quantity: number;
    entry_price: number;
    brokerage: number;
    other_charges: number;
}

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'];

const TradeEntry = () => {
    const [formData, setFormData] = useState<TradeFormData>({
        symbol: '',
        tradeType: 'BUY',
        instrumentType: 'EQUITY',
        optionType: 'CALL',
        strikePrice: 0,
        expiryDate: '',
        quantity: 0,
        entryPrice: 0,
        brokerage: 0,
        otherCharges: 0,
        notes: '',
        emotionBefore: 'Calm'
    });

    const [checklist, setChecklist] = useState<PreEntryChecklist>({
        setupConfirmed: false,
        riskCalculated: false,
        stopLossSet: false,
        positionSized: false,
        emotionCheck: false,
        planFollowed: false
    });

    const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
    const [closingTrade, setClosingTrade] = useState<OpenTrade | null>(null);
    const [exitPrice, setExitPrice] = useState<number>(0);
    const [emotionAfter, setEmotionAfter] = useState<string>('Calm');
    const [overtradingWarning, setOvertradingWarning] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        loadOpenTrades();
        setOvertradingWarning(IsKillSwitchEnabledToday())
    }, []);

    const loadOpenTrades = async () => {
        try {
            const trades = await GetTodayTrades();
            const open = trades.filter((t: any) => t.status === 'OPEN');
            setOpenTrades(open);
        } catch (error) {
            console.error('Error loading open trades:', error);
        }
    };

    const handleInputChange = (field: keyof TradeFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNumericInputChange = (field: keyof TradeFormData, value: string) => {
        // Allow empty string, partial decimals like "123.", and valid numbers
        if (value === '' || value.endsWith('.') || !isNaN(parseFloat(value))) {        
            setFormData(prev => ({ ...prev, [field]: value === '' ? 0 : value }));
        }
    };

    const handleChecklistChange = (field: keyof PreEntryChecklist) => {
        setChecklist(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = (): string | null => {
        if (!formData.symbol.trim()) return 'Symbol is required';
        if (formData.quantity <= 0) return 'Quantity must be greater than 0';
        if (formData.entryPrice <= 0) return 'Entry price must be greater than 0';
        
        if (formData.instrumentType === 'OPTIONS') {
            if (formData.strikePrice <= 0) return 'Strike price is required for options';
            if (!formData.expiryDate) return 'Expiry date is required for options';
        }
        
        const checklistComplete = Object.values(checklist).every(v => v);
        if (!checklistComplete) return 'Please complete all pre-entry checklist items';
        
        return null;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        if (overtradingWarning) {
            if (!confirm(`Over trading detected! \n\nAre you sure you want to continue?`)) {
                return;
            }
        }

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');
        if (!isNaN(formData.entryPrice)){
            formData.entryPrice = Number(formData.entryPrice);
        }

        try {
            await CreateTrade(
                formData.symbol.toUpperCase(),
                formData.tradeType,
                formData.quantity,
                formData.entryPrice,
                formData.brokerage,
                formData.otherCharges,
                formData.notes,
                formData.emotionBefore,
                formData.instrumentType,
                formData.instrumentType === 'OPTIONS' ? formData.optionType : '',
                formData.instrumentType === 'OPTIONS' ? formData.strikePrice : 0,
                formData.instrumentType === 'OPTIONS' ? formData.expiryDate : ''
            );

            setSuccessMessage('Trade created successfully!');
            
            // Reset form
            setFormData({
                symbol: '',
                tradeType: 'BUY',
                instrumentType: 'EQUITY',
                optionType: 'CALL',
                strikePrice: 0,
                expiryDate: '',
                quantity: 0,
                entryPrice: 0,
                brokerage: 0,
                otherCharges: 0,
                notes: '',
                emotionBefore: 'Calm'
            });
            setChecklist({
                setupConfirmed: false,
                riskCalculated: false,
                stopLossSet: false,
                positionSized: false,
                emotionCheck: false,
                planFollowed: false
            });

            // Reload open trades and recheck overtrading status
            await loadOpenTrades();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error creating trade: ' + error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseTrade = async () => {
        if (!closingTrade || exitPrice <= 0) {
            setErrorMessage('Please enter a valid exit price');
            return;
        }

        try {
            await CloseTrade(closingTrade.id, exitPrice, emotionAfter);
            setSuccessMessage('Trade closed successfully!');
            setClosingTrade(null);
            setExitPrice(0);
            setEmotionAfter('Calm');
            await loadOpenTrades();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error closing trade: ' + error);
        }
    };

    const calculatePotentialPL = (trade: OpenTrade, exit: number) => {
        const entryValue = trade.entry_price * trade.quantity;
        const exitValue = exit * trade.quantity;
        const charges = trade.brokerage + trade.other_charges;
        
        if (trade.trade_type === 'BUY') {
            return exitValue - entryValue - charges;
        } else {
            return entryValue - exitValue - charges;
        }
    };

    const checklistItems = [
        { key: 'setupConfirmed', label: 'Trading setup confirmed' },
        { key: 'riskCalculated', label: 'Risk/reward calculated' },
        { key: 'stopLossSet', label: 'Stop loss level determined' },
        { key: 'positionSized', label: 'Position size appropriate' },
        { key: 'emotionCheck', label: 'Emotional state is stable' },
        { key: 'planFollowed', label: 'Following trading plan' }
    ];

    const checklistComplete = Object.values(checklist).every(v => v);

    return (
        <div className="container">
            <div className="header">
                <h1>💹 Trade Entry</h1>
                <p>Enter new trade details and manage open positions</p>
            </div>

            {overtradingWarning && (
                <div className="alert alert-warning">
                    <strong>⚠️ Warning:</strong> {'Overtrading detected! You have exceeded your daily trade limit.'}
                </div>
            )}

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

            {/* Open Trades Section */}
            {openTrades.length > 0 && (
                <div className="open-trades-section">
                    <h2>📊 Open Positions ({openTrades.length})</h2>
                    <div className="open-trades-grid">
                        {openTrades.map(trade => (
                            <div key={trade.id} className="open-trade-card">
                                <div className="trade-card-header">
                                    <div>
                                        <h3>{trade.symbol}</h3>
                                        {trade.instrument_type === 'OPTIONS' && (
                                            <span className="option-badge">
                                                {trade.strike_price} {trade.option_type}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`trade-type-badge ${trade.trade_type.toLowerCase()}`}>
                                        {trade.trade_type}
                                    </span>
                                </div>
                                <div className="trade-card-details">
                                    <div className="detail-item">
                                        <span className="label">Qty:</span>
                                        <span className="value">{trade.quantity}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Entry:</span>
                                        <span className="value">₹{trade.entry_price.toFixed(2)}</span>
                                    </div>
                                    {trade.expiry_date && (
                                        <div className="detail-item">
                                            <span className="label">Expiry:</span>
                                            <span className="value">{trade.expiry_date}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="close-trade-btn"
                                    onClick={() => setClosingTrade(trade)}
                                >
                                    Close Position
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="trade-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Trade Details</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Instrument Type *</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="instrumentType"
                                            value="EQUITY"
                                            checked={formData.instrumentType === 'EQUITY'}
                                            onChange={(e) => handleInputChange('instrumentType', (e.target as HTMLInputElement).value)}
                                        />
                                        Equity
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="instrumentType"
                                            value="OPTIONS"
                                            checked={formData.instrumentType === 'OPTIONS'}
                                            onChange={(e) => handleInputChange('instrumentType', (e.target as HTMLInputElement).value)}
                                        />
                                        Options
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Symbol *</label>
                                {formData.instrumentType === 'OPTIONS' ? (
                                    <select
                                        value={formData.symbol}
                                        onChange={(e) => handleInputChange('symbol', (e.target as HTMLSelectElement).value)}
                                        required
                                    >
                                        <option value="">Select Index</option>
                                        {SYMBOLS.map(sym => (
                                            <option key={sym} value={sym}>{sym}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.symbol}
                                        onChange={(e) => handleInputChange('symbol', (e.target as HTMLInputElement).value)}
                                        placeholder="e.g., RELIANCE, TCS"
                                        required
                                    />
                                )}
                            </div>
                        </div>

                        {formData.instrumentType === 'OPTIONS' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Option Type *</label>
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name="optionType"
                                                value="CALL"
                                                checked={formData.optionType === 'CALL'}
                                                onChange={(e) => handleInputChange('optionType', (e.target as HTMLInputElement).value)}
                                            />
                                            CALL (CE)
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="optionType"
                                                value="PUT"
                                                checked={formData.optionType === 'PUT'}
                                                onChange={(e) => handleInputChange('optionType', (e.target as HTMLInputElement).value)}
                                            />
                                            PUT (PE)
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Strike Price *</label>
                                    <input
                                        type="number"
                                        value={formData.strikePrice || ''}
                                        onChange={(e) => handleInputChange('strikePrice', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                        placeholder="e.g., 18000"
                                        min="0"
                                        step="50"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {formData.instrumentType === 'OPTIONS' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expiry Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => handleInputChange('expiryDate', (e.target as HTMLInputElement).value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Trade Type *</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="tradeType"
                                            value="BUY"
                                            checked={formData.tradeType === 'BUY'}
                                            onChange={(e) => handleInputChange('tradeType', (e.target as HTMLInputElement).value)}
                                        />
                                        BUY
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="tradeType"
                                            value="SELL"
                                            checked={formData.tradeType === 'SELL'}
                                            onChange={(e) => handleInputChange('tradeType', (e.target as HTMLInputElement).value)}
                                        />
                                        SELL
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.quantity || ''}
                                    onChange={(e) => handleInputChange('quantity', parseInt((e.target as HTMLInputElement).value) || 0)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Entry Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.entryPrice || ''}
                                    onChange={(e) => handleNumericInputChange('entryPrice', (e.target as HTMLInputElement).value)}
                                    min="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Brokerage (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.brokerage || ''}
                                    onChange={(e) => handleInputChange('brokerage', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Other Charges (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.otherCharges || ''}
                                    onChange={(e) => handleInputChange('otherCharges', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Emotion Before Trade</label>
                            <select
                                value={formData.emotionBefore}
                                onChange={(e) => handleInputChange('emotionBefore', (e.target as HTMLSelectElement).value)}
                            >
                                <option value="Calm">Calm</option>
                                <option value="Anxious">Anxious</option>
                                <option value="Confident">Confident</option>
                                <option value="Fearful">Fearful</option>
                                <option value="Greedy">Greedy</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', (e.target as HTMLTextAreaElement).value)}
                                placeholder="Trade rationale, setup details, etc."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Pre-Entry Checklist</h2>
                        <div className="checklist-compact">
                            {checklistItems.map(item => (
                                <label key={item.key} className="checklist-item-compact">
                                    <input
                                        type="checkbox"
                                        checked={checklist[item.key as keyof PreEntryChecklist]}
                                        onChange={() => handleChecklistChange(item.key as keyof PreEntryChecklist)}
                                    />
                                    <span>{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={submitting || !checklistComplete}
                    >
                        {submitting ? 'Creating Trade...' : 'Create Trade'}
                    </button>
                </form>
            </div>

            {/* Close Trade Modal */}
            {closingTrade && (
                <div className="modal-overlay" onClick={() => setClosingTrade(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Close Trade</h2>
                        </div>
                        
                        <div className="trade-summary">
                            <h3>{closingTrade.symbol}</h3>
                            {closingTrade.instrument_type === 'OPTIONS' && (
                                <p className="option-details">
                                    {closingTrade.strike_price} {closingTrade.option_type}
                                    {closingTrade.expiry_date && ` | Expiry: ${closingTrade.expiry_date}`}
                                </p>
                            )}
                            <div className="summary-grid">
                                <div>
                                    <span className="label">Type:</span>
                                    <span className="value">{closingTrade.trade_type}</span>
                                </div>
                                <div>
                                    <span className="label">Quantity:</span>
                                    <span className="value">{closingTrade.quantity}</span>
                                </div>
                                <div>
                                    <span className="label">Entry Price:</span>
                                    <span className="value">₹{closingTrade.entry_price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Exit Price (₹) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={exitPrice || ''}
                                onChange={(e) => setExitPrice(parseFloat((e.target as HTMLInputElement).value) || 0)}
                                min="0.00"
                                autoFocus
                            />
                        </div>

                        {exitPrice > 0 && (
                            <div className="pl-preview">
                                <span>Estimated P/L:</span>
                                <span className={calculatePotentialPL(closingTrade, exitPrice) >= 0 ? 'profit-positive' : 'profit-negative'}>
                                    ₹{calculatePotentialPL(closingTrade, exitPrice).toFixed(2)}
                                </span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Emotion After Trade</label>
                            <select
                                value={emotionAfter}
                                onChange={(e) => setEmotionAfter((e.target as HTMLSelectElement).value)}
                            >
                                <option value="Calm">Calm</option>
                                <option value="Anxious">Anxious</option>
                                <option value="Confident">Confident</option>
                                <option value="Fearful">Fearful</option>
                                <option value="Greedy">Greedy</option>
                                <option value="Relieved">Relieved</option>
                                <option value="Frustrated">Frustrated</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="action-button action-button-secondary"
                                onClick={() => setClosingTrade(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="action-button action-button-primary"
                                onClick={handleCloseTrade}
                                disabled={exitPrice <= 0}
                            >
                                Close Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeEntry;

// Made with Bob
