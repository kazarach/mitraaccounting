from django.db import models
from ..models.category import Category
from ..models.rack import Rack
from ..models.supplier import Supplier
from ..models.unit import Unit
from ..models.warehouse import Warehouse

class Stock(models.Model):
    code = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    hpp = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # Cost price
    price_buy = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    min_stock = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    max_stock = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True)
    rack = models.ForeignKey(Rack, on_delete=models.SET_NULL, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False)
    default_unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return self.name
        
    def get_available_quantity(self):
        return self.quantity
        
    def is_low_stock(self):
        return self.quantity < self.min_stock if self.min_stock is not None else False

    def update_margin_from_sell_price(self, sell_price):
        if self.hpp > 0:
            margin_amount = sell_price - self.hpp
            self.margin = (margin_amount / self.hpp) * 100
            self.save(update_fields=['margin'])
            return True
        return False

    class Meta:
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
