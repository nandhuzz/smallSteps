import { h } from 'preact';
import { route } from 'preact-router';
import './Sidebar.css';

const Sidebar = () => {
    const menuItems = [
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/daily-checklist', icon: '✅', label: 'Daily Checklist' },
        { path: '/weekly-checklist', icon: '📅', label: 'Weekly Checklist' },
        { path: '/trade-entry', icon: '💹', label: 'Trade Entry' },
        { path: '/trade-history', icon: '📈', label: 'Trade History' },
        { path: '/capital', icon: '💰', label: 'Capital' },
        { path: '/tasks', icon: '📝', label: 'Tasks' },
        { path: '/goals', icon: '🎯', label: 'Goals' },
        { path: '/news', icon: '📰', label: 'Market News' },
        { path: '/broker', icon: '🔗', label: 'Broker' },
        { path: '/logs', icon: '📋', label: 'Logs' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>📈 SmallSteps</h2>
                <p>Trading Control</p>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <a
                        key={item.path}
                        href={item.path}
                        className="sidebar-item"
                        onClick={(e) => {
                            e.preventDefault();
                            route(item.path);
                        }}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </a>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;

// Made with Bob
