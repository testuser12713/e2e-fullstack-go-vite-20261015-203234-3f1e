import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

// FilterBar stand-in honoring the contract: tabs + a search input with its own internal state.
vi.mock('./components/FilterBar', () => {
  function MockFilterBar(props: { status: string; onStatusChange: (s: never) => void; onQueryChange: (q: string) => void }) {
    const [text, setText] = useState('');
    return (
      <div>
        {['all', 'planned', 'reading', 'read'].map((s) => (
          <button key={s} role="tab" aria-selected={props.status === s} onClick={() => props.onStatusChange(s as never)}>
            {s === 'all' ? 'Alle' : s}
          </button>
        ))}
        <input
          aria-label="Suche"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            props.onQueryChange(e.target.value);
          }}
        />
      </div>
    );
  }
  return { default: MockFilterBar, FilterBar: MockFilterBar };
});

vi.mock('./api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/client')>();
  return {
    ...actual,
    listBooks: vi.fn(),
    getStats: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
    deleteBook: vi.fn(),
  };
});

import * as client from './api/client';
import App from './App';

const stats = { year: 2025, readCount: 0, monthly: Array(12).fill(0), averageRating: null, statusCounts: { planned: 0, reading: 0, read: 0 } };

beforeEach(() => {
  vi.mocked(client.listBooks).mockReset();
  vi.mocked(client.getStats).mockReset();
});

describe('App shell', () => {
  it('renders header and a loading indicator while loading', () => {
    vi.mocked(client.listBooks).mockReturnValue(new Promise(() => {}));
    vi.mocked(client.getStats).mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Meine Leseliste' })).toBeInTheDocument();
    expect(screen.getByText('Lädt …')).toBeInTheDocument();
  });

  it('loads books and stats on start', async () => {
    vi.mocked(client.listBooks).mockResolvedValue([]);
    vi.mocked(client.getStats).mockResolvedValue(stats);
    render(<App />);
    expect(await screen.findByText('0 Bücher')).toBeInTheDocument();
    expect(client.listBooks).toHaveBeenCalledWith({ status: undefined, q: undefined });
    expect(screen.queryByText('Lädt …')).not.toBeInTheDocument();
  });

  it('shows a German error when the API is unreachable', async () => {
    vi.mocked(client.listBooks).mockRejectedValue(new client.ApiError(0, 'x'));
    vi.mocked(client.getStats).mockResolvedValue(stats);
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server nicht erreichbar');
  });

  it('shows the API error message prefixed with Fehler', async () => {
    vi.mocked(client.listBooks).mockResolvedValue([]);
    vi.mocked(client.getStats).mockRejectedValue(new client.ApiError(400, 'invalid year'));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Fehler: invalid year');
  });
});

describe('filter reset', () => {
  const book = { id: '1', title: 'Dune', author: 'Herbert', status: 'planned' as const, rating: 0, createdAt: '2025-01-01T00:00:00Z', finishedAt: null };

  it('clears search and status and shows the full list again', async () => {
    vi.mocked(client.getStats).mockResolvedValue(stats);
    vi.mocked(client.listBooks).mockImplementation(async (p) => (p?.q || p?.status ? [] : [book]));
    render(<App />);
    expect(await screen.findByText('Dune')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'read' }));
    fireEvent.change(screen.getByLabelText('Suche'), { target: { value: 'zzz' } });
    expect(await screen.findByText('Keine Treffer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alle' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Suche')).toHaveValue('');
    await waitFor(() => expect(client.listBooks).toHaveBeenLastCalledWith({ status: undefined, q: undefined }));
  });
});
