import './App.css'
import { h, FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Router, { Route } from 'preact-router';
import Dashboard from './components/Dashboard/Dashboard';
import DailyChecklist from './components/Checklists/DailyChecklist';
import WeeklyChecklist from './components/Checklists/WeeklyChecklist';
import TradeEntry from './components/Trading/TradeEntry';
import TradeHistory from './components/Trading/TradeHistory';
import Tasks from './components/Tasks/Tasks';
import Goals from './components/Goals/Goals';
import News from './components/News/News';
import Settings from './components/Settings/Settings';
import Logs from './components/Logs/Logs';
import Sidebar from './components/Sidebar/Sidebar';
import { CheckOvertrading } from '../wailsjs/go/main/App';

// Define route props interface
interface RouteProps {
    path?: string;
}

// Wrap components to accept route props - using type assertions for preact-router compatibility
const DashboardRoute = Dashboard as any;
const DailyChecklistRoute = DailyChecklist as any;
const WeeklyChecklistRoute = WeeklyChecklist as any;
const TradeEntryRoute = TradeEntry as any;
const TradeHistoryRoute = TradeHistory as any;
const TasksRoute = Tasks as any;
const GoalsRoute = Goals as any;
const NewsRoute = News as any;
const SettingsRoute = Settings as any;
const LogsRoute = Logs as any;

export function App() {
    const [overtradingWarning, setOvertradingWarning] = useState<{show: boolean, message: string}>({
        show: false,
        message: ''
    });

    useEffect(() => {
        // Check for overtrading every 5 minutes
        const checkOvertrading = async () => {
            try {
                const result = await CheckOvertrading();
                if (result.is_overtrading) {
                    setOvertradingWarning({
                        show: true,
                        message: result.message
                    });
                }
            } catch (error) {
                console.error('Error checking overtrading:', error);
            }
        };

        checkOvertrading();
        const interval = setInterval(checkOvertrading, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div id="App">
            {overtradingWarning.show && (
                <div className="overtrading-warning">
                    <div className="warning-content">
                        <h2>⚠️ Overtrading Alert!</h2>
                        <p>{overtradingWarning.message}</p>
                        <button onClick={() => setOvertradingWarning({show: false, message: ''})}>
                            Acknowledge
                        </button>
                    </div>
                </div>
            )}
            
            <div className="app-container">
                <Sidebar />
                <div className="main-content">
                    <Router>
                        <DashboardRoute path="/" />
                        <DailyChecklistRoute path="/daily-checklist" />
                        <WeeklyChecklistRoute path="/weekly-checklist" />
                        <TradeEntryRoute path="/trade-entry" />
                        <TradeHistoryRoute path="/trade-history" />
                        <TasksRoute path="/tasks" />
                        <GoalsRoute path="/goals" />
                        <NewsRoute path="/news" />
                        <SettingsRoute path="/settings" />
                        <LogsRoute path="/logs" />
                    </Router>
                </div>
            </div>
        </div>
    );
}

// Made with Bob
