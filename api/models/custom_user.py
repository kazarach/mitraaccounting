from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# Dynamic Role Model
class UserRole(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

# Custom User Manager
class UserAccountManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username field must be set")
        
        # Extract role from extra_fields if it exists
        role = extra_fields.pop('role', None)
        if role is None:
            role = UserRole.objects.get_or_create(name="user")[0]  # Default to "user"
        
        user = self.model(username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        superuser_role, _ = UserRole.objects.get_or_create(name="superuser")
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        # Make sure to pop any role from extra_fields to avoid conflicts
        extra_fields.pop('role', None)
        
        return self.create_user(username, password, role=superuser_role, **extra_fields)

# Custom User Model
class UserAccount(AbstractUser):  
    role = models.ForeignKey(UserRole, on_delete=models.SET_NULL, blank=True, null=True)

    objects = UserAccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"
