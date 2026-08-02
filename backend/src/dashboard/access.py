"""Who may see which panel.

The whole authorisation rule for the dashboard lives in this one class. Giving a
role a new figure is a one-line change here; no panel and no view branches on a
role.
"""

from django.contrib.auth import get_user_model

from core.access import RoleAccessPolicy

User = get_user_model()

#: Panels a borrower gets: their own account, plus the harmless public figures.
BORROWER_PANELS = frozenset({'my_summary', 'top_books', 'categories'})


class DashboardAccessPolicy(RoleAccessPolicy):
    """Maps a user's role onto the set of panel names they may load."""

    #: The admin sees everything, including panels added later.
    UNRESTRICTED_ROLES = frozenset({User.ROLE_ADMIN})

    #: Explicit allow-list for every other role.
    ROLE_CAPABILITIES = {
        # Desk staff run the library day to day but do not administer accounts,
        # so they get every operational panel except the user breakdown.
        User.ROLE_STAFF: frozenset({
            'overview', 'books', 'borrow_status', 'borrow_trend', 'overdue',
            'top_books', 'top_borrowers', 'categories', 'authors', 'penalties',
            'recent_activity', 'my_summary',
        }),
        User.ROLE_STUDENT: BORROWER_PANELS,
        User.ROLE_TEACHER: BORROWER_PANELS,
        User.ROLE_OTHER: BORROWER_PANELS,
    }

    # Domain-specific aliases, kept so callers read as dashboard code.
    @classmethod
    def allowed_panels(cls, user, registered_names):
        """Return the subset of `registered_names` this user may load."""
        return cls.allowed(user, registered_names)

    @classmethod
    def can_view(cls, user, panel_name):
        return cls.can(user, panel_name)
