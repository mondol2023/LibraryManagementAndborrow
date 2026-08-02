import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { roleLabel } from '../../domain/roles';
import { fullName, initials } from '../../lib/format';
import { Button } from '../ui';

export function Topbar({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const name = fullName(user) || user?.username || 'Account';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="-ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm.75 3.5a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <Link to="/profile" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(name)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium text-slate-900">{name}</span>
            <span className="block text-xs text-slate-500">{roleLabel(user?.role)}</span>
          </span>
        </Link>

        <Button variant="secondary" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
