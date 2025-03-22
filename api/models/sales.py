from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Sales(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    target = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Sales"
        verbose_name_plural = "Sales"
