from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the User model.

    Subclasses Django's own `UserAdmin` rather than a plain `ModelAdmin` so the
    password stays hashed through the admin forms -- and so the extra fields
    (role, penalties, contact details) are actually editable there, which a bare
    `ModelAdmin` without `fieldsets` left off the page.
    """

    ordering = ["id"]
    list_display = ("username", "email", "role", "penalty_points", "reference_number", "is_active", "date_joined")
    list_filter = ("is_staff", "is_active", "is_superuser", "groups", "role")
    search_fields = ("username", "email", "first_name", "last_name", "reference_number")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email", "phone_number")}),
        (_("Library"), {"fields": ("role", "reference_number", "penalty_points")}),
        (_("Permissions"), {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "role", "password1", "password2"),
        }),
    )
