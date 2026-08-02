import { Badge } from '../ui';
import { borrowStatusMeta, isOverdue } from '../../domain/borrowStatus';

export function BorrowStatusBadge({ borrow }) {
  const { label, tone } = borrowStatusMeta(borrow.status);

  // Overdue is a derived state, not a stored one — the backend only computes a
  // penalty at return time, so the UI surfaces it here.
  if (isOverdue(borrow)) {
    return <Badge tone="danger">Overdue</Badge>;
  }

  return <Badge tone={tone}>{label}</Badge>;
}
