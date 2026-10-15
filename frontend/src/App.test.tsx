import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
