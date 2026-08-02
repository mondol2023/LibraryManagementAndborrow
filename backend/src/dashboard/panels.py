"""The dashboard panels.

Each panel answers one question and nothing else (single responsibility), and
they all present the same tiny interface -- `name`, `title`, `build()` -- so the
view can render any of them without knowing what they contain. Adding a figure
means adding a class here; no other file changes.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.functions import TruncMonth

from Book.models import Author, Book, Borrow, Category

from .queries import (
    active_books,
    open_borrows,
    overdue_borrows,
    role_counts,
    serialise_borrow_rows,
    status_counts,
)
from .registry import registry

User = get_user_model()


class BasePanel:
    """One block of dashboard data.

    Subclasses set `name`/`title` and implement `build()`. `options` carries the
    request-level knobs (`limit`, `today`, `user`) so `build()` never touches the
    request itself and stays trivial to test.
    """

    #: URL-safe identifier, also the key in the combined response.
    name = None
    title = ''
    description = ''

    def build(self, user, options):
        raise NotImplementedError

    def describe(self):
        return {'name': self.name, 'title': self.title, 'description': self.description}


@registry.register
class OverviewPanel(BasePanel):
    name = 'overview'
    title = 'Overview'
    description = 'Headline counts across the whole library.'

    def build(self, user, options):
        copies = active_books().aggregate(total=Sum('total_copies'), available=Sum('available_copies'))
        total_copies = copies['total'] or 0
        available_copies = copies['available'] or 0

        return {
            'books': active_books().count(),
            'authors': Author.objects.filter(is_active=True).count(),
            'categories': Category.objects.filter(is_active=True).count(),
            'users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'pending_approvals': User.objects.filter(is_active=False).count(),
            'total_copies': total_copies,
            'available_copies': available_copies,
            'copies_on_loan': total_copies - available_copies,
            'borrows_total': Borrow.objects.count(),
            'borrows_open': open_borrows().count(),
            'borrows_pending': Borrow.objects.filter(status=Borrow.PENDING).count(),
            'borrows_overdue': overdue_borrows(options['today']).count(),
            'penalty_points': User.objects.aggregate(total=Sum('penalty_points'))['total'] or 0,
        }


@registry.register
class BooksPanel(BasePanel):
    name = 'books'
    title = 'Catalogue'
    description = 'Stock levels and the titles that have run out.'

    def build(self, user, options):
        books = active_books()
        out_of_stock = books.filter(available_copies__lte=0)

        return {
            'total': books.count(),
            'archived': Book.objects.filter(is_active=False).count(),
            'out_of_stock': out_of_stock.count(),
            'fully_available': books.filter(available_copies=F('total_copies')).count(),
            'unavailable_titles': list(
                out_of_stock.values('id', 'title', 'total_copies', 'available_copies')[:options['limit']]
            ),
            'recently_added': list(
                books.order_by('-created_at').values('id', 'title', 'created_at')[:options['limit']]
            ),
        }


@registry.register
class BorrowStatusPanel(BasePanel):
    name = 'borrow_status'
    title = 'Loans by status'
    description = 'How many borrow records sit in each status.'

    def build(self, user, options):
        counts = status_counts()
        return {
            'counts': counts,
            'breakdown': [
                {'status': value, 'label': label, 'count': counts[value]}
                for value, label in Borrow.STATUS_CHOICES
            ],
            'total': sum(counts.values()),
        }


@registry.register
class BorrowTrendPanel(BasePanel):
    name = 'borrow_trend'
    title = 'Borrowing trend'
    description = 'Loans and returns per month for the last twelve months.'

    MONTHS = 12

    def build(self, user, options):
        today = options['today']
        # Start at the first of the month, eleven months back.
        first_of_month = today.replace(day=1)
        start = first_of_month
        for _ in range(self.MONTHS - 1):
            start = (start - timedelta(days=1)).replace(day=1)

        borrowed = self._by_month(
            Borrow.objects.filter(borrow_date__gte=start), 'borrow_date'
        )
        returned = self._by_month(
            Borrow.objects.filter(return_date__gte=start, return_date__isnull=False), 'return_date'
        )

        series = []
        cursor = start
        while cursor <= first_of_month:
            key = cursor.strftime('%Y-%m')
            series.append({
                'month': key,
                'borrowed': borrowed.get(key, 0),
                'returned': returned.get(key, 0),
            })
            # Step to the first of the next month.
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)

        return {'months': self.MONTHS, 'series': series}

    @staticmethod
    def _by_month(queryset, field):
        rows = (
            queryset.annotate(month=TruncMonth(field))
            .values('month')
            .annotate(total=Count('id'))
        )
        return {row['month'].strftime('%Y-%m'): row['total'] for row in rows if row['month']}


@registry.register
class OverduePanel(BasePanel):
    name = 'overdue'
    title = 'Overdue loans'
    description = 'Books that are out past their due date.'

    def build(self, user, options):
        today = options['today']
        overdue = overdue_borrows(today).order_by('due_date')

        return {
            'count': overdue.count(),
            'due_this_week': Borrow.objects.filter(
                status=Borrow.ACCEPTED,
                return_date__isnull=True,
                due_date__gte=today,
                due_date__lte=today + timedelta(days=7),
            ).count(),
            'items': serialise_borrow_rows(overdue, options['limit']),
        }


@registry.register
class TopBooksPanel(BasePanel):
    name = 'top_books'
    title = 'Most borrowed books'
    description = 'The titles that leave the shelf most often.'

    def build(self, user, options):
        rows = (
            Borrow.objects.values('book_id', 'book__title')
            .annotate(times_borrowed=Count('id'))
            .order_by('-times_borrowed', 'book__title')[:options['limit']]
        )
        return {
            'items': [
                {
                    'book_id': row['book_id'],
                    'title': row['book__title'],
                    'times_borrowed': row['times_borrowed'],
                }
                for row in rows
            ]
        }


@registry.register
class TopBorrowersPanel(BasePanel):
    name = 'top_borrowers'
    title = 'Most active borrowers'
    description = 'Who borrows the most, and how much is still out.'

    def build(self, user, options):
        rows = (
            Borrow.objects.values('user_id', 'user__username', 'user__role')
            .annotate(
                total=Count('id'),
                open_loans=Count('id', filter=Q(status=Borrow.ACCEPTED, return_date__isnull=True)),
            )
            .order_by('-total', 'user__username')[:options['limit']]
        )
        return {
            'items': [
                {
                    'user_id': row['user_id'],
                    'username': row['user__username'],
                    'role': row['user__role'],
                    'total_borrows': row['total'],
                    'open_loans': row['open_loans'],
                }
                for row in rows
            ]
        }


@registry.register
class CategoriesPanel(BasePanel):
    name = 'categories'
    title = 'Categories'
    description = 'How the catalogue and the borrowing split by category.'

    def build(self, user, options):
        rows = (
            Category.objects.filter(is_active=True)
            .annotate(
                book_count=Count('books_category', filter=Q(books_category__is_active=True), distinct=True),
                borrow_count=Count('books_category__borrowed_book', distinct=True),
            )
            .order_by('-borrow_count', 'name')[:options['limit']]
        )
        return {
            'count': Category.objects.filter(is_active=True).count(),
            'items': [
                {
                    'id': row.id,
                    'name': row.name,
                    'book_count': row.book_count,
                    'borrow_count': row.borrow_count,
                }
                for row in rows
            ],
        }


@registry.register
class AuthorsPanel(BasePanel):
    name = 'authors'
    title = 'Authors'
    description = 'Titles held and loans made per author.'

    def build(self, user, options):
        rows = (
            Author.objects.filter(is_active=True)
            .annotate(
                book_count=Count('books_author', filter=Q(books_author__is_active=True), distinct=True),
                borrow_count=Count('books_author__borrowed_book', distinct=True),
            )
            .order_by('-borrow_count', 'name')[:options['limit']]
        )
        return {
            'count': Author.objects.filter(is_active=True).count(),
            'items': [
                {
                    'id': row.id,
                    'name': row.name,
                    'book_count': row.book_count,
                    'borrow_count': row.borrow_count,
                }
                for row in rows
            ],
        }


@registry.register
class UsersPanel(BasePanel):
    name = 'users'
    title = 'Accounts'
    description = 'The membership broken down by role and state.'

    def build(self, user, options):
        counts = role_counts()
        pending = User.objects.filter(is_active=False).order_by('-date_joined')

        return {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'inactive': pending.count(),
            'by_role': counts,
            'breakdown': [
                {'role': value, 'label': label, 'count': counts[value]}
                for value, label in User.ROLE_CHOICES
            ],
            # Admin/staff signups sit inactive until an admin approves them.
            'awaiting_approval': list(
                pending.values('id', 'username', 'email', 'role', 'date_joined')[:options['limit']]
            ),
            'recent_signups': list(
                User.objects.order_by('-date_joined')
                .values('id', 'username', 'role', 'date_joined')[:options['limit']]
            ),
        }


@registry.register
class PenaltiesPanel(BasePanel):
    name = 'penalties'
    title = 'Penalties'
    description = 'Outstanding penalty points and who holds them.'

    def build(self, user, options):
        totals = User.objects.aggregate(total=Sum('penalty_points'), average=Avg('penalty_points'))
        penalised = User.objects.filter(penalty_points__gt=0)

        return {
            'total_points': totals['total'] or 0,
            'average_points': round(totals['average'] or 0, 2),
            'users_with_penalties': penalised.count(),
            'top_offenders': list(
                penalised.order_by('-penalty_points')
                .values('id', 'username', 'role', 'penalty_points')[:options['limit']]
            ),
        }


@registry.register
class RecentActivityPanel(BasePanel):
    name = 'recent_activity'
    title = 'Recent activity'
    description = 'The latest borrow requests and returns.'

    def build(self, user, options):
        limit = options['limit']
        return {
            'latest_requests': serialise_borrow_rows(
                Borrow.objects.order_by('-created_at'), limit
            ),
            'latest_returns': serialise_borrow_rows(
                Borrow.objects.filter(return_date__isnull=False).order_by('-return_date', '-updated_at'),
                limit,
            ),
        }


@registry.register
class MySummaryPanel(BasePanel):
    name = 'my_summary'
    title = 'My library'
    description = 'The signed-in account: current loans, history and penalties.'

    #: Mirrors the borrowing cap enforced when a loan is created.
    BORROW_LIMIT = 3

    def build(self, user, options):
        today = options['today']
        mine = Borrow.objects.filter(user=user)
        open_loans = mine.filter(status__in=(Borrow.PENDING, Borrow.ACCEPTED), return_date__isnull=True)

        return {
            'username': user.username,
            'role': user.role,
            'penalty_points': user.penalty_points,
            'borrow_limit': self.BORROW_LIMIT,
            'open_loans': open_loans.count(),
            'remaining_allowance': max(0, self.BORROW_LIMIT - open_loans.count()),
            'total_borrows': mine.count(),
            'returned': mine.filter(status=Borrow.RETURNED).count(),
            'overdue': mine.filter(
                status=Borrow.ACCEPTED, return_date__isnull=True, due_date__lt=today
            ).count(),
            'current': serialise_borrow_rows(open_loans.order_by('due_date'), options['limit']),
            'history': serialise_borrow_rows(mine.order_by('-borrow_date'), options['limit']),
        }
