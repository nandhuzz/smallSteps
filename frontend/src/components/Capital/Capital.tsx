import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { AddDeposit, AddWithdrawal, GetCapitalTransactions, GetCurrentCapitalBalance } from '../../../wailsjs/go/main/App';
import './Capital.css';

interface CapitalTransaction {
    id: number;
    transaction_type: string;
    amount: number;
    balance_after: number;
    notes: string;
    transaction_date: string;
}

const Capital = () => {
    const [transactions, setTransactions] = useState<CapitalTransaction[]>([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [txns, balance] = await Promise.all([
                GetCapitalTransactions(50),
                GetCurrentCapitalBalance()
            ]);
            setTransactions(txns || []);
            setCurrentBalance(balance || 0);
        } catch (error) {
            console.error('Error loading capital data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (transactionType === 'WITHDRAWAL' && amountNum > currentBalance) {
            setError('Insufficient balance for withdrawal');
            return;
        }

        setSubmitting(true);
        try {
            if (transactionType === 'DEPOSIT') {
                await AddDeposit(amountNum, notes);
                setSuccess(`Successfully deposited ₹${amountNum.toFixed(2)}`);
            } else {
                await AddWithdrawal(amountNum, notes);
                setSuccess(`Successfully withdrew ₹${amountNum.toFixed(2)}`);
            }
            
            // Reset form
            setAmount('');
            setNotes('');
            setShowForm(false);
            
            // Reload data
            await loadData();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Error processing transaction: ' + error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="container loading">Loading capital data...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>💰 Capital Management</h1>
                <p>Track your deposits and withdrawals</p>
            </div>

            {success && (
                <div className="alert alert-success">
                    <strong>✅ Success:</strong> {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <strong>❌ Error:</strong> {error}
                </div>
            )}

            <div className="capital-summary">
                <div className="balance-card">
                    <h2>Current Balance</h2>
                    <p className="balance-amount">₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="action-buttons">
                    <button
                        className="action-button action-button-success"
                        onClick={() => {
                            setTransactionType('DEPOSIT');
                            setShowForm(true);
                            setError('');
                        }}
                    >
                        ➕ Add Deposit
                    </button>
                    <button
                        className="action-button action-button-danger"
                        onClick={() => {
                            setTransactionType('WITHDRAWAL');
                            setShowForm(true);
                            setError('');
                        }}
                    >
                        ➖ Add Withdrawal
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="transaction-form-card">
                    <h3>{transactionType === 'DEPOSIT' ? '➕ Add Deposit' : '➖ Add Withdrawal'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
                                placeholder="Enter amount"
                                step="0.01"
                                min="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
                                placeholder="Add any notes about this transaction"
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="action-button action-button-primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : `${transactionType === 'DEPOSIT' ? 'Add Deposit' : 'Add Withdrawal'}`}
                            </button>
                            <button
                                type="button"
                                className="action-button action-button-secondary"
                                onClick={() => {
                                    setShowForm(false);
                                    setAmount('');
                                    setNotes('');
                                    setError('');
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="transactions-section">
                <h3>📊 Transaction History</h3>
                {transactions.length === 0 ? (
                    <div className="no-data">No transactions yet. Add your first deposit or withdrawal above.</div>
                ) : (
                    <div className="transactions-list">
                        {transactions.map(txn => (
                            <div key={txn.id} className={`transaction-item ${txn.transaction_type.toLowerCase()}`}>
                                <div className="transaction-icon">
                                    {txn.transaction_type === 'DEPOSIT' ? '➕' : '➖'}
                                </div>
                                <div className="transaction-details">
                                    <div className="transaction-type">{txn.transaction_type}</div>
                                    <div className="transaction-date">{formatDate(txn.transaction_date)}</div>
                                    {txn.notes && <div className="transaction-notes">{txn.notes}</div>}
                                </div>
                                <div className="transaction-amounts">
                                    <div className={`transaction-amount ${txn.transaction_type.toLowerCase()}`}>
                                        {txn.transaction_type === 'DEPOSIT' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="transaction-balance">
                                        Balance: ₹{txn.balance_after.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Capital;

// Made with Bob