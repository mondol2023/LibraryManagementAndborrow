import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, DataTable, EmptyState, ErrorAlert, Button } from '../components/ui';
import { BorrowFilters, EMPTY_BORROW_FILTERS } from '../components/borrow/BorrowFilters';
import { borrowColumns, actionsColumn } from '../components/borrow/borrowColumns';
import { BorrowRowActions } from '../components/borrow/BorrowRowActions';
import { useBorrowList } from '../hooks/useBorrowList';
import { useBorrowActions } from '../hooks/useBorrowActions';
import { BorrowStatus } from '../domain/borrowStatus';
import { pluralize } from '../lib/format';

/** The queue opens on what needs a decision; the filters can widen it. */
const PENDING_FIRST = Object.freeze({ ...EMPTY_BORROW_FILTERS, status: BorrowStatus.PENDING });

export function BorrowRequestsPage() {
  const list = useBorrowList(PENDING_FIRST);
  const actions = useBorrowActions(list.refetch);

  const columns = [
    borrowColumns.book,
    borrowColumns.borrower,
    borrowColumns.status,
    borrowColumns.borrowedOn,
    borrowColumns.dueDate,
    borrowColumns.verifiedBy,
    actionsColumn((row) => <BorrowRowActions borrow={row} actions={actions} />),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrow requests"
        description={
          list.isLoading ? 'Loading requests…' : `${pluralize(list.rows.length, 'request')} in view.`
        }
        actions={
          <Button variant="secondary" onClick={list.refetch}>
            Refresh
          </Button>
        }
      />

      <ErrorAlert error={list.error} />

      <Card>
        <CardBody>
          <BorrowFilters filters={list.filters} onChange={list.setFilters}>
            <Button variant="ghost" onClick={list.reset}>
              Pending only
            </Button>
          </BorrowFilters>
        </CardBody>

        <DataTable
          columns={columns}
          rows={list.rows}
          isLoading={list.isLoading}
          empty={
            <EmptyState
              icon="✅"
              title="Queue is clear"
              description="No borrow requests match these filters."
            />
          }
        />
      </Card>
    </div>
  );
}
