"""Dashboard access, registry and query-parsing tests.

These cover the wiring -- who may load which panel, and how a request is parsed
-- without touching the database, so they run against an empty schema.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase

from .access import BORROWER_PANELS, DashboardAccessPolicy
from .registry import registry
from .serializers import DashboardQuerySerializer
from .services import DashboardService

User = get_user_model()

#: Panels only an administrator should ever reach.
ADMIN_ONLY_PANELS = {'users'}


def a_user(role):
    """An unsaved user -- the policy only ever reads `.role`."""
    return User(username=f'{role}-user', role=role)


class DashboardAccessPolicyTests(TestCase):
    def test_admin_sees_every_registered_panel(self):
        allowed = DashboardAccessPolicy.allowed_panels(a_user(User.ROLE_ADMIN), registry.names())
        self.assertEqual(set(allowed), set(registry.names()))

    def test_admin_sees_panels_registered_later(self):
        # The admin is unrestricted rather than allow-listed, so a panel added
        # tomorrow reaches them without editing the policy.
        allowed = DashboardAccessPolicy.allowed_panels(
            a_user(User.ROLE_ADMIN), registry.names() | {'a_future_panel'}
        )
        self.assertIn('a_future_panel', allowed)

    def test_staff_get_the_operational_panels_but_not_the_user_breakdown(self):
        allowed = set(DashboardAccessPolicy.allowed_panels(a_user(User.ROLE_STAFF), registry.names()))
        self.assertNotIn('users', allowed)
        self.assertEqual(allowed, set(registry.names()) - ADMIN_ONLY_PANELS)

    def test_borrowers_only_get_their_own_summary_and_public_figures(self):
        for role in (User.ROLE_STUDENT, User.ROLE_TEACHER, User.ROLE_OTHER):
            with self.subTest(role=role):
                allowed = DashboardAccessPolicy.allowed_panels(a_user(role), registry.names())
                self.assertEqual(set(allowed), set(BORROWER_PANELS))

    def test_borrowers_cannot_view_an_operational_panel(self):
        student = a_user(User.ROLE_STUDENT)
        self.assertFalse(DashboardAccessPolicy.can_view(student, 'overview'))
        self.assertTrue(DashboardAccessPolicy.can_view(student, 'my_summary'))

    def test_roleless_user_sees_nothing(self):
        allowed = DashboardAccessPolicy.allowed_panels(a_user(None), registry.names())
        self.assertEqual(set(allowed), set())

    def test_result_never_names_a_panel_that_is_not_registered(self):
        # A borrower's allow-list mentions `my_summary` and `categories`, but only
        # what is actually registered may come back.
        allowed = DashboardAccessPolicy.allowed_panels(a_user(User.ROLE_STUDENT), {'top_books'})
        self.assertEqual(set(allowed), {'top_books'})


class DashboardRegistryTests(TestCase):
    def test_every_panel_is_registered_under_its_own_name(self):
        for name, panel in registry.all().items():
            with self.subTest(panel=name):
                self.assertEqual(panel.name, name)
                self.assertTrue(panel.title, f'{name} has no title')

    def test_describe_exposes_name_title_and_description(self):
        panel = registry.get('overview')
        self.assertIsNotNone(panel)
        self.assertEqual(
            set(panel.describe()), {'name', 'title', 'description'}
        )

    def test_unknown_name_resolves_to_none(self):
        self.assertIsNone(registry.get('no_such_panel'))


class DashboardQuerySerializerTests(TestCase):
    def _validated(self, data):
        serializer = DashboardQuerySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def test_panels_are_split_on_commas(self):
        data = self._validated({'panels': 'overview, overdue'})
        self.assertEqual(data['panels'], ['overview', 'overdue'])

    def test_limit_defaults_to_ten(self):
        self.assertEqual(self._validated({})['limit'], 10)

    def test_limit_is_capped(self):
        serializer = DashboardQuerySerializer(data={'limit': 5000})
        self.assertFalse(serializer.is_valid())
        self.assertIn('limit', serializer.errors)

    def test_unknown_panel_is_rejected(self):
        serializer = DashboardQuerySerializer(data={'panels': 'overview,not_a_panel'})
        self.assertFalse(serializer.is_valid())
        self.assertIn('panels', serializer.errors)


class DashboardServiceTests(TestCase):
    def setUp(self):
        self.service = DashboardService()

    def test_no_request_means_every_allowed_panel_sorted(self):
        names = self.service.resolve(a_user(User.ROLE_STUDENT))
        self.assertEqual(names, sorted(BORROWER_PANELS))

    def test_a_requested_panel_the_user_may_not_see_is_dropped(self):
        # Dropped rather than rejected, so one shared layout works for everyone.
        names = self.service.resolve(a_user(User.ROLE_STUDENT), ['top_books', 'users'])
        self.assertEqual(names, ['top_books'])

    def test_requested_order_is_preserved(self):
        names = self.service.resolve(a_user(User.ROLE_ADMIN), ['overdue', 'overview'])
        self.assertEqual(names, ['overdue', 'overview'])
