from django.db import models
from .category import SubCategory
from .rack import Rack
from .supplier import Supplier
from .unit import Unit
from .warehouse import Warehouse
from .sales_category import SalesCategory

class Stock(models.Model):
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, blank=True, null=True)
    rack = models.ForeignKey(Rack, on_delete=models.SET_NULL, blank=True, null=True)
    stock_code = models.CharField(max_length=50, unique=True)
    stock_code2 = models.CharField(max_length=50, blank=True, null=True)
    stock_barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    stock_name = models.CharField(max_length=255)
    stock_type = models.CharField(max_length=50, blank=True, null=True)
    stock_margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    stock_hpp = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    stock_price_buy = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    stock_min = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    stock_max = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True, related_name='stock_unit')
    stock_active = models.BooleanField(default=True)
    gudang = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, blank=True, null=True)
    unit2 = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True, related_name='stock_unit2')
    unit3 = models.ForeignKey(Unit, on_delete=models.SET_NULL, blank=True, null=True, related_name='stock_unit3')
    unit2_conv = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    unit3_conv = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    stock_point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    changed = models.DateTimeField(auto_now=True)
    stock_online = models.BooleanField(default=False)

    def __str__(self):
        return self.stock_name

    class Meta:
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"
        indexes = [
            models.Index(fields=['stock_barcode']),
        ]


class StockAssembly(models.Model):
    stock_parent = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='assemblies')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='used_in_assemblies')
    stock_assembly_price_buy = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    stock_assembly_amount = models.DecimalField(max_digits=15, decimal_places=2)

    def __str__(self):
        return f"{self.stock_parent.stock_name} - {self.stock.stock_name}"

    class Meta:
        verbose_name = "Stock Assembly"
        verbose_name_plural = "Stock Assemblies"


class SalesPrice(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    spc = models.ForeignKey(SalesCategory, on_delete=models.CASCADE)
    sp_margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sp_margin_type = models.CharField(max_length=20, blank=True, null=True)
    stock_price_sell = models.DecimalField(max_digits=15, decimal_places=2)
    sp_default = models.BooleanField(default=False)
    sp_from = models.DateField(blank=True, null=True)
    sp_to = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.stock.stock_name} - {self.spc.spc_name}"

    class Meta:
        verbose_name = "Sales Price"
        verbose_name_plural = "Sales Prices"
        unique_together = ['stock', 'spc']