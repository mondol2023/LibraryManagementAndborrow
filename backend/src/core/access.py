"""Role -> capability policies.

A policy answers one question: given this user, which of these named things may
they touch? Subclasses supply the table; the resolution logic lives here once so
no view ever branches on a role.
"""


class RoleAccessPolicy:
    """Base class for 'which named capabilities does this role get?' rules."""

    #: Roles that get everything, including capabilities added later.
    UNRESTRICTED_ROLES = frozenset()

    #: Explicit allow-list for every other role. {role: frozenset(names)}
    ROLE_CAPABILITIES = {}

    @classmethod
    def allowed(cls, user, available):
        """Return the subset of `available` this user may use."""
        if not (user and user.is_authenticated):
            return frozenset()

        available = frozenset(available)
        role = getattr(user, 'role', None)

        if role in cls.UNRESTRICTED_ROLES:
            return available

        return cls.ROLE_CAPABILITIES.get(role, frozenset()) & available

    @classmethod
    def can(cls, user, name):
        """True when `user` may use the single capability `name`."""
        return name in cls.allowed(user, {name})
