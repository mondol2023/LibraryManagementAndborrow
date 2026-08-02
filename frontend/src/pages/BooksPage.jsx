import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, Modal, ErrorAlert } from '../components/ui';
import { BookFilters, EMPTY_BOOK_FILTERS, filterBooks } from '../components/books/BookFilters';
import { BookGrid } from '../components/books/BookGrid';
import { BookForm } from '../components/books/BookForm';
import { BorrowRequestModal } from '../components/borrow/BorrowRequestModal';
import { RoleGate } from '../components/routing/RoleGate';
import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useMutation } from '../hooks/useMutation';
import { useToast } from '../hooks/useToast';
import { useBorrowActions } from '../hooks/useBorrowActions';
import { bookApi } from '../api/catalogApi';
import { Permission } from '../domain/permissions';
import { pluralize } from '../lib/format';

export function BooksPage() {
  const { can } = useAuth();
  const toast = useToast();
  const catalog = useCatalog();

  const [filters, setFilters] = useState(EMPTY_BOOK_FILTERS);
  const [borrowTarget, setBorrowTarget] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const visibleBooks = useMemo(
    () => filterBooks(catalog.books, filters),
    [catalog.books, filters],
  );

  const closeBorrow = () => setBorrowTarget(null);
  const borrow = useBorrowActions(() => {
    closeBorrow();
    catalog.refetchBooks();
  });

  const createBook = useMutation(bookApi.create, {
    onSuccess: () => {
      toast.success('Book added to the catalog.');
      setIsCreating(false);
      catalog.refetchBooks();
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Books"
        description={
          catalog.isLoading ? 'Loading the catalog…' : `${pluralize(visibleBooks.length, 'book')} listed.`
        }
        actions={
          <RoleGate permission={Permission.MANAGE_BOOKS}>
            <Button onClick={() => setIsCreating(true)}>Add book</Button>
          </RoleGate>
        }
      />

      <ErrorAlert error={catalog.error} />

      <Card>
        <CardBody>
          <BookFilters
            filters={filters}
            onChange={setFilters}
            authors={catalog.authors}
            categories={catalog.categories}
          />
        </CardBody>
      </Card>

      <BookGrid
        books={visibleBooks}
        isLoading={catalog.isLoading}
        canBorrow={can(Permission.BORROW_BOOKS) || can(Permission.BORROW_FOR_OTHERS)}
        onBorrow={setBorrowTarget}
      />

      <BorrowRequestModal
        book={borrowTarget}
        open={Boolean(borrowTarget)}
        onClose={closeBorrow}
        onConfirm={borrow.request.mutate}
        isPending={borrow.request.isPending}
        error={borrow.request.error}
      />

      <Modal open={isCreating} onClose={() => setIsCreating(false)} title="Add a book" size="lg">
        <BookForm
          authors={catalog.authors}
          categories={catalog.categories}
          onSubmit={createBook.mutate}
          onCancel={() => setIsCreating(false)}
          isPending={createBook.isPending}
          error={createBook.error}
        />
      </Modal>
    </div>
  );
}
