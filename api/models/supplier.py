from django.db import models

class Supplier(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    npwp = models.CharField(max_length=50, blank=True, null=True)  # Tax ID (if applicable)
    platform = models.CharField(max_length=50, blank=True, null=True)
    
    credit_term_days = models.IntegerField(default=30)
    
    discount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount_type = models.CharField(max_length=20, blank=True, null=True)
    
    due_days = models.IntegerField(blank=True, null=True, help_text="Payment due in days")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
