import { useState } from 'react';
import type { Book, BookPatch, BookStatus } from '../types';
import { STATUS_LABELS } from '../labels';
import StarRating from './StarRating';
import './BookList.css';

export interface BookListProps {
  books: Book[];
  hasActiveFilter: boolean;
  onUpdate: (id: string, patch: BookPatch) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Resets status filter and search (DESIGN.md empty state). The button renders only when provided. */
  onResetFilter?: () => void;
}

const STATUSES = Object.keys(STATUS_LABELS) as BookStatus[];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type RowProps = { book: Book } & Pick<BookListProps, 'onUpdate' | 'onDelete'>;

function BookRow({ book, onUpdate, onDelete }: RowProps) {
  const [pending, setPending] = useState(false);

  // The parent (App) shows the error banner for failed actions; the row only tracks pending state.
  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    try {
      await fn();
    } catch {
      /* reported by the parent via its error banner */
    } finally {
      setPending(false);
    }
  };

  return (
    <li className={`book-row${pending ? ' is-pending' : ''}`}>
      <div className="book-row__text">
        <span className="book-row__title">{book.title}</span>
        <span className="book-row__author">{book.author}</span>
        {book.finishedAt && (
          <span className="book-row__finished">Gelesen am {formatDate(book.finishedAt)}</span>
        )}
      </div>
      <div className="book-row__controls">
        <select
          className={`status-select status-select--${book.status}`}
          aria-label="Status"
          value={book.status}
          disabled={pending}
          onChange={(e) => {
            const status = e.target.value as BookStatus;
            void run(() => onUpdate(book.id, { status }));
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <StarRating
          value={book.rating}
          disabled={pending}
          onChange={(rating) => void run(() => onUpdate(book.id, { rating }))}
        />
        <button
          type="button"
          className="delete-button"
          aria-label="Buch löschen"
          title="Löschen"
          disabled={pending}
          onClick={() => void run(() => onDelete(book.id))}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </li>
  );
}

export default function BookList({ books, hasActiveFilter, onUpdate, onDelete, onResetFilter }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="book-list book-list--empty">
        <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5" />
        </svg>
        {hasActiveFilter ? (
          <>
            <p className="book-list__empty-title">Keine Treffer</p>
            <p className="book-list__empty-sub">Passe Filter oder Suche an.</p>
            {onResetFilter && (
              <button type="button" className="book-list__reset" onClick={onResetFilter}>
                Filter zurücksetzen
              </button>
            )}
          </>
        ) : (
          <>
            <p className="book-list__empty-title">Noch keine Bücher</p>
            <p className="book-list__empty-sub">Füge oben dein erstes Buch hinzu.</p>
          </>
        )}
      </div>
    );
  }
  return (
    <ul className="book-list">
      {books.map((b) => (
        <BookRow key={b.id} book={b} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
}
export { BookList };
