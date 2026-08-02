import { Link } from 'react-router-dom';
import { BookAvailability, isBorrowable } from './BookAvailability';
import { Button, Card } from '../ui';

export function BookCard({ book, onBorrow, canBorrow }) {
  return (
    <Card className="flex flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/books/${book.id}`}
          className="text-sm font-semibold text-slate-900 hover:text-brand-700"
        >
          {book.title}
        </Link>
        <BookAvailability book={book} />
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {book.author_name || 'Unknown author'}
        {book.category_name && <> · {book.category_name}</>}
      </p>

      {book.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {book.description}
        </p>
      )}

      {canBorrow && (
        <div className="mt-4 pt-1">
          <Button
            size="sm"
            className="w-full"
            disabled={!isBorrowable(book)}
            onClick={() => onBorrow(book)}
          >
            {isBorrowable(book) ? 'Request borrow' : 'Unavailable'}
          </Button>
        </div>
      )}
    </Card>
  );
}
