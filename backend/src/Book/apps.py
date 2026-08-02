from django.apps import AppConfig


class BookConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # `name` must match the package directory exactly (case-sensitive filesystems);
    # `label` keeps the existing db table prefix / app label unchanged.
    name = 'Book'
    label = 'book'

    def ready(self):
        import Book.signals  # noqa: F401
