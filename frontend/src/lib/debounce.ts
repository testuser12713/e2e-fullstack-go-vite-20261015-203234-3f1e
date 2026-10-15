import { useEffect, useState } from 'react';

/** Returns `value` once it has stayed unchanged for `delayMs` milliseconds. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), Math.max(0, delayMs));
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
