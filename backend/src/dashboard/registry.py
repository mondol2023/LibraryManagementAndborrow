"""Panel registry.

The view resolves panels by name through this registry, so adding a figure to
the dashboard never means editing the view or the URLs -- register a panel class
and it appears. (Open/closed: open to new panels, closed to modification.)
"""

from core.registry import ComponentRegistry

registry = ComponentRegistry('dashboard panel')
