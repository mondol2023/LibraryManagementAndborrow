import { useEffect, useState } from 'react';
import { Modal, Button, Alert, ErrorAlert } from '../ui';
import { UserPicker } from '../users/UserPicker';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../domain/permissions';
import { LOAN_PERIOD_DAYS, MAX_ACTIVE_BORROWS } from '../../domain/borrowStatus';
import { availability } from '../books/BookAvailability';

/**
 * One dialog serves both flows. Whether a borrower must be chosen is a
 * permission lookup, not a separate admin component.
 */
export function BorrowRequestModal({ book, open, onClose, onConfirm, isPending, error }) {
  const { can } = useAuth();
  const mustPickBorrower = can(Permission.BORROW_FOR_OTHERS);

  const [borrower, setBorrower] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (open) {
      setBorrower(null);
      setLocalError(null);
    }
  }, [open, book?.id]);

  if (!book) return null;

  const { available } = availability(book);

  const confirm = () => {
    if (mustPickBorrower && !borrower) {
      setLocalError('Choose which member this borrow is for.');
      return;
    }
    onConfirm({ bookId: book.id, userId: borrower?.id });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a borrow"
      description={book.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} isLoading={isPending} disabled={available <= 0}>
            {mustPickBorrower ? 'Borrow & approve' : 'Send request'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert error={error} />

        {mustPickBorrower && (
          <UserPicker value={borrower} onChange={setBorrower} error={localError} />
        )}

        <Alert tone="info">
          <ul className="list-inside list-disc space-y-1">
            <li>Loan period is {LOAN_PERIOD_DAYS} days from today.</li>
            <li>A member may hold at most {MAX_ACTIVE_BORROWS} active borrows.</li>
            <li>
              {mustPickBorrower
                ? 'Admin requests are approved immediately.'
                : 'An admin has to approve this request before you can collect the book.'}
            </li>
            <li>Returning late adds one penalty point per day overdue.</li>
          </ul>
        </Alert>

        {available <= 0 && (
          <Alert tone="danger">All copies of this book are currently on loan.</Alert>
        )}
      </div>
    </Modal>
  );
}
