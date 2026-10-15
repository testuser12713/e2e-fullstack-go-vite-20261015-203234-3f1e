import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsPanel from './StatsPanel';
import type { Stats } from '../types';

const stats: Stats = {
  year: 2026,
  readCount: 3,
  monthly: [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  averageRating: 4.5,
  statusCounts: { planned: 5, reading: 2, read: 3 },
};

describe('StatsPanel', () => {
  it('renders a neutral placeholder while stats is null', () => {
    render(<StatsPanel stats={null} />);
    expect(screen.getByText('Statistik wird geladen …')).toBeTruthy();
  });

  it('shows read count, bars, average and status counts', () => {
    render(<StatsPanel stats={stats} />);
    expect(screen.getByText('Dieses Jahr gelesen')).toBeTruthy();
    expect(screen.getByTestId('read-count').textContent).toBe('3');
    expect(screen.getAllByTestId('month-bar')).toHaveLength(12);
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Mär')).toBeTruthy();
    expect(screen.getByTestId('average-rating').textContent).toContain('4,5');
    expect(screen.getByText('Geplant')).toBeTruthy();
    expect(screen.getByTestId('status-count-planned').textContent).toBe('5');
    expect(screen.getByTestId('status-count-reading').textContent).toBe('2');
  });

  it('updates when fresh stats arrive', () => {
    const { rerender } = render(<StatsPanel stats={stats} />);
    rerender(<StatsPanel stats={{ ...stats, readCount: 4, monthly: [1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] }} />);
    expect(screen.getByTestId('read-count').textContent).toBe('4');
  });

  it('shows a dash when there is no average', () => {
    render(<StatsPanel stats={{ ...stats, averageRating: null }} />);
    expect(screen.getByTestId('average-rating').textContent).toBe('–');
  });
});
