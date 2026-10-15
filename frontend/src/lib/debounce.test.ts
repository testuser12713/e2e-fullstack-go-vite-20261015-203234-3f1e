import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './debounce';

afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('emits only after the value settles for the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    expect(result.current).toBe('a');
    rerender({ v: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ v: 'abc' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
