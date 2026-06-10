import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetTodayChecklist, UpdateDailyChecklist } from '../../../wailsjs/go/main/App';
import './Checklists.css';

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

const DailyChecklist = () => {
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
            // Revert on error
            setChecklist(checklist);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="checklist-container loading">Loading checklist...</div>;
    }

    if (!checklist) {
        return <div className="checklist-container">Error loading checklist</div>;
    }

    const items = [
        { key: 'market_analysis', label: 'Market Analysis', description: 'Analyzed market trends and conditions' },
        { key: 'risk_assessment', label: 'Risk Assessment', description: 'Evaluated potential risks for today' },
        { key: 'trading_plan', label: 'Trading Plan', description: 'Created a clear trading plan' },
        { key: 'mental_state', label: 'Mental State Check', description: 'Feeling calm and focused' },
        { key: 'capital_check', label: 'Capital Check', description: 'Verified available capital' },
        { key: 'news_review', label: 'News Review', description: 'Reviewed important market news' }
    ];

    const completedCount = items.filter(item => checklist[item.key as keyof DailyChecklistData]).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className="checklist-container">
            <div className="checklist-header">
                <h1>📋 Daily Checklist</h1>
                <p className="date">{new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>

            <div className="progress-section">
                <div className="progress-info">
                    <span>Progress: {completedCount}/{items.length}</span>
                    <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {saving && <div className="saving-indicator">Saving...</div>}

            <div className="checklist-items">
                {items.map(item => (
                    <div key={item.key} className="checklist-item">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={checklist[item.key as keyof DailyChecklistData] as boolean}
                                onChange={() => handleCheckboxChange(item.key as keyof DailyChecklistData)}
                            />
                            <span className="checkmark"></span>
                            <div className="item-content">
                                <h3>{item.label}</h3>
                                <p>{item.description}</p>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            {progress === 100 && (
                <div className="completion-message">
                    <h2>🎉 Great Job!</h2>
                    <p>You've completed your daily checklist. You're ready to trade!</p>
                </div>
            )}
        </div>
    );
};

export default DailyChecklist;

// Made with Bob
