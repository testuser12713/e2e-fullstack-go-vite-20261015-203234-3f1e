import type { Book, BookPatch } from '../types';

export interface BookListProps {
  books: Book[];
  hasActiveFilter: boolean;
  onUpdate: (id: string, patch: BookPatch) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Stub: implemented by the book list ticket.
export default function BookList(_props: BookListProps) {
  return null;
}
export { BookList };
