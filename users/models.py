from django.db import models
from django.contrib.auth.models import AbstractUser

from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    # User Type Choices
    USER_TYPE_STUDENT = "student"
    USER_TYPE_TEACHER = "teacher"
    USER_TYPE_STAFF = "staff"
    USER_TYPE_OTHER = "other"

    USER_TYPE_CHOICES = [
        (USER_TYPE_STUDENT, "Student"),
        (USER_TYPE_TEACHER, "Teacher"),
        (USER_TYPE_STAFF, "Staff"),
        (USER_TYPE_OTHER, "Other"),
    ]
    penalty_points = models.IntegerField(default=0)
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        blank=True, null=True
    )

    def __str__(self):
        return self.username + ' - ' + self.user_type if self.user_type else self.username
    