from django.db import models
from .stock import Stock

class EventDisc(models.Model):
    ed_code = models.CharField(max_length=50, unique=True)
    ed_name = models.CharField(max_length=100)
    ed_date_start = models.DateField(blank=True, null=True)
    ed_date_end = models.DateField(blank=True, null=True)
    ed_type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.ed_name

    class Meta:
        verbose_name = "Event Discount"
        verbose_name_plural = "Event Discounts"

class EventDiscItem(models.Model):
    ed = models.ForeignKey(EventDisc, on_delete=models.CASCADE, related_name='items')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    edi_disc = models.DecimalField(max_digits=10, decimal_places=2)
    edi_disc_type = models.CharField(max_length=20)
    edi_num = models.IntegerField(blank=True, null=True)
    edi_set = models.IntegerField(blank=True, null=True)
    edi_type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.ed.ed_name} - {self.stock.stock_name}"

    class Meta:
        verbose_name = "Event Discount Item"
        verbose_name_plural = "Event Discount Items"