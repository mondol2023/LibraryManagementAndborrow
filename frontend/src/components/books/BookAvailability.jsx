import { Badge } from '../ui';

/**
 * Availability is derived from `available_copies` in exactly one place, so the
 * catalog, the detail page and the borrow dialog can never disagree.
 */
export const availability = (book) => {
  const available = Number(book?.available_copies ?? 0);
  const total = Number(book?.total_copies ?? 0);

  if (available <= 0) return { available, total, tone: 'danger', label: 'All copies out' };
  if (available === 1) return { available, total, tone: 'warning', label: 'Last copy' };
  return { available, total, tone: 'success', label: `${available} available` };
};

export const isBorrowable = (book) => Number(book?.available_copies ?? 0) > 0;

export function BookAvailability({ book }) {
  const { tone, label, available, total } = availability(book);
  return (
    <Badge tone={tone}>
      {label}
      {total > 0 && <span className="opacity-70">· {available}/{total}</span>}
    </Badge>
  );
}
