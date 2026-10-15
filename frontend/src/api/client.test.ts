import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createBook, deleteBook, getStats, listBooks, updateBook } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  // Isolate from the ambient VITE_API_BASE_URL (RUN.json injects an absolute origin).
  vi.stubEnv('VITE_API_BASE_URL', '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('api base url', () => {
  it('prefixes the configured base and strips trailing slashes', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:8080/');
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    await listBooks();
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:8080/api/books');
  });
});

describe('api client', () => {
  it('lists books without params', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    expect(await listBooks()).toEqual([]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/books');
  });

  it('combines status and q in the query string', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    await listBooks({ status: 'reading', q: 'tolkien & co' });
    const url = new URL(fetchMock.mock.calls[0][0] as string, 'http://x');
    expect(url.pathname).toBe('/api/books');
    expect(url.searchParams.get('status')).toBe('reading');
    expect(url.searchParams.get('q')).toBe('tolkien & co');
  });

  it('omits an empty q', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    await listBooks({ q: '  ' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/books');
  });

  it('posts a new book as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: '1' }));
    await createBook({ title: 'T', author: 'A' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/books');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ title: 'T', author: 'A' });
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('patches a book', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'a1' }));
    await updateBook('a1', { status: 'read', rating: 4 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/books/a1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ status: 'read', rating: 4 });
  });

  it('deletes a book and resolves on 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteBook('a1')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/books/a1');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('gets stats with and without year', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, { year: 2025 })));
    await getStats();
    await getStats(2024);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/stats');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/stats?year=2024');
  });

  it('maps a JSON error body into ApiError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: 'book not found' }));
    const err = await deleteBook('x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe('book not found');
  });

  it('maps a non-JSON error body into ApiError', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));
    const err = await listBooks().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
  });

  it('maps a network failure to status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await getStats().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});
