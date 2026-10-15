import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { StatusFilter } from '../types';
import { FILTER_LABELS } from '../labels';
import { useDebouncedValue } from '../lib/debounce';
import './FilterBar.css';

export interface FilterBarProps {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  onQueryChange: (q: string) => void;
}

const FILTERS: StatusFilter[] = ['all', 'planned', 'reading', 'read'];
export const SEARCH_DEBOUNCE_MS = 300;

export default function FilterBar({ status, onStatusChange, onQueryChange }: FilterBarProps) {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const lastEmitted = useRef('');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (debounced === lastEmitted.current) return;
    lastEmitted.current = debounced;
    onQueryChange(debounced);
  }, [debounced, onQueryChange]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % FILTERS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + FILTERS.length) % FILTERS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = FILTERS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    onStatusChange(FILTERS[next]);
  };

  const clear = () => {
    setText('');
    // Clearing is an explicit action: apply it immediately.
    lastEmitted.current = '';
    onQueryChange('');
  };

  return (
    <div className="filterbar">
      <div className="filterbar__tabs" role="tablist" aria-label="Status-Filter">
        {FILTERS.map((f, i) => {
          const active = f === status;
          return (
            <button
              key={f}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={`filterbar__tab${active ? ' filterbar__tab--active' : ''}`}
              onClick={() => onStatusChange(f)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {FILTER_LABELS[f]}
            </button>
          );
        })}
      </div>
      <div className="filterbar__search">
        <svg className="filterbar__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="filterbar__input"
          aria-label="Suche"
          placeholder="Titel oder Autor suchen …"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text !== '' && (
          <button type="button" className="filterbar__clear" aria-label="Suche löschen" onClick={clear}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
export { FilterBar };
