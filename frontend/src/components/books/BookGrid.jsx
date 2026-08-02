import { BookCard } from './BookCard';
import { EmptyState, Skeleton } from '../ui';

export function BookGrid({ books, isLoading, onBorrow, canBorrow, empty }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!books?.length) {
    return (
      empty ?? (
        <EmptyState
          title="No books match your filters"
          description="Try a different search term or clear the filters."
        />
      )
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onBorrow={onBorrow} canBorrow={canBorrow} />
      ))}
    </div>
  );
}
