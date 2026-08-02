"""Role permission tests.

These check the authorisation rules only -- no accounts are saved, so they run
without fixtures.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from .permissions import IsAdmin, IsAll, IsLibrarian, IsStaff, IsUser, is_admin, is_librarian

User = get_user_model()

BORROWER_ROLES = (User.ROLE_STUDENT, User.ROLE_TEACHER, User.ROLE_OTHER)


class FakeRequest:
    """The only thing a role permission reads off a request is `.user`."""

    def __init__(self, user):
        self.user = user


def a_user(role):
    return User(username=f'{role}-user', role=role)


def granted(permission, role):
    return permission().has_permission(FakeRequest(a_user(role)), view=None)


class RolePermissionTests(TestCase):
    def test_only_admin_passes_is_admin(self):
        self.assertTrue(granted(IsAdmin, User.ROLE_ADMIN))
        for role in (User.ROLE_STAFF,) + BORROWER_ROLES:
            with self.subTest(role=role):
                self.assertFalse(granted(IsAdmin, role))

    def test_only_staff_passes_is_staff(self):
        self.assertTrue(granted(IsStaff, User.ROLE_STAFF))
        self.assertFalse(granted(IsStaff, User.ROLE_ADMIN))

    def test_librarian_covers_admin_and_staff(self):
        self.assertTrue(granted(IsLibrarian, User.ROLE_ADMIN))
        self.assertTrue(granted(IsLibrarian, User.ROLE_STAFF))
        for role in BORROWER_ROLES:
            with self.subTest(role=role):
                self.assertFalse(granted(IsLibrarian, role))

    def test_is_user_covers_the_borrowing_roles_only(self):
        for role in BORROWER_ROLES:
            with self.subTest(role=role):
                self.assertTrue(granted(IsUser, role))
        self.assertFalse(granted(IsUser, User.ROLE_ADMIN))
        self.assertFalse(granted(IsUser, User.ROLE_STAFF))

    def test_is_all_includes_staff(self):
        # `staff` was missing from this set, which locked desk staff out of the
        # book, borrow and return endpoints entirely.
        for role in (User.ROLE_ADMIN, User.ROLE_STAFF) + BORROWER_ROLES:
            with self.subTest(role=role):
                self.assertTrue(granted(IsAll, role))

    def test_anonymous_and_roleless_requests_are_refused(self):
        for permission in (IsAdmin, IsStaff, IsLibrarian, IsUser, IsAll):
            with self.subTest(permission=permission.__name__):
                self.assertFalse(permission().has_permission(FakeRequest(AnonymousUser()), view=None))
                self.assertFalse(permission().has_permission(FakeRequest(None), view=None))
                self.assertFalse(granted(permission, None))


class RoleHelperTests(TestCase):
    def test_is_admin(self):
        self.assertTrue(is_admin(a_user(User.ROLE_ADMIN)))
        self.assertFalse(is_admin(a_user(User.ROLE_STAFF)))
        self.assertFalse(is_admin(AnonymousUser()))
        self.assertFalse(is_admin(None))

    def test_is_librarian(self):
        self.assertTrue(is_librarian(a_user(User.ROLE_ADMIN)))
        self.assertTrue(is_librarian(a_user(User.ROLE_STAFF)))
        self.assertFalse(is_librarian(a_user(User.ROLE_STUDENT)))
        self.assertFalse(is_librarian(AnonymousUser()))
        self.assertFalse(is_librarian(None))
