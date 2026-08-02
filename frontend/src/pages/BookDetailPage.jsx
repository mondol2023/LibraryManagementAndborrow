import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  Alert,
  ErrorAlert,
  LoadingBlock,
  EmptyState,
} from '../components/ui';
import { BookAvailability, isBorrowable } from '../components/books/BookAvailability';
import { BookForm } from '../components/books/BookForm';
import { BorrowRequestModal } from '../components/borrow/BorrowRequestModal';
import { RoleGate } from '../components/routing/RoleGate';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '../hooks/useQuery';
import { useLookups } from '../hooks/useLookups';
import { useMutation } from '../hooks/useMutation';
import { useToast } from '../hooks/useToast';
import { useBorrowActions } from '../hooks/useBorrowActions';
import { bookApi } from '../api/catalogApi';
import { withCatalogNames } from '../domain/books';
import { Permission } from '../domain/permissions';
import { LOAN_PERIOD_DAYS } from '../domain/borrowStatus';
import { formatDate } from '../lib/format';

/** Detail rows are declared once; adding a field is one entry, not new markup. */
const DETAIL_FIELDS = Object.freeze([
  { key: 'author_name', label: 'Author', value: (book) => book.author_name || '—' },
  { key: 'category_name', label: 'Category', value: (book) => book.category_name || '—' },
  { key: 'total_copies', label: 'Total copies', value: (book) => book.total_copies ?? '—' },
  { key: 'available_copies', label: 'Available now', value: (book) => book.available_copies ?? '—' },
  { key: 'created_at', label: 'Added', value: (book) => formatDate(book.created_at) },
  { key: 'updated_at', label: 'Last updated', value: (book) => formatDate(book.updated_at) },
]);

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const query = useQuery(() => bookApi.retrieve(id), [id]);
  const lookups = useLookups();

  // Same join as the catalog list — the raw `author` / `category` ids the
  // serializer returns are turned into names in one shared place.
  const book = useMemo(
    () => (query.data ? withCatalogNames([query.data], lookups.authors, lookups.categories)[0] : null),
    [query.data, lookups.authors, lookups.categories],
  );

  const borrow = useBorrowActions(() => {
    setIsBorrowing(false);
    query.refetch();
  });

  const updateBook = useMutation((payload) => bookApi.update(id, payload), {
    onSuccess: () => {
      toast.success('Book updated.');
      setIsEditing(false);
      query.refetch();
    },
  });

  const deleteBook = useMutation(() => bookApi.remove(id), {
    onSuccess: () => {
      toast.success('Book removed from the catalog.');
      navigate('/books', { replace: true });
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isLoading) return <LoadingBlock label="Loading book…" />;

  if (query.error || !book) {
    return (
      <div className="space-y-6">
        <ErrorAlert error={query.error} />
        <EmptyState
          icon="📕"
          title="Book not found"
          description="It may have been removed from the catalog."
          action={
            <Link
              to="/books"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Back to books
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={book.title}
        description={book.author_name || 'Unknown author'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RoleGate permission={Permission.BORROW_BOOKS}>
              <Button disabled={!isBorrowable(book)} onClick={() => setIsBorrowing(true)}>
                {isBorrowable(book) ? 'Request borrow' : 'Unavailable'}
              </Button>
            </RoleGate>
            <RoleGate permission={Permission.MANAGE_BOOKS}>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setIsConfirmingDelete(true)}>
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="About this book" actions={<BookAvailability book={book} />} />
          <CardBody>
            {book.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {book.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400">No description was provided.</p>
            )}

            {can(Permission.BORROW_BOOKS) && (
              <Alert tone="info" className="mt-5">
                Approved loans run for {LOAN_PERIOD_DAYS} days. A librarian reviews every request
                before the book leaves the shelf.
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Details" />
          <CardBody>
            <dl className="divide-y divide-slate-100 text-sm">
              {DETAIL_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">{field.label}</dt>
                  <dd className="text-right font-medium text-slate-800">{field.value(book)}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      <BorrowRequestModal
        book={book}
        open={isBorrowing}
        onClose={() => setIsBorrowing(false)}
        onConfirm={borrow.request.mutate}
        isPending={borrow.request.isPending}
        error={borrow.request.error}
      />

      <Modal open={isEditing} onClose={() => setIsEditing(false)} title="Edit book" size="lg">
        <BookForm
          book={book}
          authors={lookups.authors}
          categories={lookups.categories}
          onSubmit={updateBook.mutate}
          onCancel={() => setIsEditing(false)}
          isPending={updateBook.isPending}
          error={updateBook.error}
        />
      </Modal>

      <Modal
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        title="Delete this book?"
        description="This removes it from the catalog for everyone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" isLoading={deleteBook.isPending} onClick={deleteBook.mutate}>
              Delete
            </Button>
          </>
        }
      >
        <ErrorAlert error={deleteBook.error} />
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{book.title}</span> will no longer appear in
          the catalog. Existing borrow records are kept.
        </p>
      </Modal>
    </div>
  );
}
