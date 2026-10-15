import { describe, expect, it } from 'vitest';
import { nextRating } from './rating';

describe('nextRating', () => {
  it('sets the clicked value', () => {
    expect(nextRating(0, 3)).toBe(3);
    expect(nextRating(5, 2)).toBe(2);
  });
  it('clears when the current rating is clicked again', () => {
    expect(nextRating(3, 3)).toBe(0);
  });
});
