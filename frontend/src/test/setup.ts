import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Wails runtime
global.window = global.window || {};
(global.window as any).runtime = {
  EventsOn: () => {},
  EventsOff: () => {},
  EventsEmit: () => {},
};

// Made with Bob
