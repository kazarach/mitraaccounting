from django.db import models

class Supplier(models.Model):
    supplier_code = models.CharField(max_length=50, unique=True)
    supplier_name = models.CharField(max_length=100)
    supplier_addr = models.TextField(blank=True, null=True)
    supplier_telp = models.CharField(max_length=50, blank=True, null=True)
    supplier_cont = models.CharField(max_length=100, blank=True, null=True)
    supplier_npwp = models.CharField(max_length=50, blank=True, null=True)
    supplier_platform = models.CharField(max_length=50, blank=True, null=True)
    supplier_discount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    supplier_discount_type = models.CharField(max_length=20, blank=True, null=True)
    supplier_due = models.IntegerField(blank=True, null=True)
    supplier_active = models.BooleanField(default=True)

    def __str__(self):
        return self.supplier_name

    class Meta:
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"