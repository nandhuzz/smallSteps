import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateTrade, CheckOvertrading } from '../../../wailsjs/go/main/App';
import './Trading.css';

interface TradeFormData {
    symbol: string;
    tradeType: string;
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

const TradeEntry = () => {
    const [formData, setFormData] = useState<TradeFormData>({
        symbol: '',
        tradeType: 'BUY',
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

    const [overtradingWarning, setOvertradingWarning] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        checkOvertradingStatus();
    }, []);

    const checkOvertradingStatus = async () => {
        try {
            const result = await CheckOvertrading();
            if (result.is_overtrading) {
                setOvertradingWarning(result.message);
            }
        } catch (error) {
            console.error('Error checking overtrading:', error);
        }
    };

    const handleInputChange = (field: keyof TradeFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChecklistChange = (field: keyof PreEntryChecklist) => {
        setChecklist(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = (): string | null => {
        if (!formData.symbol.trim()) return 'Symbol is required';
        if (formData.quantity <= 0) return 'Quantity must be greater than 0';
        if (formData.entryPrice <= 0) return 'Entry price must be greater than 0';
        
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
            if (!confirm(`${overtradingWarning}\n\nAre you sure you want to continue?`)) {
                return;
            }
        }

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await CreateTrade(
                formData.symbol.toUpperCase(),
                formData.tradeType,
                formData.quantity,
                formData.entryPrice,
                formData.brokerage,
                formData.otherCharges,
                formData.notes,
                formData.emotionBefore
            );

            setSuccessMessage('Trade created successfully!');
            
            // Reset form
            setFormData({
                symbol: '',
                tradeType: 'BUY',
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

            // Recheck overtrading status
            await checkOvertradingStatus();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Error creating trade: ' + error);
        } finally {
            setSubmitting(false);
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
                <p>Enter new trade details</p>
            </div>

            {overtradingWarning && (
                <div className="alert alert-warning">
                    <strong>⚠️ Warning:</strong> {overtradingWarning}
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

            <div className="trade-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Trade Details</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Symbol *</label>
                                <input
                                    type="text"
                                    value={formData.symbol}
                                    onChange={(e) => handleInputChange('symbol', (e.target as HTMLInputElement).value)}
                                    placeholder="e.g., RELIANCE, TCS"
                                    required
                                />
                            </div>

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
                                    onChange={(e) => handleInputChange('entryPrice', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                    min="0.01"
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
        </div>
    );
};

export default TradeEntry;

// Made with Bob
