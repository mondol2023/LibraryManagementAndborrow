import { Link } from 'react-router-dom';
import { BorrowStatusBadge } from './BorrowStatusBadge';
import { formatDate, formatDueDate } from '../../lib/format';

/**
 * The borrow table is assembled from named column definitions rather than
 * written out per page. "My borrows" and the admin queue differ only in which
 * of these they pick — the rendering itself is never duplicated.
 */
export const borrowColumns = {
  book: {
    key: 'book',
    header: 'Book',
    render: (row) => (
      <div>
        <Link to={`/books/${row.book_id}`} className="font-medium text-slate-900 hover:text-brand-700">
          {row.book_name || `Book #${row.book_id}`}
        </Link>
        {/* Dashboard rows carry no author/category, so the line is optional. */}
        {(row.author_name || row.category_name) && (
          <p className="text-xs text-slate-500">
            {[row.author_name, row.category_name].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    ),
  },

  borrower: {
    key: 'borrower',
    header: 'Borrower',
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.user_name || `User #${row.user_id}`}</p>
        {row.submitted_by_name && row.submitted_by_name !== row.user_name && (
          <p className="text-xs text-slate-500">requested by {row.submitted_by_name}</p>
        )}
      </div>
    ),
  },

  status: {
    key: 'status',
    header: 'Status',
    render: (row) => <BorrowStatusBadge borrow={row} />,
  },

  borrowedOn: {
    key: 'borrow_date',
    header: 'Borrowed',
    render: (row) => formatDate(row.borrow_date),
  },

  dueDate: {
    key: 'due_date',
    header: 'Due',
    render: (row) => (
      <span className={row.return_date ? 'text-slate-500' : undefined}>
        {formatDueDate(row.due_date, row.return_date)}
      </span>
    ),
  },

  returnedOn: {
    key: 'return_date',
    header: 'Returned',
    render: (row) => formatDate(row.return_date),
  },

  verifiedBy: {
    key: 'verified_by',
    header: 'Verified by',
    render: (row) => row.verified_by_name || '—',
  },
};

/** `actions(row)` is supplied by the page that knows which actions apply. */
export const actionsColumn = (render) => ({
  key: 'actions',
  header: '',
  align: 'right',
  className: 'whitespace-nowrap',
  render,
});
