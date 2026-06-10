import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetThisWeekChecklist, UpdateWeeklyChecklist } from '../../../wailsjs/go/main/App';
import './Checklists.css';

interface WeeklyChecklistData {
    id: number;
    week_start: string;
    performance_review: boolean;
    strategy_analysis: boolean;
    goal_progress: boolean;
    learning_notes: string;
}

const WeeklyChecklist = () => {
    const [checklist, setChecklist] = useState<WeeklyChecklistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadChecklist();
    }, []);

    const loadChecklist = async () => {
        try {
            const data = await GetThisWeekChecklist();
            setChecklist(data as WeeklyChecklistData);
            setNotes((data as WeeklyChecklistData).learning_notes || '');
        } catch (error) {
            console.error('Error loading checklist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = async (field: keyof WeeklyChecklistData) => {
        if (!checklist) return;

        const updatedChecklist = {
            ...checklist,
            [field]: !checklist[field]
        };
        setChecklist(updatedChecklist);

        setSaving(true);
        try {
            await UpdateWeeklyChecklist(
                checklist.id,
                updatedChecklist.performance_review,
                updatedChecklist.strategy_analysis,
                updatedChecklist.goal_progress,
                notes
            );
        } catch (error) {
            console.error('Error updating checklist:', error);
            setChecklist(checklist);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!checklist) return;

        setSaving(true);
        try {
            await UpdateWeeklyChecklist(
                checklist.id,
                checklist.performance_review,
                checklist.strategy_analysis,
                checklist.goal_progress,
                notes
            );
        } catch (error) {
            console.error('Error saving notes:', error);
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
        { key: 'performance_review', label: 'Performance Review', description: 'Reviewed weekly trading performance' },
        { key: 'strategy_analysis', label: 'Strategy Analysis', description: 'Analyzed trading strategies effectiveness' },
        { key: 'goal_progress', label: 'Goal Progress', description: 'Checked progress towards financial goals' }
    ];

    const completedCount = items.filter(item => checklist[item.key as keyof WeeklyChecklistData]).length;
    const progress = (completedCount / items.length) * 100;

    const getWeekRange = () => {
        const weekStart = new Date(checklist.week_start);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="checklist-container">
            <div className="checklist-header">
                <h1>📅 Weekly Checklist</h1>
                <p className="date">Week: {getWeekRange()}</p>
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
                                checked={checklist[item.key as keyof WeeklyChecklistData] as boolean}
                                onChange={() => handleCheckboxChange(item.key as keyof WeeklyChecklistData)}
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

            <div className="notes-section">
                <h3>📝 Learning Notes</h3>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
                    placeholder="What did you learn this week? What can be improved?"
                />
                <button
                    className="save-button"
                    onClick={handleSaveNotes}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Notes'}
                </button>
            </div>

            {progress === 100 && (
                <div className="completion-message">
                    <h2>🎉 Week Review Complete!</h2>
                    <p>Great job reviewing your trading week. Keep improving!</p>
                </div>
            )}
        </div>
    );
};

export default WeeklyChecklist;

// Made with Bob
