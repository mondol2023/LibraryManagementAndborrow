from django.db import models

from django.utils import timezone
from datetime import timedelta

from django.contrib.auth import get_user_model

User = get_user_model()


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ActionUserBaseModel(BaseModel):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name="%(class)s_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name="%(class)s_updated_by")

    class Meta:
        abstract = True


class Author(ActionUserBaseModel):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Category(ActionUserBaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Book(ActionUserBaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, blank=True, null=True, related_name="books_author")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="books_category")
    total_copies = models.IntegerField(default=0)
    available_copies = models.IntegerField(default=0)

    def __str__(self):
        return self.title + (' - ' + self.author.name if self.author else '')
    


class Borrow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_borrowed_by")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrowed_book")
    borrow_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} borrowed {self.book}"

    @property
    def is_overdue(self):
        return self.return_date is None and timezone.now().date() > self.due_date
