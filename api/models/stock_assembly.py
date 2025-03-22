from django.db import models
from .stock import Stock
from ..models.unit import Unit

class StockAssembly(models.Model):
    parent_stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='assemblies')
    component_stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='used_in_assemblies')
    assembly_price_buy = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    assembly_amount = models.DecimalField(max_digits=15, decimal_places=2)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_manual_price = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.parent_stock.name} - {self.component_stock.name}"
    
    def calculate_component_cost(self):
        return (self.assembly_price_buy or self.component_stock.hpp) * self.assembly_amount
    
    class Meta:
        verbose_name = "Stock Assembly"
        verbose_name_plural = "Stock Assemblies"
        constraints = [
            models.UniqueConstraint(fields=['parent_stock', 'component_stock'], name='unique_component_per_assembly')
        ]
        indexes = [
            models.Index(fields=['parent_stock']),
            models.Index(fields=['component_stock'])
        ]
