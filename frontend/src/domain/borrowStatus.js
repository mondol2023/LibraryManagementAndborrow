/**
 * Everything the UI needs to know about a borrow's lifecycle: the labels, the
 * badge colours, and which actions each state permits. Views read from this
 * table instead of writing `status === 'pending'` checks of their own.
 */
export const BorrowStatus = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  RETURNED: 'returned',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

export const BORROW_STATUS_META = Object.freeze({
  [BorrowStatus.PENDING]: { label: 'Pending', tone: 'warning' },
  [BorrowStatus.ACCEPTED]: { label: 'Borrowed', tone: 'info' },
  [BorrowStatus.RETURNED]: { label: 'Returned', tone: 'success' },
  [BorrowStatus.REJECTED]: { label: 'Rejected', tone: 'danger' },
  [BorrowStatus.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
});

export const BORROW_STATUS_OPTIONS = Object.entries(BORROW_STATUS_META).map(
  ([value, { label }]) => ({ value, label }),
);

export const borrowStatusMeta = (status) =>
  BORROW_STATUS_META[status] ?? { label: status ?? 'Unknown', tone: 'neutral' };

/** Decisions `BorrowBookVerifyAPIView` accepts, and only while still pending. */
export const VERIFY_DECISIONS = Object.freeze([
  { value: BorrowStatus.ACCEPTED, label: 'Approve', intent: 'primary' },
  { value: BorrowStatus.REJECTED, label: 'Reject', intent: 'danger' },
  { value: BorrowStatus.CANCELLED, label: 'Cancel', intent: 'ghost' },
]);

export const isVerifiable = (borrow) => borrow?.status === BorrowStatus.PENDING;

/** `ReturnBookView` only accepts an accepted, still-active, unreturned row. */
export const isReturnable = (borrow) =>
  borrow?.status === BorrowStatus.ACCEPTED && !borrow?.return_date;

/** Counts against the 3-borrow cap enforced in `BorrowBookAPIView.post`. */
export const isOpen = (borrow) =>
  [BorrowStatus.PENDING, BorrowStatus.ACCEPTED].includes(borrow?.status) &&
  !borrow?.return_date;

export const isOverdue = (borrow) => {
  if (!borrow?.due_date || borrow.return_date) return false;
  return new Date(borrow.due_date) < new Date(new Date().toDateString());
};

/** Kept in sync with the limit hard-coded in `BorrowBookAPIView`. */
export const MAX_ACTIVE_BORROWS = 3;

/** Loan length applied by the backend (`today + 14 days`). */
export const LOAN_PERIOD_DAYS = 14;
