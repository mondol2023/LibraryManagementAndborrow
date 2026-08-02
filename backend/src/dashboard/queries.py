"""Shared querysets.

Several panels ask the same questions -- "which loans are overdue?", "how many
sit in each status?" -- so those queries are written once here and the panels
just present the answer.
"""

from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from Book.models import Book, Borrow

User = get_user_model()

#: Statuses that mean a copy is currently out of the library.
OPEN_STATUSES = (Borrow.PENDING, Borrow.ACCEPTED)


def active_books():
    return Book.objects.filter(is_active=True)


def open_borrows():
    """Loans that still tie up a copy: requested or out on loan."""
    return Borrow.objects.filter(status__in=OPEN_STATUSES, return_date__isnull=True)


def overdue_borrows(today=None):
    """Accepted loans past their due date that have not come back."""
    return Borrow.objects.filter(
        status=Borrow.ACCEPTED,
        return_date__isnull=True,
        due_date__lt=today or date.today(),
    )


def status_counts():
    """`{status: count}` covering every status, including the empty ones."""
    counted = dict(
        Borrow.objects.values_list('status').annotate(total=Count('id')).values_list('status', 'total')
    )
    # Report zeroes explicitly so a chart keeps the same series every day.
    return {value: counted.get(value, 0) for value, _label in Borrow.STATUS_CHOICES}


def role_counts():
    """`{role: count}` covering every role defined on the user model."""
    counted = dict(
        User.objects.values_list('role').annotate(total=Count('id')).values_list('role', 'total')
    )
    return {value: counted.get(value, 0) for value, _label in User.ROLE_CHOICES}


def serialise_borrow_rows(queryset, limit):
    """Flatten borrow rows into the shape the panels return."""
    rows = queryset.select_related('book', 'user')[:limit]
    return [
        {
            'id': borrow.id,
            'book_id': borrow.book_id,
            'book': borrow.book.title,
            'user_id': borrow.user_id,
            'user': borrow.user.username,
            'status': borrow.status,
            'borrow_date': borrow.borrow_date,
            'due_date': borrow.due_date,
            'return_date': borrow.return_date,
            'days_overdue': (
                (date.today() - borrow.due_date).days
                if borrow.due_date and borrow.return_date is None and borrow.due_date < date.today()
                else 0
            ),
        }
        for borrow in rows
    ]
