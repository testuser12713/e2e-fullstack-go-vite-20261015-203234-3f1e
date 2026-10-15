export type BookStatus = 'planned' | 'reading' | 'read';
export type StatusFilter = 'all' | BookStatus;

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  /** 0..5, 0 = unrated */
  rating: number;
  /** RFC3339 */
  createdAt: string;
  /** RFC3339 or null */
  finishedAt: string | null;
}

export interface Stats {
  year: number;
  readCount: number;
  /** 12 entries, index 0 = January */
  monthly: number[];
  averageRating: number | null;
  statusCounts: { planned: number; reading: number; read: number };
}

export interface NewBook {
  title: string;
  author: string;
}

export type BookPatch = Partial<{ title: string; author: string; status: BookStatus; rating: number }>;
