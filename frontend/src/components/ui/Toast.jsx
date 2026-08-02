import { cn } from '../../lib/cn';
import { toneStyles } from './tones';

/**
 * Presentation only — the queue lives in ToastProvider. Keeping the two apart
 * means the store can be tested without a DOM and restyled without touching it.
 */
export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ tone, message, onDismiss }) {
  const styles = toneStyles(tone);

  return (
    <div
      className={cn(
        'animate-in-up pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm shadow-lg ring-1',
        styles.surface,
      )}
    >
      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', styles.bar)} />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
