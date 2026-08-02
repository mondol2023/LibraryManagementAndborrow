import { Link } from 'react-router-dom';
import { EmptyState, Card } from '../ui';

export function ForbiddenNotice({
  title = 'You do not have access to this page',
  description = 'Your account role does not permit this action. Contact a library admin if you think this is a mistake.',
}) {
  return (
    <Card>
      <EmptyState
        icon="🔒"
        title={title}
        description={description}
        action={
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 transition-colors hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        }
      />
    </Card>
  );
}
