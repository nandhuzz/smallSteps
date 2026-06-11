import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTodayChecklist, UpdateDailyChecklist } from '../../../wailsjs/go/main/App';
import './FloatingChecklist.css';

interface DailyChecklistData {
    id: number;
    date: string;
    market_analysis: boolean;
    risk_assessment: boolean;
    trading_plan: boolean;
    mental_state: boolean;
    capital_check: boolean;
    news_review: boolean;
}

const FloatingChecklist = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [checklist, setChecklist] = useState<DailyChecklistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadChecklist();
    }, []);

    const loadChecklist = async () => {
        try {
            const data = await GetTodayChecklist();
            setChecklist(data as DailyChecklistData);
        } catch (error) {
            console.error('Error loading checklist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = async (field: keyof DailyChecklistData) => {
        if (!checklist) return;

        const updatedChecklist = {
            ...checklist,
            [field]: !checklist[field]
        };
        setChecklist(updatedChecklist);

        setSaving(true);
        try {
            await UpdateDailyChecklist(
                checklist.id,
                updatedChecklist.market_analysis,
                updatedChecklist.risk_assessment,
                updatedChecklist.trading_plan,
                updatedChecklist.mental_state,
                updatedChecklist.capital_check,
                updatedChecklist.news_review
            );
        } catch (error) {
            console.error('Error updating checklist:', error);
            setChecklist(checklist);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !checklist) {
        return null;
    }

    const items = [
        { key: 'market_analysis', label: 'Market Analysis', icon: '📊' },
        { key: 'risk_assessment', label: 'Risk Assessment', icon: '⚠️' },
        { key: 'trading_plan', label: 'Trading Plan', icon: '📝' },
        { key: 'mental_state', label: 'Mental State', icon: '🧘' },
        { key: 'capital_check', label: 'Capital Check', icon: '💰' },
        { key: 'news_review', label: 'News Review', icon: '📰' }
    ];

    const completedCount = items.filter(item => checklist[item.key as keyof DailyChecklistData]).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className="floating-checklist-wrapper">
            <button
                className={`floating-checklist-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Daily Checklist"
            >
                <span className="toggle-icon">📋</span>
                <span className="progress-badge">{completedCount}/{items.length}</span>
            </button>

            {isOpen && (
                <div className="floating-checklist-panel">
                    <div className="floating-checklist-header">
                        <h3>📋 Daily Checklist</h3>
                        <button
                            className="close-button"
                            onClick={() => setIsOpen(false)}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="floating-progress">
                        <div className="floating-progress-bar">
                            <div
                                className="floating-progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="floating-progress-text">
                            {progress.toFixed(0)}% Complete
                        </span>
                    </div>

                    {saving && <div className="floating-saving">Saving...</div>}

                    <div className="floating-checklist-items">
                        {items.map(item => (
                            <label key={item.key} className="floating-checklist-item">
                                <input
                                    type="checkbox"
                                    checked={checklist[item.key as keyof DailyChecklistData] as boolean}
                                    onChange={() => handleCheckboxChange(item.key as keyof DailyChecklistData)}
                                />
                                <span className="floating-item-icon">{item.icon}</span>
                                <span className="floating-item-label">{item.label}</span>
                            </label>
                        ))}
                    </div>

                    {progress === 100 && (
                        <div className="floating-completion">
                            🎉 All Done!
                        </div>
                    )}
                </div>
            )}

            {isOpen && (
                <div
                    className="floating-checklist-overlay"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default FloatingChecklist;

// Made with Bob