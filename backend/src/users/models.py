from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    # User Type Choices
    ROLE_ADMIN = "admin"
    ROLE_STUDENT = "student"
    ROLE_TEACHER = "teacher"
    ROLE_STAFF = "staff"
    ROLE_OTHER = "other"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_STUDENT, "Student"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_STAFF, "Staff"),
        (ROLE_OTHER, "Other"),
    ]

    phone_number = models.CharField(max_length=14, blank=True, null=True)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    penalty_points = models.IntegerField(default=0)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        blank=True, null=True
    )

    def __str__(self):
        return self.username + (' - ' + self.role if self.role else '')
