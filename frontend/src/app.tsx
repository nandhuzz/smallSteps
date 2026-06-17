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
import Broker from './components/Broker/Broker';
import Settings from './components/Settings/Settings';
import Logs from './components/Logs/Logs';
import Capital from './components/Capital/Capital';
import Sidebar from './components/Sidebar/Sidebar';
import { CheckOvertrading, GetPaperTradingMode } from '../wailsjs/go/main/App';

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
const BrokerRoute = Broker as any;
const SettingsRoute = Settings as any;
const LogsRoute = Logs as any;
const CapitalRoute = Capital as any;

export const IsKillSwitchEnabledToday = () => {
        const killSwitchTime = localStorage.getItem('killSwitchTime');
        const killSwitchEnabled = localStorage.getItem('killSwitchEnabled') === 'true';
        
        if (!killSwitchEnabled || !killSwitchTime) {
            return false;
        }
        
        // Check if the kill switch time is today
        const killSwitchDate = new Date(killSwitchTime);
        const today = new Date();
        
        return killSwitchDate.toDateString() === today.toDateString();
    };


export function App() {
    const [overtradingWarning, setOvertradingWarning] = useState<{show: boolean, message: string}>({
        show: false,
        message: ''
    });
    const [killSwitchChecked, setKillSwitchChecked] = useState(false);
    const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);
    const [paperTradingMode, setPaperTradingMode] = useState(false);

    // Helper function to check if kill switch is enabled for today

    // Load dark mode preference, kill switch state, and paper trading mode on app start
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.documentElement.classList.add('dark-mode');
        }
        
        // Check if kill switch is enabled for today
        if (IsKillSwitchEnabledToday()) {
            setKillSwitchEnabled(true);
        }

        // Load paper trading mode
        loadPaperTradingMode();
    }, []);

    const loadPaperTradingMode = async () => {
        try {
            const isPaperMode = await GetPaperTradingMode();
            setPaperTradingMode(isPaperMode);
            // Apply paper trading theme if enabled
            if (isPaperMode) {
                document.documentElement.classList.add('paper-trading-mode');
                document.documentElement.classList.remove('dark-mode');
            }
        } catch (error) {
            console.error('Error loading paper trading mode:', error);
        }
    };

    useEffect(() => {
        // Check for overtrading every 5 minutes
        const checkOvertrading = async () => {
            try {
                // Skip overtrading check if kill switch is already enabled for today
                if (IsKillSwitchEnabledToday()) {
                    return;
                }
                
                const result = await CheckOvertrading();
                if (result.is_overtrading) {
                    setOvertradingWarning({
                        show: true,
                        message: result.message
                    });
                    setKillSwitchChecked(false); // Reset checkbox when new warning appears
                }
            } catch (error) {
                console.error('Error checking overtrading:', error);
            }
        };

        checkOvertrading();
        const interval = setInterval(checkOvertrading, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = () => {
        if (!killSwitchChecked) {
            alert('Please check the "Enable Kill Switch" checkbox to acknowledge this warning.');
            return;
        }
        setKillSwitchEnabled(true);
        setOvertradingWarning({show: false, message: ''});
        // Store kill switch state in localStorage
        localStorage.setItem('killSwitchEnabled', 'true');
        localStorage.setItem('killSwitchTime', new Date().toISOString());
    };

    return (
        <div id="App">
            {overtradingWarning.show && (
                <div className="overtrading-warning">
                    <div className="warning-content">
                        <h2>⚠️ Overtrading Alert!</h2>
                        <p>{overtradingWarning.message}</p>
                        <div className="kill-switch-section">
                            <label className="kill-switch-label">
                                <input
                                    type="checkbox"
                                    checked={killSwitchChecked}
                                    onChange={(e) => setKillSwitchChecked((e.target as HTMLInputElement).checked)}
                                />
                                <span>Enable Kill Switch - Stop all trading for today</span>
                            </label>
                            <p className="kill-switch-info">
                                ⚠️ By checking this box, you acknowledge the warning and agree to stop trading for the day.
                            </p>
                        </div>
                        <button
                            onClick={handleAcknowledge}
                            className={killSwitchChecked ? 'acknowledge-enabled' : 'acknowledge-disabled'}
                        >
                            {killSwitchChecked ? '✓ Acknowledge & Enable Kill Switch' : '⚠️ Check the box to acknowledge'}
                        </button>
                    </div>
                </div>
            )}

            {killSwitchEnabled && (
                <div className="kill-switch-banner">
                    <span>🛑 Kill Switch Enabled - Trading stopped for today</span>
                </div>
            )}

            {paperTradingMode && (
                <div style={{
                    position: 'fixed',
                    top: killSwitchEnabled ? '44px' : '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
                    color: 'white',
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    zIndex: 9998,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    borderBottom: '3px solid #666666'
                }}>
                    📊 PAPER TRADING MODE - Practice Environment (No Real Money)
                </div>
            )}
            
            <div className="app-container" style={{
                marginTop: paperTradingMode ? (killSwitchEnabled ? '88px' : '44px') : (killSwitchEnabled ? '44px' : '0')
            }}>
                <Sidebar />
                <div className="main-content">
                    <Router>
                        <DashboardRoute path="/" />
                        <DailyChecklistRoute path="/daily-checklist" />
                        <WeeklyChecklistRoute path="/weekly-checklist" />
                        <TradeEntryRoute path="/trade-entry" />
                        <TradeHistoryRoute path="/trade-history" />
                        <CapitalRoute path="/capital" />
                        <TasksRoute path="/tasks" />
                        <GoalsRoute path="/goals" />
                        <NewsRoute path="/news" />
                        <BrokerRoute path="/broker" />
                        <SettingsRoute path="/settings" />
                        <LogsRoute path="/logs" />
                    </Router>
                </div>
            </div>
        </div>
    );
}

// Made with Bob
