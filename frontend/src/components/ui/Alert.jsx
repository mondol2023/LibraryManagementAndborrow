import { cn } from '../../lib/cn';
import { toneStyles } from './tones';

export function Alert({ tone = 'danger', title, children, className }) {
  if (!title && !children) return null;

  return (
    <div
      className={cn('rounded-xl px-4 py-3 text-sm ring-1 ring-inset', toneStyles(tone).surface, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div>}
    </div>
  );
}

/**
 * Renders an ApiError (or anything with `.message`) without every page
 * re-deciding how to unwrap it.
 */
export function ErrorAlert({ error, className }) {
  if (!error) return null;
  return (
    <Alert tone="danger" className={className}>
      {error.message || 'Something went wrong. Please try again.'}
    </Alert>
  );
}
