import { PageHeader } from '../components/layout/PageHeader';
import { Textarea } from '../components/ui';
import { LookupPanel } from '../components/catalog/LookupPanel';
import { useAuth } from '../hooks/useAuth';
import { useLookups } from '../hooks/useLookups';
import { useMutation } from '../hooks/useMutation';
import { useToast } from '../hooks/useToast';
import { authorApi, categoryApi } from '../api/catalogApi';
import { Permission } from '../domain/permissions';

/**
 * Both lookup tables are described here and rendered by one panel component —
 * the page holds no per-table markup.
 */
const AUTHOR_FIELDS = Object.freeze([
  { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Ursula K. Le Guin' },
  { name: 'bio', label: 'Bio', as: Textarea, placeholder: 'Optional short biography' },
]);

const CATEGORY_FIELDS = Object.freeze([
  { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Science fiction' },
]);

export function CatalogPage() {
  const { can } = useAuth();
  const toast = useToast();
  const lookups = useLookups();

  const created = (what, refetch) => ({
    onSuccess: () => {
      toast.success(`${what} added.`);
      refetch();
    },
  });

  const createAuthor = useMutation(authorApi.create, created('Author', lookups.refetchAuthors));
  const createCategory = useMutation(categoryApi.create, created('Category', lookups.refetchCategories));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authors & categories"
        description="The reference data every book points at."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <LookupPanel
          title="Authors"
          icon="✍️"
          itemLabel="author"
          fields={AUTHOR_FIELDS}
          items={lookups.authors}
          isLoading={lookups.isLoading}
          error={lookups.error}
          onCreate={createAuthor.mutate}
          isPending={createAuthor.isPending}
          createError={createAuthor.error}
          canManage={can(Permission.MANAGE_AUTHORS)}
          renderMeta={(author) =>
            author.bio ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{author.bio}</p> : null
          }
        />

        <LookupPanel
          title="Categories"
          icon="🗂️"
          itemLabel="category"
          fields={CATEGORY_FIELDS}
          items={lookups.categories}
          isLoading={lookups.isLoading}
          error={lookups.error}
          onCreate={createCategory.mutate}
          isPending={createCategory.isPending}
          createError={createCategory.error}
          canManage={can(Permission.MANAGE_CATEGORIES)}
        />
      </div>
    </div>
  );
}
