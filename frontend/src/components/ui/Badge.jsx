import { cn } from '../../lib/cn';
import { toneStyles } from './tones';

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneStyles(tone).badge,
        className,
      )}
    >
      {children}
    </span>
  );
}
