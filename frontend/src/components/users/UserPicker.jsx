import { useState } from 'react';
import { searchApi, SearchResource } from '../../api/searchApi';
import { useQuery } from '../../hooks/useQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Field, Input, Spinner } from '../ui';
import { roleLabel } from '../../domain/roles';
import { cn } from '../../lib/cn';

/**
 * Admin-only member lookup. The API has no "list users" endpoint, so this rides
 * on the Elasticsearch `users` resource — which is exactly what the backend's
 * SearchAccessPolicy grants admins.
 */
export function UserPicker({ value, onChange, label = 'Borrower', error }) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);

  const { data, isLoading } = useQuery(
    () => searchApi.query(SearchResource.USERS, { q: debounced, pageSize: 8 }),
    [debounced],
    { enabled: debounced.trim().length > 1 },
  );

  const results = data?.results ?? [];

  if (value) {
    return (
      <Field label={label} error={error}>
        {() => (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
            <span>
              <span className="font-medium text-slate-900">{value.username}</span>
              <span className="ml-2 text-xs text-slate-500">{roleLabel(value.role)}</span>
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Change
            </button>
          </div>
        )}
      </Field>
    );
  }

  return (
    <Field label={label} error={error} hint="Search by username, email or reference number.">
      {({ id, invalid, describedBy }) => (
        <div className="space-y-2">
          <div className="relative">
            <Input
              id={id}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Start typing a name…"
              invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
            />
            {isLoading && (
              <Spinner className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            )}
          </div>

          {debounced.trim().length > 1 && (
            <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200">
              {results.length === 0 && !isLoading && (
                <li className="px-3 py-2 text-sm text-slate-500">No members found.</li>
              )}
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => onChange(user)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                      'transition-colors hover:bg-brand-50',
                    )}
                  >
                    <span>
                      <span className="font-medium text-slate-900">{user.username}</span>
                      <span className="block text-xs text-slate-500">{user.email}</span>
                    </span>
                    <span className="text-xs text-slate-500">{roleLabel(user.role)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}
