import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver which isn't in jsdom
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as any;
