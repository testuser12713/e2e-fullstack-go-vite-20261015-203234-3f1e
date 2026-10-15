/** Clicking the current rating clears it (0); otherwise the clicked value becomes the rating. */
export function nextRating(current: number, clicked: number): number {
  return current === clicked ? 0 : clicked;
}
