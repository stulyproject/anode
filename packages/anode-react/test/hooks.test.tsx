import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AnodeProvider, useAnode } from '../src/context.js';
import React from 'react';

describe('Anode Hooks', () => {
  it('useAnode should return the context instance', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnodeProvider>{children}</AnodeProvider>
    );

    const { result } = renderHook(() => useAnode(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.entities).toBeDefined();
  });

  it('useAnode should throw error outside provider', () => {
    // Suppress console.error for this expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAnode())).toThrow(
      'useAnode must be used within an AnodeProvider'
    );

    spy.mockRestore();
  });
});
