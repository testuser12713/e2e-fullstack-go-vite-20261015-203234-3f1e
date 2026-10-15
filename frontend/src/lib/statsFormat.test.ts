import { describe, expect, it } from 'vitest';
import { formatAverage, monthBars } from './statsFormat';

describe('formatAverage', () => {
  it('uses a German decimal comma with one decimal', () => {
    expect(formatAverage(4.25)).toMatch(/^4,[23]$/);
    expect(formatAverage(3)).toBe('3,0');
  });
  it('returns a dash for null', () => {
    expect(formatAverage(null)).toBe('–');
  });
});

describe('monthBars', () => {
  it('returns 12 German-labelled bars relative to max', () => {
    const bars = monthBars([0, 0, 4, 2, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(bars).toHaveLength(12);
    expect(bars[2]).toMatchObject({ label: 'Mär', count: 4, ratio: 1 });
    expect(bars[3].ratio).toBeCloseTo(0.5, 2);
    expect(bars[0]).toMatchObject({ label: 'Jan', count: 0, ratio: 0 });
    expect(bars[11].label).toBe('Dez');
  });
  it('handles all zeros and short input', () => {
    expect(monthBars([]).every((b) => b.ratio === 0 && b.count === 0)).toBe(true);
  });
});
