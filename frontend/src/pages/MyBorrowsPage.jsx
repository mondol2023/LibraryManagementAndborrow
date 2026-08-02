import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, DataTable, EmptyState, ErrorAlert, Alert } from '../components/ui';
import { BorrowFilters } from '../components/borrow/BorrowFilters';
import { borrowColumns, actionsColumn } from '../components/borrow/borrowColumns';
import { BorrowRowActions } from '../components/borrow/BorrowRowActions';
import { useAuth } from '../hooks/useAuth';
import { useBorrowList } from '../hooks/useBorrowList';
import { useBorrowActions } from '../hooks/useBorrowActions';
import { isOpen, isOverdue, MAX_ACTIVE_BORROWS, LOAN_PERIOD_DAYS } from '../domain/borrowStatus';
import { pluralize } from '../lib/format';

export function MyBorrowsPage() {
  const { user } = useAuth();
  const list = useBorrowList();
  const actions = useBorrowActions(list.refetch);

  const columns = [
    borrowColumns.book,
    borrowColumns.status,
    borrowColumns.borrowedOn,
    borrowColumns.dueDate,
    borrowColumns.returnedOn,
    actionsColumn((row) => <BorrowRowActions borrow={row} actions={actions} ownerId={user?.id} />),
  ];

  const activeCount = list.rows.filter(isOpen).length;
  const overdueCount = list.rows.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My borrows"
        description={`Loans run for ${LOAN_PERIOD_DAYS} days. You may hold ${pluralize(
          MAX_ACTIVE_BORROWS,
          'book',
        )} at a time.`}
      />

      <ErrorAlert error={list.error} />

      {overdueCount > 0 && (
        <Alert tone="danger" title="Overdue books">
          {pluralize(overdueCount, 'loan')} past the due date. Each late day adds a penalty point.
        </Alert>
      )}

      <Card>
        <CardBody>
          <BorrowFilters filters={list.filters} onChange={list.setFilters} />
        </CardBody>

        <DataTable
          columns={columns}
          rows={list.rows}
          isLoading={list.isLoading}
          empty={
            <EmptyState
              icon="🔖"
              title="No borrows yet"
              description="Pick something from the catalog to get started."
              action={
                <Link
                  to="/books"
                  className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Browse books
                </Link>
              }
            />
          }
        />
      </Card>

      <p className="text-sm text-slate-500">
        {activeCount} of {MAX_ACTIVE_BORROWS} slots in use.
      </p>
    </div>
  );
}
