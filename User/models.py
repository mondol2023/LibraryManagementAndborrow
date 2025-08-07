from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    """
    Custom user model that extends the default Django user model.
    You can add additional fields here if needed.
    """
    # Example of adding a custom field
    # bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.username