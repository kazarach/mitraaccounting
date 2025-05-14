from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from .stock import Stock
from django.conf import settings

class PriceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Price Category"
        verbose_name_plural = "Price Categories"

class StockPrice(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='sales_prices')
    price_category = models.ForeignKey(PriceCategory, on_delete=models.CASCADE)
    margin = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    margin_type = models.CharField(max_length=20, blank=True, null=True)
    price_sell = models.DecimalField(max_digits=15, decimal_places=2)
    is_default = models.BooleanField(default=False)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    allow_below_cost = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.stock.name} - {self.price_category.name}"
    
    def is_active(self):
        today = timezone.now().date()
        return (
            (self.start_date and self.start_date <= today) and
            (not self.end_date or today <= self.end_date)
        )
    
    def calculate_price_from_margin(self):
        if self.margin and self.stock.hpp:
            return self.stock.hpp * (1 + (self.margin / 100)) if self.margin_type == 'percentage' else self.stock.hpp + self.margin
        return None
    
    def clean(self):
        if not self.allow_below_cost and self.price_sell < self.stock.hpp + self.margin:
            raise ValidationError({
                'price_sell': f"Warning: The selling price ({self.price_sell}) is below cost price ({self.stock.hpp+self.margin})."
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Sales Price"
        verbose_name_plural = "Sales Prices"
        constraints = [
            models.UniqueConstraint(fields=['stock', 'price_category'], name='unique_sales_price_per_category')
        ]
        indexes = [
            models.Index(fields=['stock', 'is_default']),
            models.Index(fields=['start_date', 'end_date'])
        ]

class StockPriceHistory(models.Model):
    stock = models.ForeignKey('Stock', on_delete=models.CASCADE, related_name='price_history')
    price_category = models.ForeignKey('PriceCategory', on_delete=models.SET_NULL, null=True, blank=True)
    old_price = models.DecimalField(max_digits=15, decimal_places=2)
    new_price = models.DecimalField(max_digits=15, decimal_places=2)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    change_reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']