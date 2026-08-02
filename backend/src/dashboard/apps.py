from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'

    def ready(self):
        # Importing the module runs the @registry.register decorators, which is
        # the only thing that puts a panel on the API.
        from . import panels  # noqa: F401
