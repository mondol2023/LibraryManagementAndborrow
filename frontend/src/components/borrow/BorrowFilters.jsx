import { Input, Select, Button } from '../ui';
import { BORROW_STATUS_OPTIONS } from '../../domain/borrowStatus';

export const EMPTY_BORROW_FILTERS = Object.freeze({
  status: '',
  from_date: '',
  to_date: '',
});

/** Drops blank values so the query string only carries real filters. */
export const toBorrowQuery = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null));

export function BorrowFilters({ filters, onChange, children }) {
  const update = (key) => (event) => onChange({ ...filters, [key]: event.target.value });
  const isDirty = Object.values(filters).some(Boolean);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        value={filters.status}
        onChange={update('status')}
        placeholder="All statuses"
        options={BORROW_STATUS_OPTIONS}
        aria-label="Filter by status"
      />
      <Input type="date" value={filters.from_date} onChange={update('from_date')} aria-label="From date" />
      <Input type="date" value={filters.to_date} onChange={update('to_date')} aria-label="To date" />

      <div className="flex items-center gap-2">
        {children}
        {isDirty && (
          <Button variant="ghost" onClick={() => onChange(EMPTY_BORROW_FILTERS)}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
