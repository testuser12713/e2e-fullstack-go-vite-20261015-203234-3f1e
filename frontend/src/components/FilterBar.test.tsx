import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import FilterBar from './FilterBar';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('FilterBar', () => {
  it('renders four tabs in order with the active one selected', () => {
    render(<FilterBar status="reading" onStatusChange={() => {}} onQueryChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Alle', 'Geplant', 'Lese gerade', 'Gelesen']);
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('calls onStatusChange on tab click', () => {
    const onStatus = vi.fn();
    render(<FilterBar status="all" onStatusChange={onStatus} onQueryChange={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Lese gerade' }));
    expect(onStatus).toHaveBeenCalledWith('reading');
  });

  it('emits the trimmed query once after the debounce', () => {
    vi.useFakeTimers();
    const onQuery = vi.fn();
    render(<FilterBar status="all" onStatusChange={() => {}} onQueryChange={onQuery} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: ' to' } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: ' tolk ' } });
    act(() => vi.advanceTimersByTime(299));
    expect(onQuery).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(10));
    expect(onQuery).toHaveBeenCalledTimes(1);
    expect(onQuery).toHaveBeenCalledWith('tolk');
  });
});
