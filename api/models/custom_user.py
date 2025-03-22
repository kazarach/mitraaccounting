from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# Custom User Manager
class UserAccountManager(BaseUserManager):
    def create_user(self, username, password=None, role='user', **extra_fields):
        if not username:
            raise ValueError("The Username field must be set")
        user = self.model(username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, role='superuser', **extra_fields)

# Custom User Model
class UserAccount(AbstractUser):  
    ROLE_CHOICES = [
        ('superuser', 'Superuser'),
        ('master', 'Master'),
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('member', 'Member'),
        ('user', 'User'),
    ]

    # Keep username and remove email as unique field
    email = models.EmailField(blank=True, null=True)  # Email is optional
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    objects = UserAccountManager()  # Custom manager

    USERNAME_FIELD = 'username'  # Use username for authentication
    REQUIRED_FIELDS = []  # Only username and password are required

    def __str__(self):
        return f"{self.username} ({self.role})"
