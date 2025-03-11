from django.db import models
from django.contrib.auth.models import User
from .privilege import Privilege

class Operator(models.Model):
    privilege = models.ForeignKey(Privilege, on_delete=models.SET_NULL, blank=True, null=True)
    operator_status = models.BooleanField(default=True)
    operator_user = models.CharField(max_length=50, unique=True)
    operator_pass = models.CharField(max_length=100)
    operator_name = models.CharField(max_length=100)
    # Link to Django User model
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True, related_name='operator_profile')

    def __str__(self):
        return self.operator_name

    class Meta:
        verbose_name = "Operator"
        verbose_name_plural = "Operators"