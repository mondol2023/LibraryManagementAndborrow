"""Role permissions.

Every class here is the same check -- "is the requester's role in this set?" --
so the check itself is written once and each permission is just its set of roles.
"""

from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

User = get_user_model()


class RoleBasePermission(BasePermission):
    """Grants access when the requester's role is listed in `allowed_roles`."""

    allowed_roles = frozenset()

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False
        return getattr(user, 'role', None) in self.allowed_roles


class IsAdmin(RoleBasePermission):
    """Full control over every part of the system."""

    allowed_roles = frozenset({User.ROLE_ADMIN})
    message = 'Administrator access required.'


class IsStaff(RoleBasePermission):
    """Library desk staff."""

    allowed_roles = frozenset({User.ROLE_STAFF})
    message = 'Staff access required.'


class IsLibrarian(RoleBasePermission):
    """Anyone who runs the library: admins and desk staff.

    Use this for catalogue and borrow-desk work. Account administration stays
    with `IsAdmin`.
    """

    allowed_roles = frozenset({User.ROLE_ADMIN, User.ROLE_STAFF})
    message = 'Only library staff or an administrator may do this.'


class IsUser(RoleBasePermission):
    """A borrower -- student, teacher or other."""

    allowed_roles = frozenset({User.ROLE_STUDENT, User.ROLE_TEACHER, User.ROLE_OTHER})
    message = 'Only borrowers may do this.'


class IsAll(RoleBasePermission):
    """Any signed-in account with a role.

    `staff` used to be missing from this set, which locked desk staff out of the
    book, borrow and return endpoints entirely.
    """

    allowed_roles = frozenset({
        User.ROLE_ADMIN,
        User.ROLE_STAFF,
        User.ROLE_STUDENT,
        User.ROLE_TEACHER,
        User.ROLE_OTHER,
    })
    message = 'A role is required to use this endpoint.'


def is_admin(user):
    """True for the admin role. The one place that string comparison is made."""
    return bool(user and user.is_authenticated and getattr(user, 'role', None) == User.ROLE_ADMIN)


def is_librarian(user):
    """True for admins and desk staff."""
    return bool(
        user
        and user.is_authenticated
        and getattr(user, 'role', None) in (User.ROLE_ADMIN, User.ROLE_STAFF)
    )
