import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';
import { visibleNavItems } from '../../config/navigation';

export function Sidebar({ isOpen, onNavigate }) {
  const { can } = useAuth();
  const items = visibleNavItems(can);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg text-white">
            📖
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Library</p>
            <p className="text-xs text-slate-500">Borrowing system</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
