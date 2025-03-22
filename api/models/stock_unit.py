from django.db import models
from .stock import Stock
from ..models.unit import Unit

class StockUnit(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='units')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    conversion = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    is_base_unit = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.stock.name} - {self.unit.name} ({self.conversion})"
    
    def convert_to_base(self, quantity):
        return quantity * self.conversion if self.conversion else quantity
    
    def convert_from_base(self, quantity):
        return quantity / self.conversion if self.conversion else quantity

    class Meta:
        verbose_name = "Stock Unit"
        verbose_name_plural = "Stock Units"
        constraints = [
            models.UniqueConstraint(fields=['stock', 'unit'], name='unique_unit_per_stock')
        ]
        indexes = [
            models.Index(fields=['stock', 'is_base_unit'])
        ]
