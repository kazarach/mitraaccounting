from django.db import models
from .stock import Stock

class EventDisc(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    date_start = models.DateField(blank=True, null=True)
    date_end = models.DateField(blank=True, null=True)
    type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Event Discount"
        verbose_name_plural = "Event Discounts"

class EventDiscItem(models.Model):
    ed = models.ForeignKey(EventDisc, on_delete=models.CASCADE, related_name='items')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    disc = models.DecimalField(max_digits=10, decimal_places=2)
    disc_type = models.CharField(max_length=20)
    num = models.IntegerField(blank=True, null=True)
    set = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.ed.name} - {self.stock.stock_name}"

    class Meta:
        verbose_name = "Event Discount Item"
        verbose_name_plural = "Event Discount Items"