import type { BookStatus, StatusFilter } from './types';

export const STATUS_LABELS: Record<BookStatus, string> = {
  planned: 'Geplant',
  reading: 'Lese gerade',
  read: 'Gelesen',
};

export const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Alle',
  ...STATUS_LABELS,
};
