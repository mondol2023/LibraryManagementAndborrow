import { cn } from '../../lib/cn';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './Skeleton';

/**
 * Column-driven table. Callers describe *what* a column shows
 * (`{ key, header, render }`) and this owns *how* a table looks — so borrows,
 * books and users all render through the same component with no fork.
 */
export function DataTable({
  columns,
  rows,
  getRowKey = (row, index) => row?.id ?? index,
  isLoading = false,
  empty,
  onRowClick,
  className,
}) {
  if (isLoading) return <SkeletonList rows={5} className="p-5" />;

  if (!rows || rows.length === 0) {
    return empty ?? <EmptyState title="Nothing here yet" description="No records to display." />;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                  column.align === 'right' && 'text-right',
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : 'hover:bg-slate-50/70',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 align-middle text-slate-700',
                    column.align === 'right' && 'text-right',
                    column.className,
                  )}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
