import { cn } from '../../lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className ?? 'h-4 w-full')} />;
}

export function SkeletonList({ rows = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
