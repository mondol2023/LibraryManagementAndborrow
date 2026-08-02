"""Dashboard assembly.

The view handles HTTP, the policy decides who sees what, the panels compute --
this service is the thin layer that puts those three together, so none of them
has to know about the others.
"""

from datetime import date

from .access import DashboardAccessPolicy
from .registry import registry


class DashboardService:
    """Builds the panels a user is allowed to see."""

    policy = DashboardAccessPolicy
    registry = registry

    def allowed_names(self, user):
        return self.policy.allowed_panels(user, self.registry.names())

    def resolve(self, user, requested=None):
        """Names to render: everything permitted, or the requested subset of it.

        A requested panel the user may not see is dropped rather than rejected,
        so a shared dashboard layout works for every role.
        """
        allowed = self.allowed_names(user)
        if requested:
            return [name for name in requested if name in allowed]
        return sorted(allowed)

    def build(self, user, names, limit, today=None):
        """Render each named panel into `{name: {title, description, data}}`."""
        options = {'limit': limit, 'today': today or date.today()}

        panels = {}
        for name in names:
            panel = self.registry.get(name)
            if panel is None:
                continue
            panels[name] = {
                **panel.describe(),
                'data': panel.build(user, options),
            }
        return panels

    def describe(self, names):
        return [self.registry.get(name).describe() for name in sorted(names)]
