from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
# from .models import User

from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Custom admin for the User model."""

    ordering = ["id"]
    list_display = ("username", "email", "role", "penalty_points", "reference_number", "is_active", "date_joined")
    list_filter = ("is_staff", "is_active", "is_superuser", "groups", "role")
    search_fields = ("username", "email", "first_name", "last_name")
    