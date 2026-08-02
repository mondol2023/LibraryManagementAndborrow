import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Card,
  CardBody,
  Input,
  Badge,
  Button,
  EmptyState,
  ErrorAlert,
  Pagination,
  SkeletonList,
} from '../components/ui';
import { useQuery } from '../hooks/useQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchApi, SearchResource } from '../api/searchApi';
import { roleLabel } from '../domain/roles';
import { pluralize } from '../lib/format';

const PAGE_SIZE = 10;

/**
 * How a hit is drawn is looked up by resource name. The backend decides which
 * resources this account may search; registering a new one here is one entry,
 * and an unknown resource simply falls back to its raw label.
 */
const HIT_RENDERERS = Object.freeze({
  [SearchResource.BOOKS]: {
    label: 'Books',
    icon: '📚',
    render: (hit) => (
      <Link to={`/books/${hit.id}`} className="block px-5 py-4 transition-colors hover:bg-brand-50/50">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{hit.title}</p>
          <Badge tone={Number(hit.available_copies) > 0 ? 'success' : 'danger'}>
            {hit.available_copies}/{hit.total_copies}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {hit.author?.name || 'Unknown author'}
          {hit.category?.name && <> · {hit.category.name}</>}
        </p>
        {hit.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{hit.description}</p>
        )}
      </Link>
    ),
  },

  [SearchResource.USERS]: {
    label: 'Members',
    icon: '👥',
    render: (hit) => (
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {[hit.first_name, hit.last_name].filter(Boolean).join(' ') || hit.username}
          </p>
          <p className="text-xs text-slate-500">
            @{hit.username} · {hit.email}
            {hit.reference_number && <> · ref {hit.reference_number}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {Number(hit.penalty_points) > 0 && (
            <Badge tone="warning">{pluralize(hit.penalty_points, 'point')}</Badge>
          )}
          <Badge tone="neutral">{roleLabel(hit.role)}</Badge>
        </div>
      </div>
    ),
  },
});

const rendererFor = (name) =>
  HIT_RENDERERS[name] ?? { label: name, icon: '🔍', render: (hit) => JSON.stringify(hit) };

export function SearchPage() {
  const [term, setTerm] = useState('');
  const [resource, setResource] = useState(SearchResource.BOOKS);
  const [page, setPage] = useState(1);

  const debounced = useDebouncedValue(term, 300);
  const isReady = debounced.trim().length > 1;

  // The backend answers which resources this account may search.
  const index = useQuery(() => searchApi.index(), []);
  const resources = useMemo(() => index.data ?? [], [index.data]);

  // Fall back to the first allowed resource if books are off-limits.
  useEffect(() => {
    if (resources.length > 0 && !resources.some((entry) => entry.resource === resource)) {
      setResource(resources[0].resource);
    }
  }, [resources, resource]);

  useEffect(() => setPage(1), [debounced, resource]);

  const results = useQuery(
    () => searchApi.query(resource, { q: debounced, page, pageSize: PAGE_SIZE }),
    [resource, debounced, page],
    { enabled: isReady },
  );

  const hits = results.data?.results ?? [];
  const total = results.data?.total ?? 0;
  const active = rendererFor(resource);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Full-text search across the library index."
      />

      <ErrorAlert error={index.error ?? results.error} />

      <Card>
        <CardBody className="space-y-4">
          <Input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search titles, authors, descriptions…"
            autoComplete="off"
            aria-label="Search term"
          />

          {resources.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {resources.map((entry) => {
                const meta = rendererFor(entry.resource);
                const isActive = entry.resource === resource;
                return (
                  <Button
                    key={entry.resource}
                    size="sm"
                    variant={isActive ? 'primary' : 'secondary'}
                    onClick={() => setResource(entry.resource)}
                  >
                    <span aria-hidden="true">{meta.icon}</span>
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        {!isReady ? (
          <EmptyState
            icon="🔍"
            title="Type to search"
            description="Enter at least two characters to query the index."
          />
        ) : results.isLoading ? (
          <SkeletonList rows={5} className="p-5" />
        ) : hits.length === 0 ? (
          <EmptyState
            icon={active.icon}
            title="No matches"
            description={`Nothing in ${active.label.toLowerCase()} matches “${debounced}”.`}
          />
        ) : (
          <>
            <p className="border-b border-slate-200 px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
              {pluralize(total, 'match', 'matches')} in {active.label.toLowerCase()}
            </p>
            <ul className="divide-y divide-slate-100">
              {hits.map((hit) => (
                <li key={hit.id}>{active.render(hit)}</li>
              ))}
            </ul>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
