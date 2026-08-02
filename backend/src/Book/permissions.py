from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.permissions import is_librarian


class IsLibrarianOrReadOnly(BasePermission):
    """
    Allow read-only requests for everyone,
    but write requests only for admins and desk staff.

    Checks the application `role` -- the previous version tested Django's
    `is_staff` flag, which is a different thing entirely and did not match how
    the rest of the project authorises.
    """

    message = 'Only library staff or an administrator may do this.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_librarian(getattr(request, 'user', None))


#: Kept so the old name keeps importing.
IsAdminOrReadOnly = IsLibrarianOrReadOnly
