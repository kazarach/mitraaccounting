from django.db import models
from django.contrib.auth.models import User
from .member_type import MemberType
from django.conf import settings
from .stock_price import PriceCategory

class Customer(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    telp = models.CharField(max_length=50, blank=True, null=True)
    contact = models.CharField(max_length=100, blank=True, null=True)
    npwp = models.CharField(max_length=50, blank=True, null=True)

    price_category = models.ForeignKey(PriceCategory, on_delete=models.SET_NULL, 
                                     related_name='customers',
                                     blank=True, null=True)
    
    discount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    due_period = models.IntegerField(blank=True, null=True)
    member_type = models.ForeignKey(MemberType, on_delete=models.SET_NULL, blank=True, null=True)
    active = models.BooleanField(default=True)

    point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    customer_date = models.DateField(blank=True, null=True)
    duedate = models.DateField(blank=True, null=True)
    changed = models.DateTimeField(auto_now=True)
    
    credit_term_days = models.IntegerField(default=14)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"

