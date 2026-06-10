import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateTask, GetTasks, UpdateTaskStatus, DeleteTask } from '../../../wailsjs/go/main/App';
import './Tasks.css';

interface Task {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    due_date?: string;
    created_at: string;
    completed_at?: string;
}

const Tasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
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
            await loadTasks();
        } catch (error) {
            alert('Error deleting task: ' + error);
        }
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
                    filteredTasks.map(task => (
                        <div key={task.id} className="task-card">
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
                                    </div>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Delete task"
                                >
                                    🗑️
                                </button>
                            </div>

                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            <div className="task-footer">
                                <div className="task-due-date">
                                    {formatDate(task.due_date)}
                                </div>
                                <div className="task-actions">
                                    {task.status === 'PENDING' && (
                                        <button
                                            className="action-button action-button-secondary"
                                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                        >
                                            Start
                                        </button>
                                    )}
                                    {task.status === 'IN_PROGRESS' && (
                                        <button
                                            className="action-button action-button-primary"
                                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                        >
                                            Complete
                                        </button>
                                    )}
                                    {task.status === 'COMPLETED' && (
                                        <button
                                            className="action-button action-button-secondary"
                                            onClick={() => handleUpdateStatus(task.id, 'PENDING')}
                                        >
                                            Reopen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

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
        </div>
    );
};

export default Tasks;

// Made with Bob
