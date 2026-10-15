import { useRef, useState, type FormEvent, type Ref } from 'react';
import type { NewBook } from '../types';
import './AddBookForm.css';

export interface AddBookFormProps {
  onAdd: (input: NewBook) => Promise<void>;
}

export const MAX_FIELD_LENGTH = 200;

type Field = 'title' | 'author';

/** Mirrors the backend's NormalizeField: trimmed, non-empty, max 200 characters. */
export function validateField(field: Field, value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return field === 'title' ? 'Bitte einen Titel eingeben.' : 'Bitte einen Autor eingeben.';
  }
  if (Array.from(trimmed).length > MAX_FIELD_LENGTH) return 'Maximal 200 Zeichen.';
  return null;
}

export default function AddBookForm({ onAdd }: AddBookFormProps) {
  const [values, setValues] = useState<Record<Field, string>>({ title: '', author: '' });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ title: false, author: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Shown when onAdd rejects, so a failed add is visible in the form itself even when
  // App's error banner already displays the same text (e.g. after a failed initial load).
  const [submitFailed, setSubmitFailed] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const errors: Record<Field, string | null> = {
    title: validateField('title', values.title),
    author: validateField('author', values.author),
  };
  const visibleError = (f: Field) => (touched[f] || submitAttempted ? errors[f] : null);

  const change = (f: Field, v: string) => {
    setValues((prev) => ({ ...prev, [f]: v }));
    setTouched((prev) => ({ ...prev, [f]: true }));
    setSubmitFailed(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitAttempted(true);
    setSubmitFailed(false);
    if (errors.title || errors.author) return;
    setSubmitting(true);
    try {
      await onAdd({ title: values.title.trim(), author: values.author.trim() });
      setValues({ title: '', author: '' });
      setTouched({ title: false, author: false });
      setSubmitAttempted(false);
      setSubmitting(false);
      // Inputs are disabled while submitting; focus once they are re-enabled.
      setTimeout(() => titleRef.current?.focus(), 0);
    } catch {
      // Keep the input; App shows the error details in its banner.
      setSubmitting(false);
      setSubmitFailed(true);
    }
  };

  const renderField = (f: Field, label: string, ref?: Ref<HTMLInputElement>) => {
    const err = visibleError(f);
    const id = `add-book-${f}`;
    return (
      <div className="add-book-form__field">
        <label className="add-book-form__label" htmlFor={id}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          name={f}
          type="text"
          className={err ? 'input input--error' : 'input'}
          value={values[f]}
          onChange={(e) => change(f, e.target.value)}
          disabled={submitting}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
        />
        {err && (
          <p id={`${id}-error`} className="add-book-form__error">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="card add-book-form" aria-labelledby="add-book-heading">
      <h2 id="add-book-heading" className="add-book-form__heading">
        Buch hinzufügen
      </h2>
      <form className="add-book-form__row" onSubmit={handleSubmit} noValidate>
        {renderField('title', 'Titel', titleRef)}
        {renderField('author', 'Autor')}
        <button type="submit" className="btn btn--primary add-book-form__submit" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          Hinzufügen
        </button>
      </form>
      {submitFailed && (
        <p className="add-book-form__error add-book-form__status" role="alert">
          Das Buch konnte nicht hinzugefügt werden. Deine Eingaben bleiben erhalten.
        </p>
      )}
    </section>
  );
}
export { AddBookForm };
