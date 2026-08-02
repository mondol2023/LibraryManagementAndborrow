import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Card,
  CardHeader,
  CardBody,
  DataTable,
  StatCard,
  ErrorAlert,
  EmptyState,
} from '../components/ui';
import { borrowColumns } from '../components/borrow/borrowColumns';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '../hooks/useQuery';
import { borrowApi } from '../api/borrowApi';
import { bookApi } from '../api/catalogApi';
import { userApi } from '../api/userApi';
import { Permission } from '../domain/permissions';
import { BorrowStatus, isOpen, isOverdue, MAX_ACTIVE_BORROWS } from '../domain/borrowStatus';
import { fullName, pluralize } from '../lib/format';

/**
 * The tiles are data, not markup. A new metric is one more row here — the
 * layout, the loading state and the permission filter stay untouched.
 * `stats` receives everything the page has already fetched.
 */
const STAT_CARDS = Object.freeze([
  {
    key: 'open',
    label: 'Active borrows',
    icon: '🔖',
    tone: 'brand',
    permission: null,
    value: ({ borrows }) => borrows.filter(isOpen).length,
    hint: ({ isAdmin }) => (isAdmin ? 'across all members' : `limit ${MAX_ACTIVE_BORROWS}`),
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: '⏰',
    tone: 'danger',
    permission: null,
    value: ({ borrows }) => borrows.filter(isOverdue).length,
    hint: () => 'past the due date',
  },
  {
    key: 'pending',
    label: 'Awaiting approval',
    icon: '✅',
    tone: 'warning',
    permission: Permission.VERIFY_BORROWS,
    value: ({ borrows }) => borrows.filter((row) => row.status === BorrowStatus.PENDING).length,
    hint: () => 'requests to review',
  },
  {
    key: 'catalog',
    label: 'Books in catalog',
    icon: '📚',
    tone: 'info',
    permission: Permission.VIEW_CATALOG,
    value: ({ books }) => books.length,
    hint: ({ books }) =>
      pluralize(
        books.reduce((total, book) => total + Number(book.available_copies ?? 0), 0),
        'copy',
        'copies',
      ) + ' on the shelf',
  },
  {
    key: 'penalty',
    label: 'Penalty points',
    icon: '⚠️',
    tone: 'neutral',
    permission: null,
    value: ({ penalties }) => penalties?.penalty_points ?? 0,
    hint: () => '1 point per day late',
  },
]);

const RECENT_COLUMNS = [
  borrowColumns.book,
  borrowColumns.borrower,
  borrowColumns.status,
  borrowColumns.dueDate,
];

export function DashboardPage() {
  const { user, can, isAdmin } = useAuth();

  const borrows = useQuery(() => borrowApi.list(), []);
  const books = useQuery(() => bookApi.list(), []);
  const penalties = useQuery(() => userApi.penalties(user.id), [user?.id], {
    enabled: Boolean(user?.id),
  });

  const context = {
    borrows: borrows.data ?? [],
    books: books.data ?? [],
    penalties: penalties.data,
    isAdmin,
  };

  const isLoading = borrows.isLoading || books.isLoading;
  const recent = context.borrows.slice(0, 6);

  // Admins get a queue of pending requests; members get their own history.
  const listTitle = can(Permission.VERIFY_BORROWS) ? 'Latest borrow activity' : 'Your recent borrows';
  const listLink = can(Permission.VERIFY_BORROWS)
    ? { to: '/requests', label: 'Review requests' }
    : { to: '/my-borrows', label: 'All my borrows' };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${fullName(user) || user?.username || 'there'}`}
        description="Here is where your library stands today."
      />

      <ErrorAlert error={borrows.error ?? books.error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STAT_CARDS.filter((card) => !card.permission || can(card.permission)).map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            value={card.value(context)}
            hint={card.hint(context)}
            isLoading={card.key === 'penalty' ? penalties.isLoading : isLoading}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title={listTitle}
          actions={
            <Link to={listLink.to} className="text-sm font-medium text-brand-700 hover:underline">
              {listLink.label}
            </Link>
          }
        />
        {!isLoading && recent.length === 0 ? (
          <CardBody className="p-0">
            <EmptyState
              icon="🔖"
              title="Nothing borrowed yet"
              description="Find a book in the catalog and send a borrow request."
              action={
                <Link
                  to="/books"
                  className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Browse books
                </Link>
              }
            />
          </CardBody>
        ) : (
          <DataTable columns={RECENT_COLUMNS} rows={recent} isLoading={isLoading} />
        )}
      </Card>
    </div>
  );
}
