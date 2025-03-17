from django.db import models

class SalesCategory(models.Model):
    spc_code = models.CharField(max_length=50, unique=True)
    spc_name = models.CharField(max_length=100)
    spc_margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    spc_status = models.BooleanField(default=True)
    spc_default = models.BooleanField(default=False)
    spc_type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.spc_name

    class Meta:
        verbose_name = "Sales Category"
        verbose_name_plural = "Sales Categories"