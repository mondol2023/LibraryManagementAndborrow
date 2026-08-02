"""A name -> component registry.

Views resolve components by name through a registry, so adding a new component
never means editing the view that serves it. (Open/closed: open to new
components, closed to modification.)
"""


class ComponentRegistry:
    """Maps a `name` attribute onto a single instance of the class holding it."""

    def __init__(self, kind='component'):
        #: Only used to make the error messages readable.
        self._kind = kind
        self._components = {}

    def register(self, component_class):
        """Class decorator: instantiate and index a component by its name."""
        name = getattr(component_class, 'name', None)
        if not name:
            raise ValueError(f'{component_class.__name__} must define a `name`.')
        if name in self._components:
            raise ValueError(f'A {self._kind} named "{name}" is already registered.')

        self._components[name] = component_class()
        return component_class

    def get(self, name):
        """Return the component registered under `name`, or None."""
        return self._components.get(name)

    def names(self):
        return frozenset(self._components)

    def all(self):
        return dict(self._components)
