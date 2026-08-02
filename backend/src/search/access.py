"""Who may search what.

The whole authorisation rule for search lives in this one class, so granting a
role access to a new resource is a one-line change here -- the views, the
resources and the service never branch on a role.
"""

from django.contrib.auth import get_user_model

from core.access import RoleAccessPolicy

User = get_user_model()


class SearchAccessPolicy(RoleAccessPolicy):
    """Maps a user's role onto the set of resource names they may search."""

    #: Roles that may search every registered resource, including future ones.
    UNRESTRICTED_ROLES = frozenset({User.ROLE_ADMIN})

    #: Explicit allow-list for every other role.
    ROLE_CAPABILITIES = {
        User.ROLE_STAFF: frozenset({'books', 'users'}),
        User.ROLE_STUDENT: frozenset({'books'}),
        User.ROLE_TEACHER: frozenset({'books'}),
        User.ROLE_OTHER: frozenset({'books'}),
    }

    # Domain-specific aliases, kept so callers read as search code.
    @classmethod
    def allowed_resources(cls, user, registered_names):
        """Return the subset of `registered_names` this user may search."""
        return cls.allowed(user, registered_names)

    @classmethod
    def can_search(cls, user, resource_name):
        return cls.can(user, resource_name)
