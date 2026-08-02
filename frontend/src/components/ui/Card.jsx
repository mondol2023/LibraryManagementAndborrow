import { cn } from '../../lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl bg-white shadow-sm ring-1 ring-slate-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4',
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3', className)}>
      {children}
    </div>
  );
}
