import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateGoal, GetGoals, ContributeToGoal, GetTrades } from '../../../wailsjs/go/main/App';
import './Goals.css';

interface Goal {
    id: number;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    status: string;
    created_at: string;
}

interface Trade {
    id: number;
    symbol: string;
    profit_loss?: number;
    status: string;
    date: string;
}

const Goals = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [newGoal, setNewGoal] = useState({
        title: '',
        targetAmount: 0,
        deadline: ''
    });
    const [contribution, setContribution] = useState({
        tradeId: 0,
        amount: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [goalsData, tradesData] = await Promise.all([
                GetGoals(),
                GetTrades(50)
            ]);
            setGoals(goalsData || []);
            // Filter only closed profitable trades
            const profitableTrades = (tradesData || []).filter(
                (t: Trade) => t.status === 'CLOSED' && (t.profit_loss || 0) > 0
            );
            setTrades(profitableTrades);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (e: Event) => {
        e.preventDefault();

        if (!newGoal.title.trim() || newGoal.targetAmount <= 0) {
            alert('Please provide valid goal details');
            return;
        }

        try {
            const deadline = newGoal.deadline ? newGoal.deadline : null;
            await CreateGoal(newGoal.title, newGoal.targetAmount, deadline);
            setShowAddModal(false);
            setNewGoal({ title: '', targetAmount: 0, deadline: '' });
            await loadData();
        } catch (error) {
            alert('Error creating goal: ' + error);
        }
    };

    const handleContribute = (goal: Goal) => {
        setSelectedGoal(goal);
        setContribution({ tradeId: 0, amount: 0 });
        setShowContributeModal(true);
    };

    const submitContribution = async () => {
        if (!selectedGoal || contribution.tradeId === 0 || contribution.amount <= 0) {
            alert('Please select a trade and enter a valid amount');
            return;
        }

        try {
            await ContributeToGoal(selectedGoal.id, contribution.tradeId, contribution.amount);
            setShowContributeModal(false);
            setSelectedGoal(null);
            await loadData();
        } catch (error) {
            alert('Error contributing to goal: ' + error);
        }
    };

    const calculateProgress = (goal: Goal) => {
        return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    };

    const getDaysRemaining = (deadline?: string) => {
        if (!deadline) return null;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return <div className="container loading">Loading goals...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>🎯 Goals</h1>
                <p>Track your financial goals</p>
            </div>

            <button
                className="action-button action-button-primary"
                onClick={() => setShowAddModal(true)}
                style={{ marginBottom: '20px' }}
            >
                ➕ Add New Goal
            </button>

            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>
                            No active goals. Create your first goal to start tracking!
                        </p>
                    </div>
                ) : (
                    goals.map(goal => {
                        const progress = calculateProgress(goal);
                        const daysRemaining = getDaysRemaining(goal.deadline);
                        const isCompleted = progress >= 100;

                        return (
                            <div key={goal.id} className={`goal-card ${isCompleted ? 'goal-completed' : ''}`}>
                                <div className="goal-header">
                                    <h3 className="goal-title">{goal.title}</h3>
                                    {isCompleted && <span className="completion-badge">✅ Completed</span>}
                                </div>

                                <div className="goal-amounts">
                                    <div className="amount-item">
                                        <span className="amount-label">Current</span>
                                        <span className="amount-value">{formatCurrency(goal.current_amount)}</span>
                                    </div>
                                    <div className="amount-item">
                                        <span className="amount-label">Target</span>
                                        <span className="amount-value">{formatCurrency(goal.target_amount)}</span>
                                    </div>
                                    <div className="amount-item">
                                        <span className="amount-label">Remaining</span>
                                        <span className="amount-value">
                                            {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
                                        </span>
                                    </div>
                                </div>

                                <div className="progress-section">
                                    <div className="progress-info">
                                        <span className="progress-label">Progress</span>
                                        <span className="progress-percentage">{progress.toFixed(1)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${progress}%`,
                                                background: isCompleted
                                                    ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                                                    : 'linear-gradient(90deg, #2196F3, #42A5F5)'
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {daysRemaining !== null && (
                                    <div className="goal-deadline">
                                        {daysRemaining > 0 ? (
                                            <span>📅 {daysRemaining} days remaining</span>
                                        ) : daysRemaining === 0 ? (
                                            <span style={{ color: '#FF9800' }}>🔥 Due today</span>
                                        ) : (
                                            <span style={{ color: '#f44336' }}>⚠️ Overdue by {Math.abs(daysRemaining)} days</span>
                                        )}
                                    </div>
                                )}

                                {!isCompleted && (
                                    <button
                                        className="action-button action-button-primary"
                                        onClick={() => handleContribute(goal)}
                                        style={{ width: '100%', marginTop: '15px' }}
                                    >
                                        💰 Contribute
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Goal</h2>
                        </div>

                        <form onSubmit={handleCreateGoal}>
                            <div className="form-group">
                                <label>Goal Title *</label>
                                <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
                                    placeholder="e.g., New Laptop, Emergency Fund"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Target Amount (₹) *</label>
                                <input
                                    type="number"
                                    value={newGoal.targetAmount || ''}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                    min="1"
                                    step="100"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Deadline (Optional)</label>
                                <input
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: (e.target as HTMLInputElement).value }))}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="action-button action-button-primary">
                                    Create Goal
                                </button>
                                <button
                                    type="button"
                                    className="action-button action-button-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showContributeModal && selectedGoal && (
                <div className="modal-overlay" onClick={() => setShowContributeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Contribute to: {selectedGoal.title}</h2>
                        </div>

                        <div className="form-group">
                            <label>Select Profitable Trade *</label>
                            <select
                                value={contribution.tradeId}
                                onChange={(e) => {
                                    const tradeId = parseInt((e.target as HTMLSelectElement).value);
                                    const trade = trades.find(t => t.id === tradeId);
                                    setContribution({
                                        tradeId,
                                        amount: trade?.profit_loss || 0
                                    });
                                }}
                            >
                                <option value={0}>Select a trade...</option>
                                {trades.map(trade => (
                                    <option key={trade.id} value={trade.id}>
                                        {trade.symbol} - {new Date(trade.date).toLocaleDateString()} - ₹{trade.profit_loss?.toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Contribution Amount (₹) *</label>
                            <input
                                type="number"
                                value={contribution.amount || ''}
                                onChange={(e) => setContribution(prev => ({ ...prev, amount: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                                min="0.01"
                                step="0.01"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="action-button action-button-primary"
                                onClick={submitContribution}
                            >
                                Contribute
                            </button>
                            <button
                                className="action-button action-button-secondary"
                                onClick={() => setShowContributeModal(false)}
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

export default Goals;

// Made with Bob
