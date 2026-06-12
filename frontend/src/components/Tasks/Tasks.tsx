import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateTask, GetTasks, UpdateTaskStatus, DeleteTask, UpdateTaskProgress, AddTaskLog, GetTaskLogs } from '../../../wailsjs/go/main/App';
import './Tasks.css';

interface Task {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    progress: number;
    due_date?: string;
    created_at: string;
    completed_at?: string;
    updated_at: string;
}

interface TaskLog {
    id: number;
    task_id: number;
    log_message: string;
    progress_snapshot: number;
    created_at: string;
}

const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
    const [newLogMessage, setNewLogMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: ''
    });

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await GetTasks();
            setTasks(data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: Event) => {
        e.preventDefault();

        if (!newTask.title.trim()) {
            alert('Task title is required');
            return;
        }

        try {
            const dueDate = newTask.dueDate ? newTask.dueDate : null;
            await CreateTask(
                newTask.title,
                newTask.description,
                newTask.priority,
                dueDate
            );

            setShowAddModal(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                dueDate: ''
            });
            await loadTasks();
        } catch (error) {
            alert('Error creating task: ' + error);
        }
    };

    const handleUpdateStatus = async (taskId: number, newStatus: string) => {
        try {
            await UpdateTaskStatus(taskId, newStatus);
            await loadTasks();
            // Update selected task if modal is open
            if (selectedTask && selectedTask.id === taskId) {
                const updatedTasks = await GetTasks();
                const updated = updatedTasks.find((t: Task) => t.id === taskId);
                if (updated) setSelectedTask(updated);
            }
        } catch (error) {
            alert('Error updating task: ' + error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await DeleteTask(taskId);
            if (selectedTask && selectedTask.id === taskId) {
                setShowTaskDetailModal(false);
                setSelectedTask(null);
            }
            await loadTasks();
        } catch (error) {
            alert('Error deleting task: ' + error);
        }
    };

    const handleUpdateProgress = async (taskId: number, progress: number) => {
        try {
            await UpdateTaskProgress(taskId, progress);
            await loadTasks();
            // Update selected task if modal is open
            if (selectedTask && selectedTask.id === taskId) {
                const updatedTasks = await GetTasks();
                const updated = updatedTasks.find((t: Task) => t.id === taskId);
                if (updated) setSelectedTask(updated);
            }
        } catch (error) {
            alert('Error updating progress: ' + error);
        }
    };

    const handleOpenTaskDetail = async (task: Task) => {
        setSelectedTask(task);
        setShowTaskDetailModal(true);
        try {
            const logs = await GetTaskLogs(task.id);
            setTaskLogs(logs || []);
        } catch (error) {
            console.error('Error loading logs:', error);
            setTaskLogs([]);
        }
    };

    const handleCloseTaskDetail = () => {
        setShowTaskDetailModal(false);
        setSelectedTask(null);
        setNewLogMessage('');
        setTaskLogs([]);
    };

    const handleAddLog = async (e: Event) => {
        e.preventDefault();
        if (!selectedTask || !newLogMessage.trim()) return;

        try {
            await AddTaskLog(selectedTask.id, newLogMessage);
            setNewLogMessage('');
            const logs = await GetTaskLogs(selectedTask.id);
            setTaskLogs(logs || []);
            await loadTasks();
        } catch (error) {
            alert('Error adding log: ' + error);
        }
    };

    const getTimeRemaining = (dueDate?: string) => {
        if (!dueDate) return null;
        
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

        if (diffTime < 0) return { text: 'Overdue', color: '#f44336', urgent: true };
        if (diffDays === 0) {
            if (diffHours <= 0) return { text: 'Due now', color: '#f44336', urgent: true };
            return { text: `${diffHours}h remaining`, color: '#FF9800', urgent: true };
        }
        if (diffDays === 1) return { text: '1 day remaining', color: '#FF9800', urgent: true };
        if (diffDays <= 3) return { text: `${diffDays} days remaining`, color: '#FF9800', urgent: false };
        if (diffDays <= 7) return { text: `${diffDays} days remaining`, color: '#2196F3', urgent: false };
        return { text: `${diffDays} days remaining`, color: '#4CAF50', urgent: false };
    };

    const getFilteredTasks = () => {
        return tasks.filter(task => {
            const statusMatch = filterStatus === 'ALL' || task.status === filterStatus;
            const priorityMatch = filterPriority === 'ALL' || task.priority === filterPriority;
            return statusMatch && priorityMatch;
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#f44336';
            case 'MEDIUM': return '#FF9800';
            case 'LOW': return '#4CAF50';
            default: return '#666';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#2196F3';
            case 'IN_PROGRESS': return '#FF9800';
            case 'COMPLETED': return '#4CAF50';
            default: return '#666';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '⚠️ Overdue';
        if (diffDays === 0) return '🔥 Due today';
        if (diffDays === 1) return '📅 Due tomorrow';
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredTasks = getFilteredTasks();
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'PENDING').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length
    };

    if (loading) {
        return <div className="container loading">Loading tasks...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>📝 Tasks</h1>
                <p>Manage your trading tasks</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Tasks</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending</div>
                    <div className="stat-value" style={{ color: '#2196F3' }}>{stats.pending}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value" style={{ color: '#FF9800' }}>{stats.inProgress}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.completed}</div>
                </div>
            </div>

            <div className="filters">
                <div className="filter-row">
                    <div className="form-group">
                        <label>Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus((e.target as HTMLSelectElement).value)}>
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <select value={filterPriority} onChange={(e) => setFilterPriority((e.target as HTMLSelectElement).value)}>
                            <option value="ALL">All</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                <button className="action-button action-button-primary" onClick={() => setShowAddModal(true)}>
                    ➕ Add New Task
                </button>
            </div>

            <div className="task-list">
                {filteredTasks.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>No tasks found</p>
                    </div>
                ) : (
                    filteredTasks.map(task => {
                        const timeRemaining = getTimeRemaining(task.due_date);
                        return (
                            <div 
                                key={task.id} 
                                className="task-card" 
                                onClick={() => handleOpenTaskDetail(task)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="task-header">
                                    <div>
                                        <h3 className="task-title">{task.title}</h3>
                                        <div className="task-badges">
                                            <span className="badge" style={{ background: getPriorityColor(task.priority) }}>
                                                {task.priority}
                                            </span>
                                            <span className="badge" style={{ background: getStatusColor(task.status) }}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            {timeRemaining && (
                                                <span
                                                    className={`badge ${timeRemaining.urgent ? 'badge-urgent' : ''}`}
                                                    style={{ background: timeRemaining.color }}
                                                >
                                                    ⏱️ {timeRemaining.text}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {task.description && (
                                    <p className="task-description">{task.description}</p>
                                )}

                                <div className="task-progress-section">
                                    <div className="progress-header">
                                        <label>Progress: {task.progress}%</label>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${task.progress}%`,
                                                background: task.progress === 100 ? '#4CAF50' : '#2196F3'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="task-footer">
                                    <div className="task-meta">
                                        <div className="task-due-date">
                                            📅 Due: {formatDate(task.due_date)}
                                        </div>
                                        <div className="task-timestamp">
                                            🕒 Updated: {formatDateTime(task.updated_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Task</h2>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
                                    placeholder="Task title"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: (e.target as HTMLTextAreaElement).value }))}
                                    placeholder="Task description"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: (e.target as HTMLSelectElement).value }))}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: (e.target as HTMLInputElement).value }))}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="action-button action-button-primary">
                                    Create Task
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

            {/* Task Detail Modal */}
            {showTaskDetailModal && selectedTask && (
                <div className="modal-overlay" onClick={handleCloseTaskDetail}>
                    <div className="modal-content logs-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📋 {selectedTask.title}</h2>
                            <button
                                className="delete-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(selectedTask.id);
                                }}
                                title="Delete task"
                            >
                                🗑️
                            </button>
                        </div>

                        <div className="task-detail-content">
                            {/* Task Info */}
                            <div className="task-detail-section">
                                <div className="task-badges">
                                    <span className="badge" style={{ background: getPriorityColor(selectedTask.priority) }}>
                                        {selectedTask.priority}
                                    </span>
                                    <span className="badge" style={{ background: getStatusColor(selectedTask.status) }}>
                                        {selectedTask.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {selectedTask.description && (
                                    <p style={{ marginTop: '10px', color: '#666' }}>{selectedTask.description}</p>
                                )}
                                <div style={{ marginTop: '15px', fontSize: '13px', color: '#888' }}>
                                    <div style={{ marginBottom: '5px' }}>📅 <strong>Due:</strong> {formatDate(selectedTask.due_date)}</div>
                                    <div style={{ marginBottom: '5px' }}>📝 <strong>Created:</strong> {formatDateTime(selectedTask.created_at)}</div>
                                    <div>🕒 <strong>Last Updated:</strong> {formatDateTime(selectedTask.updated_at)}</div>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="task-detail-section">
                                <h3>Progress: {selectedTask.progress}%</h3>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${selectedTask.progress}%`,
                                            background: selectedTask.progress === 100 ? '#4CAF50' : '#2196F3'
                                        }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedTask.progress}
                                    onChange={(e) => handleUpdateProgress(selectedTask.id, parseInt((e.target as HTMLInputElement).value))}
                                    className="progress-slider"
                                    disabled={selectedTask.status === 'COMPLETED'}
                                    style={{ width: '100%', marginTop: '10px' }}
                                />
                            </div>

                            {/* Status Actions */}
                            <div className="task-detail-section">
                                <h3>Actions</h3>
                                <div className="task-actions" style={{ gap: '10px' }}>
                                    {selectedTask.status === 'PENDING' && (
                                        <button
                                            className="action-button action-button-secondary"
                                            onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                                        >
                                            Start Task
                                        </button>
                                    )}
                                    {selectedTask.status === 'IN_PROGRESS' && (
                                        <button
                                            className="action-button action-button-primary"
                                            onClick={() => handleUpdateStatus(selectedTask.id, 'COMPLETED')}
                                        >
                                            Mark Complete
                                        </button>
                                    )}
                                    {selectedTask.status === 'COMPLETED' && (
                                        <button
                                            className="action-button action-button-secondary"
                                            onClick={() => handleUpdateStatus(selectedTask.id, 'PENDING')}
                                        >
                                            Reopen Task
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Logs Section */}
                            <div className="task-detail-section">
                                <h3>Activity Log</h3>
                                <form onSubmit={handleAddLog} className="add-log-form">
                                    <div className="form-group">
                                        <textarea
                                            value={newLogMessage}
                                            onChange={(e) => setNewLogMessage((e.target as HTMLTextAreaElement).value)}
                                            placeholder="Add a progress update or note..."
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="action-button action-button-primary">
                                        Add Log
                                    </button>
                                </form>

                                <div className="logs-list" style={{ marginTop: '20px' }}>
                                    {taskLogs.length === 0 ? (
                                        <p className="no-logs">No activity logs yet. Add your first update above.</p>
                                    ) : (
                                        taskLogs.map(log => (
                                            <div key={log.id} className="log-entry">
                                                <div className="log-header">
                                                    <div className="log-time">
                                                        🕒 {formatDateTime(log.created_at)}
                                                    </div>
                                                    <div className="log-progress-badge">
                                                        📊 {log.progress_snapshot}%
                                                    </div>
                                                </div>
                                                <div className="log-message">{log.log_message}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="action-button action-button-secondary"
                                onClick={handleCloseTaskDetail}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;

// Made with Bob
