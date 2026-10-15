import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookList from './BookList';
import type { Book } from '../types';

const book = (over: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Hobbit',
  author: 'J.R.R. Tolkien',
  status: 'planned',
  rating: 0,
  createdAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  ...over,
});

const setup = (b: Book) => {
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);
  render(<BookList books={[b]} hasActiveFilter={false} onUpdate={onUpdate} onDelete={onDelete} />);
  return { onUpdate, onDelete };
};

const isDisabled = (label: string) => (screen.getByLabelText(label) as HTMLButtonElement).disabled;

describe('BookList', () => {
  it('renders title and author', () => {
    setup(book());
    expect(screen.getByText('Der Hobbit')).toBeTruthy();
    expect(screen.getByText('J.R.R. Tolkien')).toBeTruthy();
  });

  it('changes status via dropdown', async () => {
    const { onUpdate } = setup(book());
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'reading' } });
    expect(onUpdate).toHaveBeenCalledWith('b1', { status: 'reading' });
    await waitFor(() => expect(isDisabled('Status')).toBe(false));
  });

  it('sets rating on star click', async () => {
    const { onUpdate } = setup(book());
    fireEvent.click(screen.getByLabelText('3 Sterne'));
    expect(onUpdate).toHaveBeenCalledWith('b1', { rating: 3 });
    await waitFor(() => expect(isDisabled('3 Sterne')).toBe(false));
  });

  it('clears rating when the current star is clicked again', async () => {
    const { onUpdate } = setup(book({ rating: 3 }));
    fireEvent.click(screen.getByLabelText('3 Sterne'));
    expect(onUpdate).toHaveBeenCalledWith('b1', { rating: 0 });
    await waitFor(() => expect(isDisabled('3 Sterne')).toBe(false));
  });

  it('disables row controls while an update is pending', () => {
    const onUpdate = vi.fn(() => new Promise<void>(() => {}));
    render(<BookList books={[book()]} hasActiveFilter={false} onUpdate={onUpdate} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('1 Stern'));
    expect(isDisabled('Status')).toBe(true);
    expect(isDisabled('Buch löschen')).toBe(true);
  });

  it('deletes', async () => {
    const { onDelete } = setup(book());
    fireEvent.click(screen.getByLabelText('Buch löschen'));
    expect(onDelete).toHaveBeenCalledWith('b1');
    await waitFor(() => expect(isDisabled('Buch löschen')).toBe(false));
  });

  it('shows empty state without filter', () => {
    render(<BookList books={[]} hasActiveFilter={false} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Noch keine Bücher')).toBeTruthy();
    expect(screen.getByText('Füge oben dein erstes Buch hinzu.')).toBeTruthy();
  });

  it('shows no-results state with active filter', () => {
    render(<BookList books={[]} hasActiveFilter={true} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Keine Treffer')).toBeTruthy();
    expect(screen.getByText('Passe Filter oder Suche an.')).toBeTruthy();
  });

  it('offers a working filter reset in the no-results state', () => {
    const onResetFilter = vi.fn();
    render(<BookList books={[]} hasActiveFilter={true} onUpdate={vi.fn()} onDelete={vi.fn()} onResetFilter={onResetFilter} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(onResetFilter).toHaveBeenCalledTimes(1);
  });
});
