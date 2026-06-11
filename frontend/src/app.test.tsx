import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './app';

// Mock Wails functions
vi.mock('../wailsjs/go/main/App', () => ({
  CheckOvertrading: vi.fn(() => Promise.resolve({ is_overtrading: false, message: '' })),
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(document.querySelector('#App')).toBeTruthy();
  });

  it('should render app container', () => {
    render(<App />);
    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toBeTruthy();
  });

  it('should render main content area', () => {
    render(<App />);
    const mainContent = document.querySelector('.main-content');
    expect(mainContent).toBeTruthy();
  });

  it('should apply dark mode class when enabled', () => {
    // Set dark mode in localStorage
    localStorage.setItem('darkMode', 'true');
    render(<App />);
    
    // Check if dark mode class is applied
    const hasDarkMode = document.documentElement.classList.contains('dark-mode');
    expect(hasDarkMode).toBe(true);
    
    // Cleanup
    localStorage.removeItem('darkMode');
  });

  it('should not show overtrading warning initially', () => {
    render(<App />);
    const warning = document.querySelector('.overtrading-warning');
    expect(warning).toBeFalsy();
  });
});

// Made with Bob
