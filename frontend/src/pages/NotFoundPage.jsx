import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <EmptyState
      icon="🧭"
      title="Page not found"
      description="That address does not exist in the library."
      action={
        <Link
          to="/"
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      }
    />
  );
}
