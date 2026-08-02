"""Resource registry.

The view resolves a resource by name through this registry, so adding a new
searchable thing never means editing the view -- register a subclass and the
endpoint exists. (Open/closed: open to new resources, closed to modification.)
"""

from core.registry import ComponentRegistry

registry = ComponentRegistry('search resource')
