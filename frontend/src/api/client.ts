import type { Book, BookPatch, BookStatus, NewBook, Stats } from '../types';

/** Error raised for network failures (status 0) and non-2xx responses. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function baseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return raw.replace(/\/+$/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(baseUrl() + path, init);
  } catch {
    throw new ApiError(0, 'Server nicht erreichbar. Bitte später erneut versuchen.');
  }
  if (!res.ok) {
    let message = `Anfrage fehlgeschlagen (${res.status})`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
        message = (body as { error: string }).error;
      }
    } catch {
      // body was not JSON; keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, 'Ungültige Antwort vom Server.');
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function listBooks(params?: { status?: BookStatus; q?: string }): Promise<Book[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  const q = params?.q?.trim();
  if (q) search.set('q', q);
  const qs = search.toString();
  return request<Book[]>(`/api/books${qs ? `?${qs}` : ''}`);
}

export function createBook(input: NewBook): Promise<Book> {
  return request<Book>('/api/books', jsonInit('POST', input));
}

export function updateBook(id: string, patch: BookPatch): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(id)}`, jsonInit('PATCH', patch));
}

export function deleteBook(id: string): Promise<void> {
  return request<void>(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getStats(year?: number): Promise<Stats> {
  return request<Stats>(year === undefined ? '/api/stats' : `/api/stats?year=${year}`);
}
