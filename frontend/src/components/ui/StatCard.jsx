import { cn } from '../../lib/cn';
import { toneStyles } from './tones';
import { Skeleton } from './Skeleton';

export function StatCard({ label, value, hint, tone = 'brand', icon, isLoading }) {
  const styles = toneStyles(tone);

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {icon && (
        <span
          className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg', styles.badge)}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-2 h-7 w-12" />
        ) : (
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        )}
        {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
