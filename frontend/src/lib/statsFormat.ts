export const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** One decimal with German decimal comma; '–' when there is no average. */
export function formatAverage(avg: number | null): string {
  if (avg === null || avg === undefined || !Number.isFinite(avg)) return '–';
  return avg.toFixed(1).replace('.', ',');
}

/** Always 12 bars; ratio is relative to the busiest month (0 when all are zero). */
export function monthBars(monthly: number[]): { label: string; count: number; ratio: number }[] {
  const counts = MONTH_LABELS.map((_, i) => {
    const v = Array.isArray(monthly) ? monthly[i] : 0;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
  });
  const max = Math.max(0, ...counts);
  return counts.map((count, i) => ({ label: MONTH_LABELS[i], count, ratio: max > 0 ? count / max : 0 }));
}

export function booksLabel(n: number): string {
  return n === 1 ? '1 Buch' : `${n} Bücher`;
}
