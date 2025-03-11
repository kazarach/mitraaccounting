from django.db import models
from django.contrib.auth.models import User

class Sales(models.Model):
    sales_code = models.CharField(max_length=50, unique=True)
    sales_name = models.CharField(max_length=100)
    sales_address = models.TextField(blank=True, null=True)
    sales_phone = models.CharField(max_length=50, blank=True, null=True)
    sales_target = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    sales_note = models.TextField(blank=True, null=True)
    sales_pass = models.CharField(max_length=100, blank=True, null=True)
    changed = models.DateTimeField(auto_now=True)
    sales_active = models.BooleanField(default=True)
    # Link to Django User if needed
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='sales_profile')

    def __str__(self):
        return self.sales_name

    class Meta:
        verbose_name = "Sales"
        verbose_name_plural = "Sales"