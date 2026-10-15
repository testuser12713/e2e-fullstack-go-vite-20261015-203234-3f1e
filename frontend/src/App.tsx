import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './api/client';
import { ApiError } from './api/client';
import AddBookForm from './components/AddBookForm';
import BookList from './components/BookList';
import FilterBar from './components/FilterBar';
import StatsPanel from './components/StatsPanel';
import type { Book, BookPatch, NewBook, Stats, StatusFilter } from './types';

const UNREACHABLE = 'Server nicht erreichbar. Bitte später erneut versuchen.';

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 0 ? UNREACHABLE : `Fehler: ${err.message}`;
  }
  if (err instanceof Error && err.message) return `Fehler: ${err.message}`;
  return 'Fehler: Unbekannter Fehler.';
}

function bookCount(n: number): string {
  return n === 1 ? '1 Buch' : `${n} Bücher`;
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  // Bumped on reset so FilterBar remounts and its internal search input clears.
  const [filterKey, setFilterKey] = useState(0);
  const onResetFilter = useCallback(() => {
    setStatus('all');
    setQuery('');
    setFilterKey((k) => k + 1);
  }, []);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [nextBooks, nextStats] = await Promise.all([
        api.listBooks({ status: status === 'all' ? undefined : status, q: query || undefined }),
        api.getStats(),
      ]);
      if (id !== requestId.current) return;
      setBooks(nextBooks);
      setStats(nextStats);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      }
      await refresh();
    },
    [refresh],
  );

  const onAdd = useCallback((input: NewBook) => mutate(() => api.createBook(input)), [mutate]);
  const onUpdate = useCallback(
    (id: string, patch: BookPatch) => mutate(() => api.updateBook(id, patch)),
    [mutate],
  );
  const onDelete = useCallback((id: string) => mutate(() => api.deleteBook(id)), [mutate]);

  const total = stats
    ? stats.statusCounts.planned + stats.statusCounts.reading + stats.statusCounts.read
    : null;
  const hasActiveFilter = status !== 'all' || query.trim() !== '';
  const initialLoad = loading && books.length === 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Meine Leseliste</h1>
        {total !== null && <p className="app-subtitle">{bookCount(total)}</p>}
      </header>
      <div className="app-layout">
        <main className="app-main">
          <AddBookForm onAdd={onAdd} />
          <div className="toolbar">
            <FilterBar key={filterKey} status={status} onStatusChange={setStatus} onQueryChange={setQuery} />
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <span className="error-banner__icon" aria-hidden="true">!</span>
              <span className="error-banner__text">{error}</span>
              <div className="error-banner__actions">
                <button type="button" className="btn btn--secondary btn--small" onClick={() => void refresh()}>
                  Erneut versuchen
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label="Schließen"
                  onClick={() => setError(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <section className="card list-card" aria-busy={loading}>
            {initialLoad ? (
              <div className="loading" data-testid="loading-indicator">
                <span className="visually-hidden">Lädt …</span>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : (
              <BookList
                books={books}
                hasActiveFilter={hasActiveFilter}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onResetFilter={onResetFilter}
              />
            )}
          </section>
        </main>
        <aside className="app-aside">
          <StatsPanel stats={stats} />
        </aside>
      </div>
    </div>
  );
}
