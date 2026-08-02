from django.apps import AppConfig


class SearchConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'search'
    label = 'search'
    verbose_name = 'Elasticsearch'

    def ready(self):
        # Importing the module runs the @registry.register decorators, so the
        # views can resolve resources by name without importing them directly.
        import search.resources  # noqa: F401
