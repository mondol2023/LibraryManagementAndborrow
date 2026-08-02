"""Access-policy tests.

These cover the authorisation rules only, so they run without a live
Elasticsearch cluster.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from .access import SearchAccessPolicy
from .registry import registry

User = get_user_model()

ALL_RESOURCES = {'books', 'users'}


class SearchAccessPolicyTests(TestCase):
    def _user(self, role):
        return User(username=f'{role}-user', role=role)

    def test_admin_can_search_everything(self):
        allowed = SearchAccessPolicy.allowed_resources(self._user(User.ROLE_ADMIN), ALL_RESOURCES)
        self.assertEqual(set(allowed), ALL_RESOURCES)

    def test_staff_can_search_books_and_users(self):
        allowed = SearchAccessPolicy.allowed_resources(self._user(User.ROLE_STAFF), ALL_RESOURCES)
        self.assertEqual(set(allowed), {'books', 'users'})

    def test_regular_roles_can_only_search_books(self):
        for role in (User.ROLE_STUDENT, User.ROLE_TEACHER, User.ROLE_OTHER):
            with self.subTest(role=role):
                allowed = SearchAccessPolicy.allowed_resources(self._user(role), ALL_RESOURCES)
                self.assertEqual(set(allowed), {'books'})

    def test_roleless_user_can_search_nothing(self):
        allowed = SearchAccessPolicy.allowed_resources(self._user(None), ALL_RESOURCES)
        self.assertEqual(set(allowed), set())

    def test_unregistered_resource_is_never_allowed(self):
        allowed = SearchAccessPolicy.allowed_resources(self._user(User.ROLE_STAFF), {'books'})
        self.assertEqual(set(allowed), {'books'})


class SearchRegistryTests(TestCase):
    def test_expected_resources_are_registered(self):
        self.assertEqual(set(registry.names()), ALL_RESOURCES)

    def test_every_resource_declares_search_fields(self):
        for name, resource in registry.all().items():
            with self.subTest(resource=name):
                self.assertTrue(resource.search_fields)
                self.assertIsNotNone(resource.document)
                self.assertIsNotNone(resource.serializer_class)
