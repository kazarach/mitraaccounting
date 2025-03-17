from django.db import models
from django.contrib.auth.models import User
from .sales_category import SalesCategory
from .member_type import MemberType

class Customer(models.Model):
    customer_code = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=100)
    customer_addr = models.TextField(blank=True, null=True)
    customer_telp = models.CharField(max_length=50, blank=True, null=True)
    customer_cont = models.CharField(max_length=100, blank=True, null=True)
    customer_npwp = models.CharField(max_length=50, blank=True, null=True)
    customer_platform = models.CharField(max_length=50, blank=True, null=True)
    customer_discount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    customer_discount_type = models.CharField(max_length=20, blank=True, null=True)
    spc = models.ForeignKey(SalesCategory, on_delete=models.SET_NULL, blank=True, null=True)
    customer_due = models.IntegerField(blank=True, null=True)
    mt = models.ForeignKey(MemberType, on_delete=models.SET_NULL, blank=True, null=True)
    customer_active = models.BooleanField(default=True)
    customer_point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    customer_date = models.DateField(blank=True, null=True)
    customer_duedate = models.DateField(blank=True, null=True)
    customer_user = models.CharField(max_length=50, blank=True, null=True)
    customer_pass = models.CharField(max_length=100, blank=True, null=True)
    changed = models.DateTimeField(auto_now=True)
    # Link to Django User model if needed
    user = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='customer_profile')

    def __str__(self):
        return self.customer_name

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"