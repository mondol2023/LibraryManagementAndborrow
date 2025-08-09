from django.contrib import admin
from .models import Author, Category, Book, Borrow


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("name", "bio", "is_active", "created_at", "updated_at")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at", "updated_at")
    search_fields = ("name", "bio")
    list_filter = ("is_active",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "title", "author", "category",
        "total_copies", "available_copies",
        "is_active", "created_at", "updated_at"
    )
    search_fields = ("title", "description", "author__name", "category__name")
    list_filter = ("category", "author", "is_active")


@admin.register(Borrow)
class BorrowAdmin(admin.ModelAdmin):
    list_display = (
        "user", "book", "borrow_date",
        "due_date", "return_date", "is_overdue"
    )
    search_fields = ("user__username", "book__title", "book__author__name")
    list_filter = ("borrow_date", "due_date", "return_date")
