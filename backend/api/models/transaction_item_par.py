from django.db import models
from django.utils import timezone
from .supplier import Supplier
from .customer import Customer
from .operator import Operator
from .sales import Sales

class TransItemPar(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    operator = models.ForeignKey(Operator, on_delete=models.SET_NULL, blank=True, null=True)
    tpr_number = models.CharField(max_length=50, unique=True)
    tpr_type = models.CharField(max_length=50, blank=True, null=True)
    tpr_date = models.DateTimeField(default=timezone.now)
    tpr_note = models.TextField(blank=True, null=True)
    tpr_status = models.CharField(max_length=20, blank=True, null=True)
    tpr_detail = models.TextField(blank=True, null=True)
    sales = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True)
    so_id = models.IntegerField(blank=True, null=True)  # Sales order ID

    def __str__(self):
        return self.tpr_number

    class Meta:
        verbose_name = "Transaction Item Par"
        verbose_name_plural = "Transaction Item Pars"