import type { StatusFilter } from '../types';

export interface FilterBarProps {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  onQueryChange: (q: string) => void;
}

// Stub: implemented by the filter tabs / search ticket.
export default function FilterBar(_props: FilterBarProps) {
  return null;
}
export { FilterBar };
