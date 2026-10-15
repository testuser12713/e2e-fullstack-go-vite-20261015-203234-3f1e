import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddBookForm, { validateField } from './AddBookForm';

const button = () => screen.getByRole('button', { name: /Hinzufügen/ }) as HTMLButtonElement;
const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe('AddBookForm', () => {
  it('is neutral when untouched', () => {
    render(<AddBookForm onAdd={vi.fn()} />);
    expect(screen.queryByText('Bitte einen Titel eingeben.')).toBeNull();
    expect(screen.queryByText('Bitte einen Autor eingeben.')).toBeNull();
  });

  it('shows a field message only after typing into that field', async () => {
    const user = userEvent.setup();
    render(<AddBookForm onAdd={vi.fn()} />);
    await user.type(input('Titel'), '  ');
    expect(screen.getByText('Bitte einen Titel eingeben.')).toBeTruthy();
    expect(screen.queryByText('Bitte einen Autor eingeben.')).toBeNull();
  });

  it('shows all messages after a submit attempt and does not call onAdd', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);
    await user.click(button());
    expect(screen.getByText('Bitte einen Titel eingeben.')).toBeTruthy();
    expect(screen.getByText('Bitte einen Autor eingeben.')).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('validates max length like the backend', () => {
    expect(validateField('title', 'a'.repeat(200))).toBeNull();
    expect(validateField('title', 'a'.repeat(201))).toBe('Maximal 200 Zeichen.');
    expect(validateField('author', '  x  ')).toBeNull();
  });

  it('submits trimmed values, then clears and resets touched state', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddBookForm onAdd={onAdd} />);
    await user.type(input('Titel'), ' Momo ');
    await user.type(input('Autor'), 'Michael Ende');
    await user.click(button());
    expect(onAdd).toHaveBeenCalledWith({ title: 'Momo', author: 'Michael Ende' });
    await waitFor(() => expect(input('Titel').value).toBe(''));
    expect(input('Autor').value).toBe('');
    expect(screen.queryByText('Bitte einen Titel eingeben.')).toBeNull();
    expect(screen.queryByText('Bitte einen Autor eingeben.')).toBeNull();
  });

  it('disables the button while submitting and keeps input on failure', async () => {
    const user = userEvent.setup();
    let reject!: (e: Error) => void;
    const onAdd = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<AddBookForm onAdd={onAdd} />);
    await user.type(input('Titel'), 'Momo');
    await user.type(input('Autor'), 'Michael Ende');
    await user.click(button());
    expect(button().disabled).toBe(true);
    reject(new Error('boom'));
    await waitFor(() => expect(button().disabled).toBe(false));
    expect(input('Titel').value).toBe('Momo');
    expect(input('Autor').value).toBe('Michael Ende');
    expect(screen.getByRole('alert').textContent).toMatch('nicht hinzugefügt');
  });

  it('submits values written into the fields without input events (autofill)', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddBookForm onAdd={onAdd} />);
    await user.click(button());
    expect(screen.getByText('Bitte einen Titel eingeben.')).toBeTruthy();
    // Autofill-style: the DOM value changes, React's onChange never fires.
    input('Titel').value = 'Momo';
    input('Autor').value = 'Michael Ende';
    await user.click(button());
    expect(onAdd).toHaveBeenCalledWith({ title: 'Momo', author: 'Michael Ende' });
    await waitFor(() => expect(input('Titel').value).toBe(''));
    expect(screen.queryByText('Bitte einen Titel eingeben.')).toBeNull();
  });

  it('clears the failure message once the user edits a field', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockRejectedValue(new Error('boom'));
    render(<AddBookForm onAdd={onAdd} />);
    await user.type(input('Titel'), 'Momo');
    await user.type(input('Autor'), 'Michael Ende');
    await user.click(button());
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeNull());
    await user.type(input('Titel'), '!');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
