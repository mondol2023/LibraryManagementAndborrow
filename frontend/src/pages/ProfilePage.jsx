import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardBody, Badge, Button, Alert, ErrorAlert, StatCard } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '../hooks/useQuery';
import { userApi } from '../api/userApi';
import { borrowApi } from '../api/borrowApi';
import { roleLabel } from '../domain/roles';
import { hasApiAccess } from '../domain/permissions';
import { isOpen, isOverdue, MAX_ACTIVE_BORROWS } from '../domain/borrowStatus';
import { fullName, initials, pluralize } from '../lib/format';

/** Account rows are declared once and read off the token claims. */
const ACCOUNT_FIELDS = Object.freeze([
  { key: 'username', label: 'Username', value: (user) => user.username },
  { key: 'email', label: 'Email', value: (user) => user.email || '—' },
  { key: 'first_name', label: 'First name', value: (user) => user.first_name || '—' },
  { key: 'last_name', label: 'Last name', value: (user) => user.last_name || '—' },
]);

export function ProfilePage() {
  const { user, logout } = useAuth();

  const penalties = useQuery(() => userApi.penalties(user.id), [user?.id], {
    enabled: Boolean(user?.id),
  });

  // `?user=` scopes the list for admins; for everyone else the API already
  // returns only their own records, so the same call is correct for both.
  const borrows = useQuery(() => borrowApi.list({ user: user.id }), [user?.id], {
    enabled: Boolean(user?.id),
  });

  const myBorrows = borrows.data ?? [];
  const name = fullName(user) || user?.username || '';
  const points = penalties.data?.penalty_points ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account and library standing."
        actions={
          <Button variant="secondary" onClick={logout}>
            Sign out
          </Button>
        }
      />

      <ErrorAlert error={penalties.error} />

      {!hasApiAccess(user) && (
        <Alert tone="warning" title="Limited account">
          Your role can sign in but the library endpoints are closed to it. An admin has to change
          your role before the catalog and borrowing become available.
        </Alert>
      )}

      <Card>
        <CardBody className="flex flex-wrap items-center gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700"
            aria-hidden="true"
          >
            {initials(name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900">{name}</p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
            <Badge tone="brand" className="mt-2">
              {roleLabel(user?.role)}
            </Badge>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active borrows"
          value={myBorrows.filter(isOpen).length}
          hint={`limit ${MAX_ACTIVE_BORROWS}`}
          tone="brand"
          icon="🔖"
          isLoading={borrows.isLoading}
        />
        <StatCard
          label="Overdue"
          value={myBorrows.filter(isOverdue).length}
          hint="past the due date"
          tone="danger"
          icon="⏰"
          isLoading={borrows.isLoading}
        />
        <StatCard
          label="Penalty points"
          value={points}
          hint={points > 0 ? pluralize(points, 'late day') : 'nothing outstanding'}
          tone={points > 0 ? 'warning' : 'success'}
          icon="⚠️"
          isLoading={penalties.isLoading}
        />
      </div>

      <Card>
        <CardHeader
          title="Account details"
          description="These come from your sign-in token. Ask an admin to change them."
        />
        <CardBody>
          <dl className="divide-y divide-slate-100 text-sm">
            {ACCOUNT_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">{field.label}</dt>
                <dd className="text-right font-medium text-slate-800">{field.value(user ?? {})}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
