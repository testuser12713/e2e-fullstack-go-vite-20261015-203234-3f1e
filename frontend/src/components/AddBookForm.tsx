import type { NewBook } from '../types';

export interface AddBookFormProps {
  onAdd: (input: NewBook) => Promise<void>;
}

// Stub: implemented by the add-book form ticket.
export default function AddBookForm(_props: AddBookFormProps) {
  return null;
}
export { AddBookForm };
